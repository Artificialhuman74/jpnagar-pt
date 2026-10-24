<?php
/** Meta Cloud API booking notifications. Disabled until explicitly configured in wp-config.php. */
defined( 'ABSPATH' ) || exit;

const JPN_WA_DB_VERSION = '2';
const JPN_WA_CONSENT_TEXT = 'Send my booking confirmation on WhatsApp (optional).';

function jpn_wa_table() {
	global $wpdb;
	return $wpdb->prefix . 'jpn_whatsapp';
}

function jpn_wa_setting( $name, $fallback = '' ) {
	return defined( 'JPN_WA_' . $name ) ? constant( 'JPN_WA_' . $name ) : $fallback;
}

/** Configuration is private server configuration, never part of the published content snapshot. */
function jpn_wa_missing() {
	$missing = array();
	foreach ( array( 'ACCESS_TOKEN', 'PHONE_NUMBER_ID', 'GRAPH_VERSION', 'APP_SECRET', 'VERIFY_TOKEN' ) as $key ) {
		if ( ! is_string( jpn_wa_setting( $key ) ) || '' === trim( jpn_wa_setting( $key ) ) ) {
			$missing[] = $key;
		}
	}
	if ( ! preg_match( '/^\d+$/D', (string) jpn_wa_setting( 'PHONE_NUMBER_ID' ) ) ) {
		$missing[] = 'PHONE_NUMBER_ID';
	}
	if ( ! preg_match( '/^v\d+\.\d+$/D', (string) jpn_wa_setting( 'GRAPH_VERSION' ) ) ) {
		$missing[] = 'GRAPH_VERSION';
	}
	foreach ( array( 'PATIENT_TEMPLATE', 'CLINIC_TEMPLATE' ) as $key ) {
		if ( ! preg_match( '/^[a-z0-9_]+$/D', (string) jpn_wa_setting( $key, 'PATIENT_TEMPLATE' === $key ? 'jpn_booking_confirmation' : 'jpn_booking_alert' ) ) ) {
			$missing[] = $key;
		}
	}
	if ( ! preg_match( '/^[a-z]{2,3}(?:_[A-Z]{2})?$/D', (string) jpn_wa_setting( 'LANGUAGE', 'en' ) ) ) {
		$missing[] = 'LANGUAGE';
	}
	return array_values( array_unique( $missing ) );
}

function jpn_wa_ready() {
	return true === jpn_wa_setting( 'ENABLED', false ) && ! jpn_wa_missing();
}

function jpn_wa_install() {
	global $wpdb;
	if ( JPN_WA_DB_VERSION === get_option( 'jpn_wa_db_version' ) ) {
		return;
	}
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$table = jpn_wa_table();
	$charset = $wpdb->get_charset_collate();
	dbDelta( "CREATE TABLE {$table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		booking_id bigint(20) unsigned NOT NULL,
		kind varchar(16) NOT NULL,
		recipient varchar(16) NOT NULL,
		status varchar(16) NOT NULL DEFAULT 'pending',
		attempts tinyint(3) unsigned NOT NULL DEFAULT 0,
		available_at bigint(20) unsigned NOT NULL,
		updated_at bigint(20) unsigned NOT NULL,
		message_id varchar(191) NULL,
		error_code varchar(40) NOT NULL DEFAULT '',
		consent_at bigint(20) unsigned NOT NULL,
		consent_text varchar(255) NOT NULL,
		PRIMARY KEY  (id),
		UNIQUE KEY booking_recipient (booking_id,kind,recipient),
		UNIQUE KEY message_id (message_id),
		KEY due (status,available_at)
	) {$charset};" );
	if ( $wpdb->get_var( $wpdb->prepare( 'SHOW INDEX FROM ' . $table . ' WHERE Key_name = %s', 'booking_recipient' ) ) ) {
		// This tiny version marker is checked on every request, so keep it in alloptions.
		if ( update_option( 'jpn_wa_db_version', JPN_WA_DB_VERSION, true ) ) {
			// WordPress 6.1 otherwise retains the option's old autoload cache membership.
			wp_cache_delete( 'alloptions', 'options' );
		}
	}
}

