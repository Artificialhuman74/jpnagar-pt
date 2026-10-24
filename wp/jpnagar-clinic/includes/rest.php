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
	if ( ! $branch || ! $day || ( $doctor && ! jpn_doctor_at( $doctor, $branch ) ) ) {
		return new WP_Error( 'jpn_bad', __( 'Unknown branch, day or doctor.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	$res = rest_ensure_response( array( 'times' => jpn_free_times( $branch, $day, $doctor ) ) );
	$res->header( 'Cache-Control', 'no-store' );
	return $res;
}

// Cloudflare's published IPv4 ranges (https://www.cloudflare.com/ips-v4); only requests from these may name the visitor
const JPN_CLOUDFLARE_V4 = array( '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
	'190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22' );

function jpn_in_cidr( $ip, $cidr ) {
	list( $net, $bits ) = explode( '/', $cidr );
	$mask               = -1 << ( 32 - (int) $bits );
	return ( ip2long( $ip ) & $mask ) === ( ip2long( $net ) & $mask );
}

/** The visitor's address. Cloudflare's header is believed only when the request really arrives from Cloudflare. */
function jpn_client_ip() {
	$remote = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	if ( ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) && filter_var( $remote, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
		foreach ( JPN_CLOUDFLARE_V4 as $cidr ) {
			if ( jpn_in_cidr( $remote, $cidr ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) );
				return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : $remote;
			}
		}
	}
	return $remote;
}

/**
 * At most 5 bookings per address every 10 minutes and 3 per mobile number a day, so the form can't fill the diary.
 * Only bookings that succeed are counted: a patient who meets a taken slot or a typo isn't locked out.
 */
function jpn_limit_keys( $phone ) {
	return array(
		array( 'jpn_rl_ip_' . md5( jpn_client_ip() ), 5, 10 * MINUTE_IN_SECONDS ),
		array( 'jpn_rl_ph_' . md5( (string) $phone ), 3, DAY_IN_SECONDS ),
	);
}
function jpn_rate_limited( $phone ) {
	foreach ( jpn_limit_keys( $phone ) as $k ) {
		if ( (int) get_transient( $k[0] ) >= $k[1] ) {
			return true;
		}
	}
	return false;
}
function jpn_count_booking( $phone ) {
	foreach ( jpn_limit_keys( $phone ) as $k ) {
		set_transient( $k[0], (int) get_transient( $k[0] ) + 1, $k[2] );
	}
}

/**
 * Runs $fn while holding the clinic's one booking lock (a MySQL named lock), so bookings, leave and closed days
 * take turns: a booking can't land between a leave's cancellations and its being saved.
 */
function jpn_locked( callable $fn ) {
	global $wpdb;
	if ( '1' !== (string) $wpdb->get_var( "SELECT GET_LOCK('jpn_book', 5)" ) ) {
		return new WP_Error( 'jpn_busy', __( 'The booking desk is busy. Please try again in a moment.', 'jpnagar-clinic' ), array( 'status' => 503 ) );
	}
	try {
		return $fn();
	} finally {
		$wpdb->query( "SELECT RELEASE_LOCK('jpn_book')" );
	}
}

function jpn_rest_book( WP_REST_Request $req ) {
	// a field people can't see: anything that fills it in is a bot
	if ( '' !== (string) $req->get_param( 'website' ) ) {
		return new WP_Error( 'jpn_bad', __( 'Please try again.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	$b = jpn_booking_from_request( $req );
	if ( is_wp_error( $b ) ) {
		return $b;
	}
	// under the lock, two bookings at once can't both slip under the limit
	$row = jpn_locked(
		function () use ( $b ) {
			if ( jpn_rate_limited( $b['phone'] ) ) {
				return new WP_Error( 'jpn_slow', __( 'Too many bookings from here just now. Please call the clinic.', 'jpnagar-clinic' ), array( 'status' => 429 ) );
			}
			$b['source'] = 'online';
			$row         = jpn_create_booking( $b );
			if ( ! is_wp_error( $row ) ) {
				jpn_count_booking( $b['phone'] );
			}
			return $row;
		}
	);
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
	$name   = jpn_substr( trim( sanitize_text_field( (string) $req->get_param( 'name' ) ) ), 0, 120 );
	$email  = sanitize_email( (string) $req->get_param( 'email' ) );
	$doctor = $req->get_param( 'doctor' ) ? sanitize_key( $req->get_param( 'doctor' ) ) : null;
	$time   = (int) $req->get_param( 'time' );
	if ( ! $branch ) {
		return new WP_Error( 'jpn_branch', __( 'Pick a branch.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( jpn_strlen( $name ) < 2 ) {
		return new WP_Error( 'jpn_name', __( 'Please enter your name.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( ! $phone ) {
		return new WP_Error( 'jpn_phone', __( 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( $doctor && ! jpn_doctor_at( $doctor, $branch ) ) {
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
		'problem' => jpn_substr( sanitize_text_field( (string) $req->get_param( 'problem' ) ), 0, 255 ),
		'note'    => jpn_substr( sanitize_textarea_field( (string) $req->get_param( 'note' ) ), 0, 600 ),
	);
}

/** The branch hears about each online booking by email (free; WhatsApp or SMS would be a paid add-on). */
function jpn_notify_branch( array $row ) {
	$b = jpn_branches()[ $row['branch'] ] ?? array( 'name' => $row['branch'] );
	// the branch's own address, then a clinic-wide one, then the site admin
	$to = '';
	foreach ( array( $b['email'] ?? '', (string) get_option( 'jpn_notify_email', '' ), (string) get_option( 'admin_email' ) ) as $candidate ) {
		if ( is_email( $candidate ) ) {
			$to = $candidate;
			break;
		}
	}
	$d  = jpn_doctor( $row['doctor'] );
	$t  = sprintf( '%d:%02d', intdiv( (int) $row['slot_time'], 60 ), (int) $row['slot_time'] % 60 );
	$sent = $to && wp_mail(
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
	if ( ! $sent ) {
		// the booking still stands (it shows in the admin); the clinic just wasn't emailed
		error_log( 'J.P. Nagar Clinic: booking email for #' . $row['id'] . ' was not sent.' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
	}
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
	return jpn_locked(
		function () use ( $b ) {
			return jpn_create_booking( $b );
		}
	);
}

function jpn_rest_status( WP_REST_Request $req ) {
	$status = (string) $req->get_param( 'status' );
	if ( ! in_array( $status, array( 'booked', 'arrived', 'cancelled' ), true ) ) {
		return new WP_Error( 'jpn_status', 'Unknown status.', array( 'status' => 400 ) );
	}
	$id = (int) $req['id'];
	return jpn_locked(
		function () use ( $id, $status ) {
			return jpn_set_status( $id, $status );
		}
	);
}

/** "Publish to all doctors": the branch's timings, and nobody keeps their own. */
function jpn_rest_branch_timings( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req['branch'] );
	$t      = jpn_clean_timings( $req->get_param( 'timings' ) );
	if ( ! $branch || ! $t ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or timings.', array( 'status' => 400 ) );
	}
	// the website file is rebuilt under the same lock, so it can't race a Publish and bring back old content
	return jpn_locked(
		function () use ( $branch, $t ) {
			$before       = jpn_schedule();
			$s            = $before;
			$s[ $branch ] = array_merge( $t, array( 'own' => array() ) );
			update_option( 'jpn_schedule', $s, false );
			// the website shows the same hours bookings use: if its file can't be rewritten, the old hours stay
			$snap = jpn_write_snapshot();
			if ( is_wp_error( $snap ) ) {
				update_option( 'jpn_schedule', $before, false );
				return $snap;
			}
			return $s[ $branch ];
		}
	);
}

/** One doctor's own timings at a branch, or back to the branch's (timings: null). */
function jpn_rest_own_timings( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req['branch'] );
	$doctor = sanitize_key( $req['doctor'] );
	if ( ! $branch || ! jpn_doctor( $doctor ) ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or doctor.', array( 'status' => 400 ) );
	}
	$t = null;
	if ( null !== $req->get_param( 'timings' ) ) {
		$t = jpn_clean_timings( $req->get_param( 'timings' ) );
		if ( ! $t ) {
			return new WP_Error( 'jpn_bad', 'Bad timings.', array( 'status' => 400 ) );
		}
	}
	return jpn_locked(
		function () use ( $branch, $doctor, $t ) {
			$s = jpn_schedule();
			if ( null === $t ) {
				unset( $s[ $branch ]['own'][ $doctor ] );
			} else {
				$s[ $branch ]['own'][ $doctor ] = $t;
			}
			update_option( 'jpn_schedule', $s, false );
			return $s[ $branch ];
		}
	);
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
	$done = array(
		'cancelled' => array(),
		'failed'    => array(),
	);
	foreach ( $rows as $r ) {
		if ( is_wp_error( jpn_set_status( (int) $r['id'], 'cancelled', $reason ) ) ) {
			$done['failed'][] = (int) $r['id'];
		} else {
			$done['cancelled'][] = $r;
		}
	}
	return $done;
}

/**
 * Puts cancelled bookings back, except where the slot is taken or no longer one the doctor works: the day is still
 * closed or on leave, the doctor has left the branch, or their timings have changed since.
 */
function jpn_restore( array $ids ) {
	$clashes = array();
	foreach ( $ids as $id ) {
		$row = jpn_get_booking( (int) $id );
		$day = $row ? DateTimeImmutable::createFromFormat( '!Y-m-d', $row['slot_date'], wp_timezone() ) : false;
		if ( ! $day || ! jpn_doctor_at( $row['doctor'], $row['branch'] )
			|| ! in_array( (int) $row['slot_time'], jpn_doctor_times( $row['branch'], $row['doctor'], $day ), true ) ) {
			$clashes[] = (int) $id;
			continue;
		}
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
	return jpn_locked(
		function () use ( $branch, $doctor, $date ) {
			if ( jpn_on_leave( $doctor, $branch, $date ) ) {
				return new WP_Error( 'jpn_dupe', 'Already on leave that day.', array( 'status' => 409 ) );
			}
			$hit     = jpn_cancel_matching( $branch, $date, $doctor, 'leave' );
			$leave   = jpn_leave();
			$leave[] = array(
				'doctor'    => $doctor,
				'branch'    => $branch,
				'date'      => $date,
				'cancelled' => array_map( 'intval', wp_list_pluck( $hit['cancelled'], 'id' ) ),
			);
			update_option( 'jpn_leave', $leave, false );
			// the owner gets the patients to call, and any booking that couldn't be cancelled
			return $hit;
		}
	);
}

function jpn_rest_leave_remove( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$doctor = sanitize_key( (string) $req->get_param( 'doctor' ) );
	$date   = (string) $req->get_param( 'date' );
	return jpn_locked(
		function () use ( $branch, $doctor, $date ) {
			$keep = array();
			$undo = array();
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
	);
}

function jpn_rest_closed_add( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$day    = jpn_clean_date( (string) $req->get_param( 'date' ) );
	if ( ! $branch || ! $day ) {
		return new WP_Error( 'jpn_bad', 'Bad branch or day.', array( 'status' => 400 ) );
	}
	$date   = $day->format( 'Y-m-d' );
	$reason = jpn_substr( sanitize_text_field( (string) $req->get_param( 'reason' ) ), 0, 40 );
	return jpn_locked(
		function () use ( $branch, $date, $reason ) {
			if ( jpn_is_closed( $branch, $date ) ) {
				return new WP_Error( 'jpn_dupe', 'Already closed that day.', array( 'status' => 409 ) );
			}
			$hit      = jpn_cancel_matching( $branch, $date, null, 'closed' );
			$closed   = jpn_closed();
			$closed[] = array(
				'branch'    => $branch,
				'date'      => $date,
				'reason'    => $reason,
				'cancelled' => array_map( 'intval', wp_list_pluck( $hit['cancelled'], 'id' ) ),
			);
			update_option( 'jpn_closed', $closed, false );
			return $hit;
		}
	);
}

function jpn_rest_closed_remove( WP_REST_Request $req ) {
	$branch = jpn_clean_branch( $req->get_param( 'branch' ) );
	$date   = (string) $req->get_param( 'date' );
	return jpn_locked(
		function () use ( $branch, $date ) {
			$keep = array();
			$undo = array();
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
	);
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
	// the file is written from the draft first; only if that works does the draft become the live copy
	// under the booking lock, since publishing can change which doctors work where
	$url = jpn_locked(
		function () {
			$draft = jpn_content( 'draft' );
			$url   = jpn_write_snapshot( $draft );
			if ( ! is_wp_error( $url ) ) {
				update_option( 'jpn_content_live', $draft, false );
			}
			return $url;
		}
	);
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
