#!/usr/bin/env bash
# Empties the local diary for a fresh test: every booking, leave day and closed day, the spam-limit counters, any
# queued WhatsApp messages, and the local email inbox. Content, doctors, photos and hours are kept.
# Local only: it talks to the Docker WordPress in this folder, never to the live site.
set -euo pipefail
cd "$(dirname "$0")"
wp() { docker compose run --rm -T cli wp "$@" 2>/dev/null; }
wp eval '
global $wpdb;
$wpdb->query( "TRUNCATE TABLE " . jpn_bookings_table() );
if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $wpdb->prefix . "jpn_whatsapp" ) ) ) {
	$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}jpn_whatsapp" );
}
update_option( "jpn_leave", array(), false );
update_option( "jpn_closed", array(), false );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE \"_transient_jpn_rl_%\" OR option_name LIKE \"_transient_timeout_jpn_rl_%\"" );
echo "Bookings: " . (int) $wpdb->get_var( "SELECT COUNT(*) FROM " . jpn_bookings_table() ) . ", leave days: " . count( jpn_leave() ) . ", closed days: " . count( jpn_closed() ) . "\n";
'
curl -s -X DELETE http://localhost:8025/api/v1/messages >/dev/null && echo "Email inbox emptied (http://localhost:8025)" || true