/** Clinic recipients must explicitly opt in; use separate mobile numbers, including country code. */
function jpn_wa_clinic_recipients( $branch ) {
	if ( true !== jpn_wa_setting( 'CLINIC_OPT_IN', false ) ) {
		return array();
	}
	$all = (array) jpn_wa_setting( 'CLINIC_RECIPIENTS', array() );
	$numbers = array_merge( (array) ( $all['*'] ?? array() ), (array) ( $all[ $branch ] ?? array() ) );
	return array_values( array_unique( array_filter( array_map( function ( $phone ) {
		$phone = preg_replace( '/[\s()+-]/', '', (string) $phone );
		return preg_match( '/^[1-9]\d{7,14}$/D', $phone ) ? $phone : null;
	}, $numbers ) ) ) );
}

function jpn_wa_enqueue( array $row, array $input ) {
	global $wpdb;
	if ( ! jpn_wa_ready() ) {
		return;
	}
	$targets = array();
	if ( true === ( $input['whatsapp_consent'] ?? false ) ) {
		$targets[] = array( 'patient', '91' . $row['phone'], JPN_WA_CONSENT_TEXT );
	}
	foreach ( jpn_wa_clinic_recipients( $row['branch'] ) as $recipient ) {
		$targets[] = array( 'clinic', $recipient, 'Clinic recipient opted in through JPN_WA_CLINIC_OPT_IN configuration.' );
	}
	$quiet = $wpdb->suppress_errors( true );
	foreach ( $targets as $target ) {
		// INSERT IGNORE makes a repeated booking-created event harmless.
		$ok = $wpdb->query( $wpdb->prepare(
			'INSERT IGNORE INTO ' . jpn_wa_table() . ' (booking_id,kind,recipient,available_at,updated_at,consent_at,consent_text) VALUES (%d,%s,%s,%d,%d,%d,%s)',
			$row['id'], $target[0], $target[1], time(), time(), time(), $target[2]
		) );
		if ( false === $ok ) {
			error_log( 'J.P. Nagar Clinic: WhatsApp notification could not be queued for booking #' . (int) $row['id'] );
		}
	}
	$wpdb->suppress_errors( $quiet );
}

function jpn_wa_intervals( $schedules ) {
	$schedules['jpn_wa_minute'] = array( 'interval' => 60, 'display' => 'Every minute (clinic notifications)' );
	return $schedules;
}

function jpn_wa_schedule() {
	jpn_wa_install();
	if ( jpn_wa_ready() && ! wp_next_scheduled( 'jpn_wa_tick' ) ) {
		wp_schedule_event( time() + 5, 'jpn_wa_minute', 'jpn_wa_tick' );
	} elseif ( ! jpn_wa_ready() ) {
		wp_clear_scheduled_hook( 'jpn_wa_tick' );
	}
}

function jpn_wa_deactivate() {
	wp_clear_scheduled_hook( 'jpn_wa_tick' );
}

/** Templates contain appointment details only; symptoms and clinical notes never leave WordPress. */
function jpn_wa_payload( array $job, array $booking ) {
	$branch = jpn_branches()[ $booking['branch'] ] ?? array( 'short' => $booking['branch'] );
	$codes = array( 'jpnagar' => 'JPN', 'arekere' => 'ARK', 'bannerghatta' => 'BGR' );
	$reference = 'JP-' . ( $codes[ $booking['branch'] ] ?? strtoupper( $booking['branch'] ) ) . '-' . str_pad( (string) $booking['id'], 5, '0', STR_PAD_LEFT );
	$day = DateTimeImmutable::createFromFormat( '!Y-m-d', $booking['slot_date'], new DateTimeZone( 'Asia/Kolkata' ) );
	$when = $day->modify( '+' . (int) $booking['slot_time'] . ' minutes' );
	$doctor = jpn_doctor( $booking['doctor'] );
	$details = array( $branch['name'] ?? $branch['short'], $when->format( 'D, j M Y' ), $when->format( 'g:i a' ) . ' IST', $doctor['name'] ?? $booking['doctor'] );
	$patient = 'patient' === $job['kind'];
	$values = $patient ? array_merge( array( $booking['name'] ), $details, array( $reference ) ) : array_merge( array( $reference, $booking['name'], '+91 ' . $booking['phone'] ), $details );
	return array(
		'messaging_product' => 'whatsapp',
		'biz_opaque_callback_data' => 'jpn-wa-' . $job['id'] . '-a' . $job['attempts'],
		'to' => $job['recipient'],
		'type' => 'template',
		'template' => array(
			'name' => jpn_wa_setting( $patient ? 'PATIENT_TEMPLATE' : 'CLINIC_TEMPLATE', $patient ? 'jpn_booking_confirmation' : 'jpn_booking_alert' ),
			'language' => array( 'code' => jpn_wa_setting( 'LANGUAGE', 'en' ) ),
			'components' => array( array( 'type' => 'body', 'parameters' => array_map( function ( $value ) {
				return array( 'type' => 'text', 'text' => preg_replace( '/\s+/u', ' ', trim( (string) $value ) ) );
			}, $values ) ) ),
		),
	);
}

