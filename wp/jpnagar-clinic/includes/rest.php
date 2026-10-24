<?php
/**
 * The API. Two doors:
 * - public (patients): free times for a branch and day, and making a booking. Nothing about other patients is ever
 *   returned.
 * - owner (the clinic admin): everything else. Every route checks the jpn_manage_clinic capability; the admin sends
 *   WordPress's REST nonce with each request, so it only works inside the owner's logged-in session.
 */

defined( 'ABSPATH' ) || exit;

const JPN_NS = 'jpnagar/v1';

function jpn_can_manage() {
	return current_user_can( JPN_CAP );
}

function jpn_register_routes() {
	$owner = 'jpn_can_manage';

	/* ---------- public ---------- */
	register_rest_route(
		JPN_NS,
		'/slots',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'callback'            => 'jpn_rest_slots',
			'args'                => array(
				'branch' => array( 'required' => true ),
				'date'   => array( 'required' => true ),
				'doctor' => array( 'required' => false ),
			),
		)
	);
	register_rest_route(
		JPN_NS,
		'/bookings',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'callback'            => 'jpn_rest_book',
		)
	);

	/* ---------- owner ---------- */
	$routes = array(
		array( '/admin/state', WP_REST_Server::READABLE, 'jpn_rest_state' ),
		array( '/admin/bookings', WP_REST_Server::READABLE, 'jpn_rest_day' ),
		array( '/admin/bookings', WP_REST_Server::CREATABLE, 'jpn_rest_desk_booking' ),
		array( '/admin/bookings/(?P<id>\d+)/status', WP_REST_Server::CREATABLE, 'jpn_rest_status' ),
		array( '/admin/schedule/(?P<branch>[a-z]+)', WP_REST_Server::EDITABLE, 'jpn_rest_branch_timings' ),
		array( '/admin/schedule/(?P<branch>[a-z]+)/own/(?P<doctor>[a-z0-9_-]+)', WP_REST_Server::EDITABLE, 'jpn_rest_own_timings' ),
		array( '/admin/leave', WP_REST_Server::CREATABLE, 'jpn_rest_leave_add' ),
		array( '/admin/leave', WP_REST_Server::DELETABLE, 'jpn_rest_leave_remove' ),
		array( '/admin/closed', WP_REST_Server::CREATABLE, 'jpn_rest_closed_add' ),
		array( '/admin/closed', WP_REST_Server::DELETABLE, 'jpn_rest_closed_remove' ),
		array( '/admin/content', WP_REST_Server::EDITABLE, 'jpn_rest_content' ),
		array( '/admin/publish', WP_REST_Server::CREATABLE, 'jpn_rest_publish' ),
		array( '/admin/photos', WP_REST_Server::CREATABLE, 'jpn_rest_photo' ),
	);
	foreach ( $routes as $r ) {
		register_rest_route(
			JPN_NS,
			$r[0],
			array(
				'methods'             => $r[1],
				'permission_callback' => $owner,
				'callback'            => $r[2],
			)
		);
	}
}

/* ---------- public: free times and booking ---------- */

function jpn_rest_slots( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req['branch'] );
	$day    = jpn_clean_date( (string) $req['date'] );
	$doctor = $req['doctor'] ? sanitize_key( $req['doctor'] ) : null;
	if ( ! $branch || ! $day || ( $doctor && ! jpn_doctor( $doctor ) ) ) {
		return new WP_Error( 'jpn_bad', __( 'Unknown branch, day or doctor.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	$res = rest_ensure_response( array( 'times' => jpn_free_times( $branch, $day, $doctor ) ) );
	$res->header( 'Cache-Control', 'no-store' );
	return $res;
}

/** At most 5 bookings per address every 10 minutes, so the form can't be used to fill the diary. */
function jpn_rate_limited() {
	// behind Cloudflare every request comes from Cloudflare's addresses, so use the visitor's address it passes on;
	// this only keys the limit, so a forged header can't unlock anything
	$header = ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ? 'HTTP_CF_CONNECTING_IP' : 'REMOTE_ADDR';
	$ip     = isset( $_SERVER[ $header ] ) ? sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) ) : '';
	$key = 'jpn_rl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) {
		return true;
	}
	set_transient( $key, $n + 1, 10 * MINUTE_IN_SECONDS );
	return false;
}

