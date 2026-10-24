<?php
/**
 * Reading and cleaning the clinic's data. Settings live in options (never autoloaded); bookings live in their own
 * table (install.php). Content has a draft the owner edits and a live copy that only Publish replaces.
 */

defined( 'ABSPATH' ) || exit;

/* mbstring isn't guaranteed on shared hosting; without it, PCRE's UTF-8 mode counts characters so none is cut in half */
function jpn_chars( $s ) {
	return preg_match_all( '/./us', (string) $s, $m ) ? $m[0] : array();
}
function jpn_substr( $s, $start, $len ) {
	return function_exists( 'mb_substr' ) ? mb_substr( $s, $start, $len, 'UTF-8' ) : implode( '', array_slice( jpn_chars( $s ), $start, $len ) );
}
function jpn_strlen( $s ) {
	return function_exists( 'mb_strlen' ) ? mb_strlen( $s, 'UTF-8' ) : count( jpn_chars( $s ) );
}

function jpn_branches() {
	return (array) get_option( 'jpn_branches', array() );
}
function jpn_branch_ids() {
	return array_keys( jpn_branches() );
}
function jpn_schedule() {
	return (array) get_option( 'jpn_schedule', array() );
}
function jpn_leave() {
	return (array) get_option( 'jpn_leave', array() );
}
function jpn_closed() {
	return (array) get_option( 'jpn_closed', array() );
}
function jpn_content( $which = 'live' ) {
	return (array) get_option( 'live' === $which ? 'jpn_content_live' : 'jpn_content_draft', array() );
}
/** Bookable doctors are the published ones: what the website shows is what patients can book. */
function jpn_live_doctors() {
	$c = jpn_content( 'live' );
	return isset( $c['doctors'] ) ? (array) $c['doctors'] : array();
}
function jpn_doctor( $id ) {
	foreach ( jpn_live_doctors() as $d ) {
		if ( $d['id'] === $id ) {
			return $d;
		}
	}
	return null;
}
function jpn_doctor_at( $id, $branch ) {
	$d = jpn_doctor( $id );
	return $d && in_array( $branch, (array) $d['branches'], true );
}
function jpn_doctors_at( $branch ) {
	return array_values(
		array_filter(
			jpn_live_doctors(),
			function ( $d ) use ( $branch ) {
				return in_array( $branch, (array) $d['branches'], true );
			}
		)
	);
}

/* ---------- validation: everything that arrives from a browser goes through one of these ---------- */

function jpn_clean_branch( $id ) {
	$id = sanitize_key( (string) $id );
	return in_array( $id, jpn_branch_ids(), true ) ? $id : null;
}

/** A date the clinic can take bookings for: Y-m-d, today or later, within the next 60 days, in the clinic's time zone. */
function jpn_clean_date( $date, $allow_past = false ) {
	$d = DateTimeImmutable::createFromFormat( '!Y-m-d', (string) $date, wp_timezone() );
	if ( ! $d || $d->format( 'Y-m-d' ) !== $date ) {
		return null;
	}
	$today = new DateTimeImmutable( 'today', wp_timezone() );
	if ( ! $allow_past && $d < $today ) {
		return null;
	}
	if ( $d > $today->modify( '+60 days' ) ) {
		return null;
	}
	return $d;
}

/** Indian mobile number: 10 digits starting 6-9, any spaces or +91 removed. */
function jpn_clean_phone( $phone ) {
	$digits = preg_replace( '/\D+/', '', (string) $phone );
	if ( 12 === strlen( $digits ) && 0 === strpos( $digits, '91' ) ) {
		$digits = substr( $digits, 2 );
	}
	return preg_match( '/^[6-9]\d{9}$/', $digits ) ? $digits : null;
}

/** Timings: days 0-6 (Sunday is 0), up to three sessions in minutes from midnight, a slot length the admin offers. */
function jpn_clean_timings( $t ) {
	if ( ! is_array( $t ) ) {
		return null;
	}
	$days = array_values( array_unique( array_filter( array_map( 'intval', (array) ( $t['days'] ?? array() ) ), function ( $d ) {
		return $d >= 0 && $d <= 6;
	} ) ) );
	sort( $days );
	$sessions = array();
	foreach ( array_slice( (array) ( $t['sessions'] ?? array() ), 0, 3 ) as $s ) {
		$a = (int) ( $s[0] ?? -1 );
		$b = (int) ( $s[1] ?? -1 );
		if ( $a >= 0 && $b <= 1440 && $b > $a ) {
			$sessions[] = array( $a, $b );
		}
	}
	$slot = (int) ( $t['slot'] ?? 30 );
	if ( ! in_array( $slot, array( 15, 20, 30, 45, 60 ), true ) ) {
		return null;
	}
	return array(
		'days'     => $days,
		'sessions' => $sessions,
		'slot'     => $slot,
	);
}