function jpn_wa_finish( $id, $status, $code = '', $message_id = null, $delay = 0 ) {
	global $wpdb;
	$wpdb->update( jpn_wa_table(), array(
		'status' => $status, 'error_code' => $code, 'message_id' => $message_id,
		'updated_at' => time(), 'available_at' => time() + $delay,
	), array( 'id' => $id, 'status' => 'sending' ) );
}

function jpn_wa_process() {
	global $wpdb;
	if ( ! jpn_wa_ready() ) {
		return;
	}
	$table = jpn_wa_table();
	// A crashed worker may already have sent its message. Never blindly resend an ambiguous attempt.
	$wpdb->query( $wpdb->prepare( "UPDATE {$table} SET status = 'unknown', error_code = 'worker_interrupted', updated_at = %d WHERE status = 'sending' AND updated_at < %d", time(), time() - 300 ) );
	$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$table} WHERE status = 'pending' AND available_at <= %d ORDER BY id LIMIT 10", time() ) );
	foreach ( $ids as $id ) {
		$claimed = $wpdb->query( $wpdb->prepare( "UPDATE {$table} SET status = 'sending', attempts = attempts + 1, updated_at = %d WHERE id = %d AND status = 'pending' AND available_at <= %d", time(), $id, time() ) );
		if ( 1 !== $claimed ) {
			continue;
		}
		$job = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ), ARRAY_A );
		$booking = jpn_get_booking( (int) $job['booking_id'] );
		if ( ! $booking || 'booked' !== $booking['status'] ) {
			jpn_wa_finish( $id, 'skipped', 'booking_not_active' );
			continue;
		}
		$appointment = new DateTimeImmutable( $booking['slot_date'], new DateTimeZone( 'Asia/Kolkata' ) );
		$appointment = $appointment->modify( '+' . (int) $booking['slot_time'] . ' minutes' );
		if ( $appointment->getTimestamp() <= time() ) {
			jpn_wa_finish( $id, 'skipped', 'appointment_passed' );
			continue;
		}
		if ( 'clinic' === $job['kind'] && ! in_array( $job['recipient'], jpn_wa_clinic_recipients( $booking['branch'] ), true ) ) {
			jpn_wa_finish( $id, 'skipped', 'clinic_opt_out' );
			continue;
		}
		$response = wp_remote_post(
			'https://graph.facebook.com/' . jpn_wa_setting( 'GRAPH_VERSION' ) . '/' . jpn_wa_setting( 'PHONE_NUMBER_ID' ) . '/messages',
			array(
				'timeout' => 15, 'redirection' => 0,
				'headers' => array( 'Authorization' => 'Bearer ' . jpn_wa_setting( 'ACCESS_TOKEN' ), 'Content-Type' => 'application/json' ),
				'body' => wp_json_encode( jpn_wa_payload( $job, $booking ) ),
			)
		);
		if ( is_wp_error( $response ) ) {
			jpn_wa_finish( $id, 'unknown', 'transport_error' );
			continue;
		}
		$http = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$message_id = $body['messages'][0]['id'] ?? '';
		if ( $http >= 200 && $http < 300 && is_string( $message_id ) && '' !== $message_id && strlen( $message_id ) <= 191 ) {
			jpn_wa_finish( $id, 'accepted', '', $message_id );
		} elseif ( $http >= 200 && $http < 300 ) {
			jpn_wa_finish( $id, 'unknown', 'missing_message_id' );
		} else {
			// Only retry explicit transient rejections. Accepted messages never enter the retry queue.
			$retry = 429 === $http || ( $http >= 500 && $http < 600 ) || true === ( $body['error']['is_transient'] ?? false );
			$retry = $retry && (int) $job['attempts'] < 5;
			$code = isset( $body['error']['code'] ) ? (string) (int) $body['error']['code'] : 'http_' . (int) $http;
			$delay = max( 60 * ( 2 ** ( (int) $job['attempts'] - 1 ) ), min( 3600, (int) wp_remote_retrieve_header( $response, 'retry-after' ) ) );
			jpn_wa_finish( $id, $retry ? 'pending' : 'failed', $code, null, $delay );
		}
	}
}

