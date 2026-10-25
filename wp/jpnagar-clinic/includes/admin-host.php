<?php
/**
 * The clinic admin on its own address, served by this same WordPress: admin.<site>, or staging-admin.<site> for the
 * staging copy (staging.<site>). On that address WordPress uses it for its own links as well, so the owner's login,
 * its cookie, the REST nonce and every redirect stay on the admin address, and the admin page reaches the API
 * without crossing to another site. The address is never indexed. Visitors' addresses are not affected.
 * The web server sends the admin address's home page to /admin/ (see the site's .htaccess).
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
	// the request's own host and port (already matched to the admin address above)
	$base = ( is_ssl() ? 'https://' : 'http://' ) . strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) );
	foreach ( array( 'home', 'siteurl' ) as $option ) {
		add_filter(
			'option_' . $option,
			function ( $url ) use ( $base ) {
				return $base . untrailingslashit( (string) wp_parse_url( (string) $url, PHP_URL_PATH ) );
			}
		);
	}
	// no bouncing back to the visitors' address
	remove_action( 'template_redirect', 'redirect_canonical' );
	add_action(
		'send_headers',
		function () {
			header( 'X-Robots-Tag: noindex, nofollow', true );
		}
	);
	add_filter( 'wp_robots', 'wp_robots_no_robots' );
}
