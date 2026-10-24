<?php
/**
 * The website's copy of the content: one static file, rebuilt only when the owner publishes or the timings change.
 * Pages load it as a script (window.PUBLISHED_DATA, the same shape the demo's canon/published.js reads), so a visit
 * never queries the database for content. A gzip copy sits beside it for servers set up to serve it; the page cache
 * is cleared once per publish.
 */

defined( 'ABSPATH' ) || exit;

function jpn_snapshot_dir() {
	$u = wp_upload_dir( null, false );
	return array(
		'path' => trailingslashit( $u['basedir'] ) . 'jpnagar',
		'url'  => trailingslashit( $u['baseurl'] ) . 'jpnagar',
	);
}

/** The snapshot's public URL, versioned so browsers and Cloudflare fetch the new one after each publish. */
function jpn_snapshot_url() {
	$d = jpn_snapshot_dir();
	return $d['url'] . '/site-data.js?v=' . rawurlencode( (string) get_option( 'jpn_snapshot_version', '0' ) );
}

function jpn_photo_url( $id ) {
	$url = $id ? wp_get_attachment_url( $id ) : '';
	return $url ? $url : null;
}

/** Content (the live copy unless given) plus the current timings, in the shape the pages read. */
function jpn_build_snapshot( $content = null ) {
	$c        = null === $content ? jpn_content( 'live' ) : $content;
	$schedule = jpn_schedule();
	$branches = array();
	foreach ( jpn_branches() as $id => $b ) {
		$info              = $c['branches'][ $id ] ?? array();
		$sc                = $schedule[ $id ] ?? array( 'days' => array(), 'sessions' => array() );
		$branches[ $id ]   = array(
			'name'     => $b['name'],
			'phone'    => $info['phone'] ?? $b['phone'],
			'addr'     => $info['addr'] ?? $b['addr'],
			'landmark' => $info['landmark'] ?? $b['landmark'],
			// the pages work in hours (9.5 = 9:30 am)
			'sessions' => array_map(
				function ( $s ) {
					return array( $s[0] / 60, $s[1] / 60 );
				},
				$sc['sessions']
			),
			'days'     => $sc['days'],
		);
	}
	$doctors = array();
	foreach ( (array) ( $c['doctors'] ?? array() ) as $d ) {
		$doctors[] = array(
			'id'       => $d['id'],
			'name'     => $d['name'],
			'role'     => $d['role'],
			'years'    => $d['years'],
			'deg'      => $d['deg'],
			'treats'   => $d['treats'],
			'bg'       => $d['bg'],
			'branches' => $d['branches'],
			'photo'    => jpn_photo_url( $d['photo'] ),
		);
	}
	$photos = array();
	foreach ( (array) ( $c['photos'] ?? array() ) as $p ) {
		$url = jpn_photo_url( $p['id'] );
		if ( $url ) {
			$photos[] = array(
				'src'   => $url,
				'label' => $p['label'],
			);
		}
	}
	return array(
		'v'        => 1,
		'at'       => (int) round( microtime( true ) * 1000 ),
		'home'     => $c['home'] ?? new stdClass(),
		'services' => (object) ( $c['services'] ?? array() ),
		'photos'   => $photos,
		'branches' => $branches,
		'doctors'  => $doctors,
	);
}

/**
 * Writes site-data.js (and .gz), bumps the version and clears the page cache. Returns the URL or WP_Error.
 * Callers hold the booking lock (jpn_locked), so two writes never overlap and an older one can't land last.
 */
function jpn_write_snapshot( $content = null ) {
	$dir = jpn_snapshot_dir();
	if ( ! wp_mkdir_p( $dir['path'] ) ) {
		return new WP_Error( 'jpn_write', __( 'Could not create the uploads folder for the website file.', 'jpnagar-clinic' ), array( 'status' => 500 ) );
	}
	$json = wp_json_encode( jpn_build_snapshot( $content ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	$body = 'window.PUBLISHED_DATA = ' . $json . ";\n";
	$file = $dir['path'] . '/site-data.js';
	$fail = new WP_Error( 'jpn_write', __( 'Could not save the website file.', 'jpnagar-clinic' ), array( 'status' => 500 ) );
	$gz   = function_exists( 'gzencode' ) ? gzencode( $body, 9 ) : false;
	// both copies are written in full before either replaces the old ones, so the .js and .gz never disagree
	$tmp_js = jpn_write_temp( $file, $body );
	$tmp_gz = false === $gz ? null : jpn_write_temp( $file . '.gz', $gz );
	if ( ! $tmp_js || false === $tmp_gz ) {
		foreach ( array( $tmp_js, $tmp_gz ) as $t ) {
			if ( $t ) {
				wp_delete_file( $t );
			}
		}
		return $fail;
	}
	if ( ! rename( $tmp_js, $file ) ) {
		wp_delete_file( $tmp_js );
		if ( $tmp_gz ) {
			wp_delete_file( $tmp_gz );
		}
		return $fail;
	}
	if ( null === $tmp_gz || ! rename( $tmp_gz, $file . '.gz' ) ) {
		// no gzip this time (no zlib, or the swap failed): remove the old .gz so the server can't serve stale content
		if ( $tmp_gz ) {
			wp_delete_file( $tmp_gz );
		}
		wp_delete_file( $file . '.gz' );
	}
	// a fresh version for every write, even two in the same second; autoloaded, so no extra query on page views
	update_option( 'jpn_snapshot_version', sprintf( '%d-%s', time(), wp_generate_password( 6, false ) ), true );
	jpn_clear_page_cache();
	do_action( 'jpn_snapshot_written', $file );
	return jpn_snapshot_url();
}

/**
 * Writes the whole of $data to its own temporary name beside $file and returns that name, or false. The caller
 * renames it over $file, so a reader never sees half a file. A short write counts as a failure.
 */
function jpn_write_temp( $file, $data ) {
	$tmp     = $file . '.' . wp_generate_password( 8, false ) . '.tmp';
	$written = file_put_contents( $tmp, $data );
	if ( strlen( $data ) !== $written ) {
		wp_delete_file( $tmp );
		return false;
	}
	return $tmp;
}

/** Clears the page cache of whichever free cache plugin is installed, so pages pick up the new file. */
function jpn_clear_page_cache() {
	if ( function_exists( 'wpfc_clear_all_cache' ) ) {
		wpfc_clear_all_cache( true ); // WP Fastest Cache, the one the live site uses
	}
	if ( function_exists( 'rocket_clean_domain' ) ) {
		rocket_clean_domain();
	}
	if ( function_exists( 'w3tc_flush_all' ) ) {
		w3tc_flush_all();
	}
	do_action( 'litespeed_purge_all' );
}

/** Patient pages load the snapshot right before the demo's published.js. */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_register_script( 'jpn-site-data', jpn_snapshot_url(), array(), null, true );
	}
);