function jpn_rest_book( WP_REST_Request $req ) {
	// a field people can't see: anything that fills it in is a bot
	if ( '' !== (string) $req->get_param( 'website' ) ) {
		return new WP_Error( 'jpn_bad', __( 'Please try again.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( jpn_rate_limited() ) {
		return new WP_Error( 'jpn_slow', __( 'Too many bookings from here just now. Please call the clinic.', 'jpnagar-clinic' ), array( 'status' => 429 ) );
	}
	$b = jpn_booking_from_request( $req );
	if ( is_wp_error( $b ) ) {
		return $b;
	}
	$b['source'] = 'online';
	$row         = jpn_create_booking( $b );
	if ( is_wp_error( $row ) ) {
		return $row;
	}
	jpn_notify_branch( $row );
	// the patient only gets back what they need for their ticket
	return rest_ensure_response(
		array(
			'id'     => (int) $row['id'],
			'branch' => $row['branch'],
			'doctor' => $row['doctor'],
			'date'   => $row['slot_date'],
			'time'   => (int) $row['slot_time'],
		)
	);
}

/** Reads and checks a booking's fields; shared by the public form and the admin's front-desk booking. */
function jpn_booking_from_request( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$phone  = jpn_clean_phone( $req->get_param( 'phone' ) );
	$name   = mb_substr( trim( sanitize_text_field( (string) $req->get_param( 'name' ) ) ), 0, 120 );
	$email  = sanitize_email( (string) $req->get_param( 'email' ) );
	$doctor = $req->get_param( 'doctor' ) ? sanitize_key( $req->get_param( 'doctor' ) ) : null;
	$time   = (int) $req->get_param( 'time' );
	if ( ! $branch ) {
		return new WP_Error( 'jpn_branch', __( 'Pick a branch.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( mb_strlen( $name ) < 2 ) {
		return new WP_Error( 'jpn_name', __( 'Please enter your name.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( ! $phone ) {
		return new WP_Error( 'jpn_phone', __( 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( $doctor && ( ! jpn_doctor( $doctor ) || ! in_array( $branch, jpn_doctor( $doctor )['branches'], true ) ) ) {
		return new WP_Error( 'jpn_doctor', __( 'That doctor isn’t at this branch.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( $time < 0 || $time >= 1440 ) {
		return new WP_Error( 'jpn_time', __( 'Pick a time.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	return array(
		'branch'  => $branch,
		'doctor'  => $doctor,
		'date'    => (string) $req->get_param( 'date' ),
		'time'    => $time,
		'name'    => $name,
		'phone'   => $phone,
		'email'   => is_email( $email ) ? $email : '',
		'problem' => mb_substr( sanitize_text_field( (string) $req->get_param( 'problem' ) ), 0, 255 ),
		'note'    => mb_substr( sanitize_textarea_field( (string) $req->get_param( 'note' ) ), 0, 600 ),
	);
}

/** The branch hears about each online booking by email (free; WhatsApp or SMS would be a paid add-on). */
function jpn_notify_branch( array $row ) {
	$to = get_option( 'jpn_notify_email', get_option( 'admin_email' ) );
	$b  = jpn_branches()[ $row['branch'] ] ?? array( 'name' => $row['branch'] );
	$d  = jpn_doctor( $row['doctor'] );
	$t  = sprintf( '%d:%02d', intdiv( (int) $row['slot_time'], 60 ), (int) $row['slot_time'] % 60 );
	wp_mail(
		$to,
		sprintf( 'New booking: %s, %s %s at %s', $row['name'], $row['slot_date'], $t, $b['name'] ),
		implode(
			"\n",
			array(
				'Name: ' . $row['name'],
				'Mobile: +91 ' . $row['phone'],
				'Branch: ' . $b['name'],
				'Doctor: ' . ( $d ? $d['name'] : $row['doctor'] ),
				'When: ' . $row['slot_date'] . ' ' . $t,
				'Problem: ' . ( $row['problem'] ? $row['problem'] : 'Not said' ),
				'Note: ' . ( $row['note'] ? $row['note'] : '-' ),
			)
		)
	);
}

/* ---------- owner ---------- */

function jpn_rest_state() {
	return array(
		'branches'  => jpn_branches(),
		'schedule'  => jpn_schedule(),
		'leave'     => jpn_leave(),
		'closed'    => jpn_closed(),
		'draft'     => jpn_content( 'draft' ),
		'live'      => jpn_content( 'live' ),
		'published' => (int) get_option( 'jpn_snapshot_version', 0 ),
	);
}

function jpn_rest_day( WP_REST_Request $req ) {
	global $wpdb;
	$day = jpn_clean_date( (string) $req['date'], true );
	if ( ! $day ) {
		return new WP_Error( 'jpn_date', 'Bad date.', array( 'status' => 400 ) );
	}
	$branch = $req['branch'] ? jpn_clean_branch( $req['branch'] ) : null;
	$sql    = 'SELECT * FROM ' . jpn_bookings_table() . ' WHERE slot_date = %s';
	$args   = array( $day->format( 'Y-m-d' ) );
	if ( $branch ) {
		$sql   .= ' AND branch = %s';
		$args[] = $branch;
	}
	return $wpdb->get_results( $wpdb->prepare( $sql . ' ORDER BY slot_time, branch', $args ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- built from fixed fragments above
}

function jpn_rest_desk_booking( WP_REST_Request $req ) {
	$b = jpn_booking_from_request( $req );
	if ( is_wp_error( $b ) ) {
		return $b;
	}
	$b['source'] = 'desk';
	return jpn_create_booking( $b );
}

function jpn_rest_status( WP_REST_Request $req ) {
	$status = (string) $req->get_param( 'status' );
	if ( ! in_array( $status, array( 'booked', 'arrived', 'cancelled' ), true ) ) {
		return new WP_Error( 'jpn_status', 'Unknown status.', array( 'status' => 400 ) );
	}
	return jpn_set_status( (int) $req['id'], $status );
}

/** "Publish to all doctors": the branch's timings, and nobody keeps their own. */
function jpn_rest_branch_timings( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req['branch'] );
	$t      = jpn_clean_timings( $req->get_param( 'timings' ) );
	if ( ! $branch || ! $t ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or timings.', array( 'status' => 400 ) );
	}
	$s            = jpn_schedule();
	$s[ $branch ] = array_merge( $t, array( 'own' => array() ) );
	update_option( 'jpn_schedule', $s, false );
	jpn_write_snapshot(); // opening hours on the website follow the timings
	return $s[ $branch ];
}

/** One doctor's own timings at a branch, or back to the branch's (timings: null). */
function jpn_rest_own_timings( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req['branch'] );
	$doctor = sanitize_key( $req['doctor'] );
	if ( ! $branch || ! jpn_doctor( $doctor ) ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or doctor.', array( 'status' => 400 ) );
	}
	$s = jpn_schedule();
	if ( null === $req->get_param( 'timings' ) ) {
		unset( $s[ $branch ]['own'][ $doctor ] );
	} else {
		$t = jpn_clean_timings( $req->get_param( 'timings' ) );
		if ( ! $t ) {
			return new WP_Error( 'jpn_bad', 'Bad timings.', array( 'status' => 400 ) );
		}
		$s[ $branch ]['own'][ $doctor ] = $t;
	}
	update_option( 'jpn_schedule', $s, false );
	return $s[ $branch ];
}

/** Cancels the standing bookings that match, remembering them so the change can be undone. */
function jpn_cancel_matching( $branch, $date, $doctor, $reason ) {
	global $wpdb;
	$sql  = 'SELECT * FROM ' . jpn_bookings_table() . " WHERE branch = %s AND slot_date = %s AND status = 'booked'";
	$args = array( $branch, $date );
	if ( $doctor ) {
		$sql   .= ' AND doctor = %s';
		$args[] = $doctor;
	}
	$rows = (array) $wpdb->get_results( $wpdb->prepare( $sql, $args ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- fixed fragments
	foreach ( $rows as $r ) {
		jpn_set_status( (int) $r['id'], 'cancelled', $reason );
	}
	return $rows;
}

function jpn_restore( array $ids ) {
	$clashes = array();
	foreach ( $ids as $id ) {
		$res = jpn_set_status( (int) $id, 'booked' );
		if ( is_wp_error( $res ) ) {
			$clashes[] = (int) $id;
		}
	}
	return $clashes;
}

function jpn_rest_leave_add( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$doctor = sanitize_key( (string) $req->get_param( 'doctor' ) );
	$day    = jpn_clean_date( (string) $req->get_param( 'date' ) );
	if ( ! $branch || ! $day || ! jpn_doctor( $doctor ) ) {
		return new WP_Error( 'jpn_bad', 'Bad branch, doctor or day.', array( 'status' => 400 ) );
	}
	$date = $day->format( 'Y-m-d' );
	if ( jpn_on_leave( $doctor, $branch, $date ) ) {
		return new WP_Error( 'jpn_dupe', 'Already on leave that day.', array( 'status' => 409 ) );
	}
	$hit   = jpn_cancel_matching( $branch, $date, $doctor, 'leave' );
	$leave = jpn_leave();
	$leave[] = array(
		'doctor'    => $doctor,
		'branch'    => $branch,
		'date'      => $date,
		'cancelled' => array_map( 'intval', wp_list_pluck( $hit, 'id' ) ),
	);
	update_option( 'jpn_leave', $leave, false );
	// the owner gets the patients to call
	return array( 'cancelled' => $hit );
}

function jpn_rest_leave_remove( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$doctor = sanitize_key( (string) $req->get_param( 'doctor' ) );
	$date   = (string) $req->get_param( 'date' );
	$keep   = array();
	$undo   = array();
	foreach ( jpn_leave() as $l ) {
		if ( $l['doctor'] === $doctor && $l['branch'] === $branch && $l['date'] === $date ) {
			$undo = $l['cancelled'];
		} else {
			$keep[] = $l;
		}
	}
	update_option( 'jpn_leave', $keep, false );
	return array( 'not_restored' => jpn_restore( $undo ) );
}

function jpn_rest_closed_add( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$day    = jpn_clean_date( (string) $req->get_param( 'date' ) );
	if ( ! $branch || ! $day ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or day.', array( 'status' => 400 ) );
	}
	$date = $day->format( 'Y-m-d' );
	if ( jpn_is_closed( $branch, $date ) ) {
		return new WP_Error( 'jpn_dupe', 'Already closed that day.', array( 'status' => 409 ) );
	}
	$hit      = jpn_cancel_matching( $branch, $date, null, 'closed' );
	$closed   = jpn_closed();
	$closed[] = array(
		'branch'    => $branch,
		'date'      => $date,
		'reason'    => mb_substr( sanitize_text_field( (string) $req->get_param( 'reason' ) ), 0, 40 ),
		'cancelled' => array_map( 'intval', wp_list_pluck( $hit, 'id' ) ),
	);
	update_option( 'jpn_closed', $closed, false );
	return array( 'cancelled' => $hit );
}

function jpn_rest_closed_remove( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$date   = (string) $req->get_param( 'date' );
	$keep   = array();
	$undo   = array();
	foreach ( jpn_closed() as $c ) {
		if ( $c['branch'] === $branch && $c['date'] === $date ) {
			$undo = $c['cancelled'];
		} else {
			$keep[] = $c;
		}
	}
	update_option( 'jpn_closed', $keep, false );
	return array( 'not_restored' => jpn_restore( $undo ) );
}

/** Saves the draft. Nothing changes on the website until Publish. */
function jpn_rest_content( WP_REST_Request $req ) {
	$clean = jpn_clean_content( $req->get_json_params() );
	if ( ! $clean ) {
		return new WP_Error( 'jpn_bad', 'Bad content.', array( 'status' => 400 ) );
	}
	update_option( 'jpn_content_draft', $clean, false );
	return $clean;
}

/** The draft becomes live, and the website's file is rebuilt. */
function jpn_rest_publish() {
	update_option( 'jpn_content_live', jpn_content( 'draft' ), false );
	$url = jpn_write_snapshot();
	if ( is_wp_error( $url ) ) {
		return $url;
	}
	return array(
		'url'       => $url,
		'published' => (int) get_option( 'jpn_snapshot_version', 0 ),
	);
}

function jpn_rest_photo( WP_REST_Request $req ) {
	$kind = sanitize_key( (string) $req->get_param( 'kind' ) );
	$id   = jpn_save_photo( $kind );
	if ( is_wp_error( $id ) ) {
		return $id;
	}
	return array(
		'id'  => $id,
		'url' => wp_get_attachment_url( $id ),
	);
}