function jpn_wa_routes() {
	// Meta has no WordPress session: callbacks authenticate with the verify token (GET) or raw-body HMAC (POST).
	register_rest_route( JPN_NS, '/whatsapp/webhook', array(
		array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'jpn_wa_verify' ),
		array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'jpn_wa_webhook' ),
	) );
	register_rest_route( JPN_NS, '/admin/whatsapp', array(
		'methods' => 'GET', 'permission_callback' => 'jpn_can_manage', 'callback' => 'jpn_wa_status',
	) );
}

function jpn_wa_verify( WP_REST_Request $req ) {
	// PHP normalizes dots in GET parameter names to underscores.
	$get = $req->get_query_params();
	$mode = $get['hub_mode'] ?? $get['hub.mode'] ?? '';
	$token = $get['hub_verify_token'] ?? $get['hub.verify_token'] ?? '';
	$challenge = $get['hub_challenge'] ?? $get['hub.challenge'] ?? '';
	$expected = (string) jpn_wa_setting( 'VERIFY_TOKEN' );
	if ( 'subscribe' !== $mode || ! is_string( $token ) || '' === $expected || ! hash_equals( $expected, $token ) || ! is_string( $challenge ) || ! preg_match( '/^\d{1,64}$/D', $challenge ) ) {
		return new WP_Error( 'jpn_wa_verify', 'Webhook verification failed.', array( 'status' => 403 ) );
	}
	return new WP_REST_Response( $challenge, 200, array( 'Cache-Control' => 'no-store' ) );
}

/** Meta expects the challenge verbatim, without JSON quotes. */
function jpn_wa_serve_challenge( $served, $result, $request, $server ) {
	if ( '/' . JPN_NS . '/whatsapp/webhook' === $request->get_route() && 'GET' === $request->get_method() && 200 === $result->get_status() ) {
		$server->send_header( 'Content-Type', 'text/plain; charset=utf-8' );
		echo $result->get_data(); // phpcs:ignore WordPress.Security.EscapeOutput -- digits validated in jpn_wa_verify.
		return true;
	}
	return $served;
}

