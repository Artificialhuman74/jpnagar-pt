<?php
/**
 * The clinic admin on its own address, served by this same WordPress: admin.<site>, or staging-admin.<site> for the
 * staging copy (staging.<site>). On that address WordPress uses it for its own links as well, so the owner's login,
 * its cookie, the REST nonce and every redirect stay on the admin address, and the admin page reaches the API
 * without crossing to another site. The address is never indexed. Visitors' addresses are not affected.
 * The web server sends the admin address's home page to /admin/ (see the site's .htaccess). It serves only the admin,
 * the login, wp-admin and the API: a visitor page asked for there is sent to the visitors' address, so no page is ever
 * drawn with the admin address in its links, and none can reach a page cache that doesn't tell the two apart.
 */

defined( 'ABSPATH' ) || exit;

/** The admin address for this site; the jpn_admin_host filter can name another. */
function jpn_admin_host() {
	$host  = preg_replace( '/^www\./', '', (string) wp_parse_url( get_option( 'home' ), PHP_URL_HOST ) );
	$admin = 0 === strpos( $host, 'staging.' ) ? 'staging-admin.' . substr( $host, 8 ) : 'admin.' . $host;
	return strtolower( (string) apply_filters( 'jpn_admin_host', $admin ) );
}

/** The host this request came to, without its port, or '' when there is none. */
function jpn_request_host() {
	$host = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) ) : '';
	return (string) preg_replace( '/:\d+$/', '', $host );
}

function jpn_admin_host_setup() {
	// worked out before the filters below change what get_option( 'home' ) returns
	if ( '' === jpn_request_host() || jpn_request_host() !== jpn_admin_host() ) {
		return;
	}
	// the visitors' address, before the filters below swap it; and the request's own host and port (already matched)
	$visit = untrailingslashit( (string) get_option( 'home' ) );
	$base  = ( is_ssl() ? 'https://' : 'http://' ) . strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) );
	foreach ( array( 'home', 'siteurl' ) as $option ) {
		add_filter(
			'option_' . $option,
			function ( $url ) use ( $base ) {
				return $base . untrailingslashit( (string) wp_parse_url( (string) $url, PHP_URL_PATH ) );
			}
		);
	}
	// no bouncing back to the visitors' address for the login and the API; a visitor page goes there instead
	remove_action( 'template_redirect', 'redirect_canonical' );
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	add_action(
		'template_redirect',
		function () use ( $visit ) {
			$path = isset( $_SERVER['REQUEST_URI'] ) ? '/' . ltrim( wp_unslash( $_SERVER['REQUEST_URI'] ), '/' ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- passed to wp_redirect, which sanitizes it
			nocache_headers();
			wp_redirect( $visit . $path, 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- the site's own visitors' address
			exit;
		},
		0
	);
	add_action(
		'send_headers',
		function () {
			header( 'X-Robots-Tag: noindex, nofollow', true );
		}
	);
	add_filter( 'wp_robots', 'wp_robots_no_robots' );
}