function jpn_clean_lines( $list, $max = 12, $len = 160 ) {
	$out = array();
	foreach ( array_slice( (array) $list, 0, $max ) as $line ) {
		$line = trim( sanitize_text_field( (string) $line ) );
		if ( '' !== $line ) {
			$out[] = jpn_substr( $line, 0, $len );
		}
	}
	return $out;
}

/** A doctor's card as the admin sends it. Photo is an attachment id this plugin created (images.php). */
function jpn_clean_doctor( $d ) {
	if ( ! is_array( $d ) ) {
		return null;
	}
	$name = jpn_substr( trim( sanitize_text_field( (string) ( $d['name'] ?? '' ) ) ), 0, 80 );
	$id   = sanitize_key( (string) ( $d['id'] ?? '' ) );
	if ( strlen( $name ) < 3 || '' === $id ) {
		return null;
	}
	$branches = array_values( array_intersect( jpn_branch_ids(), array_map( 'sanitize_key', (array) ( $d['branches'] ?? array() ) ) ) );
	$photo    = absint( $d['photo'] ?? 0 );
	if ( $photo && ! get_post_meta( $photo, '_jpn_photo', true ) ) {
		$photo = 0;
	}
	return array(
		'id'       => jpn_substr( $id, 0, 40 ),
		'name'     => $name,
		'role'     => jpn_substr( sanitize_text_field( (string) ( $d['role'] ?? '' ) ), 0, 80 ),
		'years'    => jpn_substr( sanitize_text_field( (string) ( $d['years'] ?? '' ) ), 0, 30 ),
		'deg'      => jpn_clean_lines( $d['deg'] ?? array(), 10, 20 ),
		'treats'   => jpn_clean_lines( $d['treats'] ?? array(), 12, 80 ),
		'bg'       => jpn_clean_lines( $d['bg'] ?? array(), 8, 160 ),
		'branches' => $branches,
		'photo'    => $photo,
	);
}

/** The whole content draft as the admin sends it. Anything unknown is dropped. */
function jpn_clean_content( $c ) {
	if ( ! is_array( $c ) ) {
		return null;
	}
	$out = array(
		'home'     => array(
			'headline' => jpn_substr( sanitize_text_field( (string) ( $c['home']['headline'] ?? '' ) ), 0, 60 ),
			'intro'    => jpn_substr( sanitize_text_field( (string) ( $c['home']['intro'] ?? '' ) ), 0, 160 ),
		),
		'services' => array(),
		'photos'   => array(),
		'branches' => array(),
		'doctors'  => array(),
	);
	foreach ( (array) ( $c['services'] ?? array() ) as $id => $text ) {
		$out['services'][ sanitize_key( $id ) ] = jpn_substr( sanitize_textarea_field( (string) $text ), 0, 220 );
	}
	foreach ( array_slice( (array) ( $c['photos'] ?? array() ), 0, 6 ) as $p ) {
		$id = absint( is_array( $p ) ? ( $p['id'] ?? 0 ) : $p );
		if ( $id && get_post_meta( $id, '_jpn_photo', true ) ) {
			$out['photos'][] = array(
				'id'    => $id,
				'label' => jpn_substr( sanitize_text_field( (string) ( $p['label'] ?? '' ) ), 0, 60 ),
			);
		}
	}
	foreach ( jpn_branches() as $id => $b ) {
		$in                     = (array) ( $c['branches'][ $id ] ?? array() );
		$out['branches'][ $id ] = array(
			'name'     => $b['name'],
			'phone'    => jpn_substr( preg_replace( '/[^0-9+ ]/', '', (string) ( $in['phone'] ?? $b['phone'] ) ), 0, 20 ),
			'addr'     => jpn_substr( sanitize_textarea_field( (string) ( $in['addr'] ?? $b['addr'] ) ), 0, 240 ),
			'landmark' => jpn_substr( sanitize_text_field( (string) ( $in['landmark'] ?? $b['landmark'] ) ), 0, 60 ),
		);
	}
	$seen = array();
	foreach ( array_slice( (array) ( $c['doctors'] ?? array() ), 0, 60 ) as $d ) {
		$clean = jpn_clean_doctor( $d );
		if ( $clean && ! isset( $seen[ $clean['id'] ] ) ) {
			$seen[ $clean['id'] ] = true;
			$out['doctors'][]     = $clean;
		}
	}
	return $out;
}