function jpn_wa_webhook( WP_REST_Request $req ) {
	global $wpdb;
	$secret = (string) jpn_wa_setting( 'APP_SECRET' );
	$signature = (string) $req->get_header( 'x-hub-signature-256' );
	if ( '' === $secret || ! hash_equals( 'sha256=' . hash_hmac( 'sha256', $req->get_body(), $secret ), $signature ) ) {
		return new WP_Error( 'jpn_wa_signature', 'Invalid webhook signature.', array( 'status' => 403 ) );
	}
	$payload = json_decode( $req->get_body(), true );
	if ( ! is_array( $payload ) || 'whatsapp_business_account' !== ( $payload['object'] ?? '' ) ) {
		return new WP_Error( 'jpn_wa_payload', 'Invalid webhook payload.', array( 'status' => 400 ) );
	}
	$table = jpn_wa_table();
	foreach ( (array) ( $payload['entry'] ?? array() ) as $entry ) {
		foreach ( (array) ( $entry['changes'] ?? array() ) as $change ) {
			$value = $change['value'] ?? array();
			if ( 'messages' !== ( $change['field'] ?? '' ) || (string) jpn_wa_setting( 'PHONE_NUMBER_ID' ) !== (string) ( $value['metadata']['phone_number_id'] ?? '' ) ) {
				continue;
			}
			foreach ( (array) ( $value['statuses'] ?? array() ) as $status ) {
				$next = $status['status'] ?? '';
				// Advance monotonically: delayed or duplicate events cannot undo delivered/read.
				$previous = array( 'sent' => array( 'sending', 'unknown', 'accepted' ), 'delivered' => array( 'sending', 'unknown', 'accepted', 'sent', 'failed' ), 'read' => array( 'sending', 'unknown', 'accepted', 'sent', 'delivered', 'failed' ), 'failed' => array( 'sending', 'unknown', 'accepted', 'sent' ) );
				if ( ! is_string( $next ) || ! isset( $previous[ $next ] ) || ! is_string( $status['id'] ?? null ) || '' === $status['id'] || strlen( $status['id'] ) > 191 || ! is_string( $status['recipient_id'] ?? null ) ) {
					continue;
				}
				// A callback can arrive before the HTTP response, or after a transport timeout.
				$opaque = $status['biz_opaque_callback_data'] ?? '';
				if ( is_string( $opaque ) && preg_match( '/^jpn-wa-(\d+)-a(\d+)$/D', $opaque, $match ) ) {
					$wpdb->query( $wpdb->prepare( "UPDATE {$table} SET message_id = %s WHERE id = %d AND attempts = %d AND recipient = %s AND message_id IS NULL AND status IN ('sending','unknown')", $status['id'], $match[1], $match[2], $status['recipient_id'] ) );
				}
				$allowed = implode( ',', array_fill( 0, count( $previous[ $next ] ), '%s' ) );
				$code = 'failed' === $next ? (string) (int) ( $status['errors'][0]['code'] ?? 0 ) : '';
				$args = array_merge( array( $next, time(), $code, $status['id'], $status['recipient_id'] ), $previous[ $next ] );
				$wpdb->query( $wpdb->prepare( "UPDATE {$table} SET status = %s, updated_at = %d, error_code = %s WHERE message_id = %s AND recipient = %s AND status IN ({$allowed})", $args ) );
			}
		}
	}
	return new WP_REST_Response( array( 'received' => true ), 200, array( 'Cache-Control' => 'no-store' ) );
}

/** Owner diagnostics contain no tokens, patient names, phone numbers or clinical notes. */
function jpn_wa_status() {
	global $wpdb;
	$table = jpn_wa_table();
	return new WP_REST_Response( array(
		'enabled' => true === jpn_wa_setting( 'ENABLED', false ),
		'ready' => jpn_wa_ready(),
		'missing_configuration' => jpn_wa_missing(),
		'clinic_recipients_configured' => (bool) array_filter( jpn_branch_ids(), 'jpn_wa_clinic_recipients' ),
		'counts' => $wpdb->get_results( "SELECT status, COUNT(*) AS total FROM {$table} GROUP BY status", ARRAY_A ),
		'recent' => $wpdb->get_results( "SELECT id, booking_id, kind, status, attempts, error_code, updated_at FROM {$table} ORDER BY id DESC LIMIT 20", ARRAY_A ),
	), 200, array( 'Cache-Control' => 'no-store' ) );
}

add_action( 'plugins_loaded', 'jpn_wa_schedule' );
add_filter( 'cron_schedules', 'jpn_wa_intervals' );
add_action( 'jpn_booking_created', 'jpn_wa_enqueue', 10, 2 );
add_action( 'jpn_wa_tick', 'jpn_wa_process' );
add_action( 'rest_api_init', 'jpn_wa_routes' );
add_filter( 'rest_pre_serve_request', 'jpn_wa_serve_challenge', 10, 4 );
register_deactivation_hook( JPN_DIR . 'jpnagar-clinic.php', 'jpn_wa_deactivate' );
