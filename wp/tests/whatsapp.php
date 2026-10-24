<?php
/** Integration tests: real WordPress, REST routes and MySQL; all outbound HTTP is intercepted. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI || 'local' !== wp_get_environment_type() ) {
	throw new RuntimeException( 'Run only through wp/tests/run-whatsapp.sh in its disposable local WordPress.' );
}
global $wpdb, $checks;
ob_start(); // CLI assertions print only after the raw webhook/header test has finished.
$checks = 0;
function wa_check( $name, $ok ) {
	global $checks;
	if ( ! $ok ) {
		throw new RuntimeException( 'FAIL ' . $name );
	}
	++$checks;
	echo 'PASS ' . $name . "\n";
}
function wa_rows() {
	global $wpdb;
	return $wpdb->get_results( 'SELECT * FROM ' . jpn_wa_table() . ' ORDER BY id', ARRAY_A );
}
function wa_job( $id ) {
	global $wpdb;
	return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . jpn_wa_table() . ' WHERE id = %d', $id ), ARRAY_A );
}
function wa_request( $data ) {
	$r = new WP_REST_Request( 'POST', '/' . JPN_NS . '/bookings' );
	$r->set_header( 'Content-Type', 'application/json' );
	$r->set_body( wp_json_encode( $data ) );
	return $r;
}
function wa_event( array $job, $state, $valid = true, $phone_id = '123456', $message_id = null ) {
	$status = array( 'id' => $message_id ?? $job['message_id'], 'recipient_id' => $job['recipient'], 'status' => $state, 'biz_opaque_callback_data' => 'jpn-wa-' . $job['id'] . '-a' . $job['attempts'], 'errors' => array( array( 'code' => 131026 ) ) );
	$body = wp_json_encode( array( 'object' => 'whatsapp_business_account', 'entry' => array( array( 'changes' => array( array( 'field' => 'messages', 'value' => array( 'metadata' => array( 'phone_number_id' => $phone_id ), 'statuses' => array( $status ) ) ) ) ) ) ) );
	$r = new WP_REST_Request( 'POST', '/' . JPN_NS . '/whatsapp/webhook' );
	$r->set_header( 'Content-Type', 'application/json' );
	$r->set_body( $body );
	$r->set_header( 'X-Hub-Signature-256', $valid ? 'sha256=' . hash_hmac( 'sha256', $body, JPN_WA_APP_SECRET ) : 'sha256=bad' );
	return rest_do_request( $r );
}

// This test process has no credentials until the explicit test-only configuration below.
wa_check( 'sending is disabled by default', ! jpn_wa_ready() );
wa_check( 'missing credentials are reported without values', in_array( 'ACCESS_TOKEN', jpn_wa_missing(), true ) );
$wpdb->query( 'DELETE FROM ' . jpn_wa_table() );
$wpdb->query( 'DELETE FROM ' . jpn_bookings_table() );
update_option( 'jpn_content_live', jpn_default_content(), false );
update_option( 'jpn_leave', array(), false );
update_option( 'jpn_closed', array(), false );
$schedule = jpn_schedule();
$schedule['arekere'] = array( 'days' => array( 1, 2, 3, 4, 5, 6 ), 'sessions' => array( array( 540, 780 ), array( 960, 1260 ) ), 'slot' => 30, 'own' => array() );
update_option( 'jpn_schedule', $schedule, false );
$day = ( new DateTimeImmutable( 'next monday', new DateTimeZone( 'Asia/Kolkata' ) ) )->modify( '+14 days' )->format( 'Y-m-d' );
$input = array( 'branch' => 'arekere', 'date' => $day, 'time' => 540, 'name' => 'Test Patient', 'phone' => '9876543201', 'problem' => 'PRIVATE SYMPTOM', 'note' => 'PRIVATE NOTE' );
foreach ( array( null, false, 'false', 'true', 1, array( true ) ) as $consent ) {
	$data = jpn_booking_from_request( wa_request( array_merge( $input, array( 'whatsapp_consent' => $consent ) ) ) );
	wa_check( 'consent must be the JSON boolean true: ' . wp_json_encode( $consent ), false === $data['whatsapp_consent'] );
}
$disabled = jpn_create_booking( jpn_booking_from_request( wa_request( array_merge( $input, array( 'whatsapp_consent' => true ) ) ) ) );
wa_check( 'disabled integration leaves booking successful and queues nothing', ! is_wp_error( $disabled ) && 0 === count( wa_rows() ) );
jpn_set_status( $disabled['id'], 'cancelled' );

define( 'JPN_WA_ENABLED', true );
define( 'JPN_WA_ACCESS_TOKEN', 'test-only-not-a-token' );
define( 'JPN_WA_PHONE_NUMBER_ID', '123456' );
define( 'JPN_WA_GRAPH_VERSION', 'v99.0' ); // Deliberately fictitious: no call may reach Meta.
define( 'JPN_WA_APP_SECRET', 'local-test-app-secret' );
define( 'JPN_WA_VERIFY_TOKEN', 'local-test-verify-token' );
define( 'JPN_WA_CLINIC_OPT_IN', true );
define( 'JPN_WA_CLINIC_RECIPIENTS', array( '*' => array( '+91 99999 99999', '919999999999', 'invalid' ), 'jpnagar' => array( '918888888888' ) ) );
wa_check( 'complete explicit configuration enables sending', jpn_wa_ready() );
wa_check( 'clinic numbers are normalized, validated and deduplicated', array( '919999999999' ) === jpn_wa_clinic_recipients( 'arekere' ) );
jpn_wa_schedule();
wa_check( 'a recurring queue worker is scheduled', false !== wp_next_scheduled( 'jpn_wa_tick' ) );

$sent = array();
$mode = 'success';
add_filter( 'pre_http_request', function ( $pre, $args, $url ) use ( &$sent, &$mode ) {
	if ( 0 !== strpos( $url, 'https://graph.facebook.com/' ) ) {
		return new WP_Error( 'wa_test_blocked', 'All network access is blocked in these tests.' );
	}
	$payload = json_decode( $args['body'], true );
	$sent[] = $payload;
	wa_check( 'request uses configured version, sender and server-side authorization', 'https://graph.facebook.com/v99.0/123456/messages' === $url && 'Bearer test-only-not-a-token' === $args['headers']['Authorization'] && 0 === $args['redirection'] );
	wa_check( 'symptoms and clinical notes are excluded', false === strpos( $args['body'], 'PRIVATE' ) );
	if ( 'timeout' === $mode ) {
		return new WP_Error( 'http_request_failed', 'timeout' );
	}
	if ( 'early_callback' === $mode ) {
		preg_match( '/^jpn-wa-(\d+)-/', $payload['biz_opaque_callback_data'], $m );
		wa_event( wa_job( $m[1] ), 'delivered', true, '123456', 'wamid.test.' . count( $sent ) );
	}
	$http = array( 'rate_limit' => 429, 'server_error' => 503, 'permanent' => 400, 'missing_id' => 200 )[ $mode ] ?? 200;
	$body = $http >= 400 ? array( 'error' => array( 'code' => 429 === $http ? 130429 : 190 ) ) : ( 'missing_id' === $mode ? array() : array( 'messages' => array( array( 'id' => 'wamid.test.' . count( $sent ) ) ) ) );
	return array( 'headers' => array(), 'body' => wp_json_encode( $body ), 'response' => array( 'code' => $http, 'message' => 'Test response' ) );
}, 10, 3 );

foreach ( jpn_limit_keys( $input['phone'] ) as $key ) {
	delete_transient( $key[0] );
}
$result = rest_do_request( wa_request( array_merge( $input, array( 'whatsapp_consent' => true ) ) ) );
wa_check( 'public booking succeeds with consent', 200 === $result->get_status() );
$booking = jpn_get_booking( $result->get_data()['id'] );
wa_check( 'patient and clinic jobs queued without network on booking request', 2 === count( wa_rows() ) && ! $sent );
$jobs = wa_rows();
wa_check( 'patient consent text and time recorded', JPN_WA_CONSENT_TEXT === $jobs[0]['consent_text'] && (int) $jobs[0]['consent_at'] > 0 );
jpn_wa_enqueue( $booking, array( 'whatsapp_consent' => true ) );
wa_check( 'duplicate booking event cannot duplicate jobs', 2 === count( wa_rows() ) );
$taken = rest_do_request( wa_request( array_merge( $input, array( 'whatsapp_consent' => true ) ) ) );
wa_check( 'taken slot queues no messages', 409 === $taken->get_status() && 2 === count( wa_rows() ) );
$input['time'] = 570;
$input['phone'] = '9876543202';
$no_consent = rest_do_request( wa_request( array_merge( $input, array( 'whatsapp_consent' => false ) ) ) );
wa_check( 'without patient consent only clinic is notified', 200 === $no_consent->get_status() && 3 === count( wa_rows() ) && 'clinic' === wa_rows()[2]['kind'] );

jpn_wa_process();
wa_check( 'worker accepts all three jobs', 3 === count( $sent ) && array( 'accepted' ) === array_values( array_unique( wp_list_pluck( wa_rows(), 'status' ) ) ) );
wa_check( 'patient template has six correctly ordered fields', 'jpn_booking_confirmation' === $sent[0]['template']['name'] && 6 === count( $sent[0]['template']['components'][0]['parameters'] ) && 'Test Patient' === $sent[0]['template']['components'][0]['parameters'][0]['text'] && 'JP-ARK-' . str_pad( $booking['id'], 5, '0', STR_PAD_LEFT ) === $sent[0]['template']['components'][0]['parameters'][5]['text'] );
wa_check( 'clinic template has seven fields', 'jpn_booking_alert' === $sent[1]['template']['name'] && 7 === count( $sent[1]['template']['components'][0]['parameters'] ) );
jpn_wa_process();
wa_check( 'repeated worker does not resend accepted messages', 3 === count( $sent ) );
$job = wa_rows()[0];
wa_check( 'unsigned webhook rejected', 403 === wa_event( $job, 'read', false )->get_status() && 'accepted' === wa_job( $job['id'] )['status'] );
wa_event( $job, 'read', true, 'other-sender' );
wa_check( 'webhooks for other sender numbers ignored', 'accepted' === wa_job( $job['id'] )['status'] );
wa_event( $job, 'delivered' );
wa_check( 'signed delivery callback advances state', 'delivered' === wa_job( $job['id'] )['status'] );
wa_event( $job, 'sent' );
wa_event( $job, 'failed' );
wa_check( 'late sent or failed events cannot undo delivered', 'delivered' === wa_job( $job['id'] )['status'] );
wa_event( $job, 'read' );
wa_event( $job, 'delivered' );
wa_check( 'read state cannot regress', 'read' === wa_job( $job['id'] )['status'] );

// Reuse one job to test each independent failure path in the real worker.
$test_id = wa_rows()[1]['id'];
function wa_reset_job( $id, $attempts = 0, $status = 'pending', $updated = null ) {
	global $wpdb;
	$wpdb->update( jpn_wa_table(), array( 'status' => $status, 'attempts' => $attempts, 'available_at' => time() - 1, 'message_id' => null, 'error_code' => '', 'updated_at' => $updated ?? time() ), array( 'id' => $id ) );
}
foreach ( array( 'rate_limit', 'server_error' ) as $mode ) {
	wa_reset_job( $test_id );
	jpn_wa_process();
	$retry = wa_job( $test_id );
	wa_check( $mode . ' uses a delayed bounded retry', 'pending' === $retry['status'] && 1 === (int) $retry['attempts'] && (int) $retry['available_at'] > time() );
	$count = count( $sent );
	jpn_wa_process();
	wa_check( 'backoff prevents immediate resend for ' . $mode, count( $sent ) === $count );
}
$mode = 'rate_limit';
wa_reset_job( $test_id, 4 );
jpn_wa_process();
wa_check( 'five failed attempts terminate retries', 'failed' === wa_job( $test_id )['status'] && 5 === (int) wa_job( $test_id )['attempts'] );
$mode = 'permanent';
wa_reset_job( $test_id );
jpn_wa_process();
wa_check( 'permanent API rejection fails without retry or cancelling booking', 'failed' === wa_job( $test_id )['status'] && 'booked' === jpn_get_booking( $booking['id'] )['status'] );
foreach ( array( 'timeout', 'missing_id' ) as $mode ) {
	wa_reset_job( $test_id );
	jpn_wa_process();
	wa_check( $mode . ' is ambiguous and is not blindly retried', 'unknown' === wa_job( $test_id )['status'] );
	$count = count( $sent );
	jpn_wa_process();
	wa_check( 'ambiguous delivery does not send twice', $count === count( $sent ) );
}
$unknown = wa_job( $test_id );
wa_event( $unknown, 'delivered', true, '123456', 'wamid.late' );
wa_check( 'late signed callback resolves an ambiguous send', 'delivered' === wa_job( $test_id )['status'] );
$mode = 'early_callback';
wa_reset_job( $test_id );
jpn_wa_process();
wa_check( 'callback arriving before HTTP response is preserved', 'delivered' === wa_job( $test_id )['status'] );
wa_reset_job( $test_id, 1, 'sending', time() - 600 );
$count = count( $sent );
jpn_wa_process();
wa_check( 'crashed worker is marked unknown rather than resent', 'unknown' === wa_job( $test_id )['status'] && $count === count( $sent ) );
wa_reset_job( $test_id );
jpn_set_status( $booking['id'], 'cancelled' );
jpn_wa_process();
wa_check( 'cancellation before dispatch skips confirmation', 'skipped' === wa_job( $test_id )['status'] && $count === count( $sent ) );

$verify = new WP_REST_Request( 'GET', '/' . JPN_NS . '/whatsapp/webhook' );
$verify->set_query_params( array( 'hub.mode' => 'subscribe', 'hub.verify_token' => JPN_WA_VERIFY_TOKEN, 'hub.challenge' => '0123456789' ) );
$result = rest_do_request( $verify );
ob_start();
jpn_wa_serve_challenge( false, $result, $verify, rest_get_server() );
$challenge = ob_get_clean();
wa_check( 'webhook challenge returned verbatim without JSON quoting', 200 === $result->get_status() && '0123456789' === $challenge );
$verify->set_query_params( array( 'hub_mode' => 'subscribe', 'hub_verify_token' => 'bad', 'hub_challenge' => '123' ) );
wa_check( 'wrong verification token rejected', 403 === rest_do_request( $verify )->get_status() );
$verify->set_query_params( array( 'hub_mode' => 'subscribe', 'hub_verify_token' => JPN_WA_VERIFY_TOKEN, 'hub_challenge' => '<script>' ) );
wa_check( 'invalid challenge cannot inject markup', 403 === rest_do_request( $verify )->get_status() );
wp_set_current_user( 0 );
$request = new WP_REST_Request( 'GET', '/' . JPN_NS . '/admin/whatsapp' );
wa_check( 'diagnostics are owner-only', in_array( rest_do_request( $request )->get_status(), array( 401, 403 ), true ) );
wp_set_current_user( 1 );
$status = rest_do_request( $request );
$json = wp_json_encode( $status->get_data() );
wa_check( 'owner can read diagnostics without credentials or patient details', 200 === $status->get_status() && false === strpos( $json, JPN_WA_ACCESS_TOKEN ) && false === strpos( $json, '9876543201' ) && false === strpos( $json, 'Test Patient' ) );
wa_check( 'database operations finish without SQL errors', '' === $wpdb->last_error );
echo "\n{$checks} WhatsApp checks passed. All Meta requests were simulated.\n";
ob_end_flush();
