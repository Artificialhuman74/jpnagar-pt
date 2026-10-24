<?php
/**
 * Free times and the booking itself. The rule: one patient per doctor per slot. A booking for "any doctor" is
 * given a specific free doctor when it is saved, so the database's unique key (install.php) can guard every slot.
 */

defined( 'ABSPATH' ) || exit;

/** The timings that apply to a doctor at a branch: their own if set, otherwise the branch's. */
function jpn_timings_for( $branch, $doctor ) {
	$s = jpn_schedule();
	if ( ! isset( $s[ $branch ] ) ) {
		return null;
	}
	return $s[ $branch ]['own'][ $doctor ] ?? $s[ $branch ];
}

function jpn_on_leave( $doctor, $branch, $date ) {
	foreach ( jpn_leave() as $l ) {
		if ( $l['doctor'] === $doctor && $l['branch'] === $branch && $l['date'] === $date ) {
			return true;
		}
	}
	return false;
}

function jpn_is_closed( $branch, $date ) {
	foreach ( jpn_closed() as $c ) {
		if ( $c['branch'] === $branch && $c['date'] === $date ) {
			return true;
		}
	}
	return false;
}

/** Minutes from midnight a doctor works at a branch on a day; none on leave, closed days or days off. */
function jpn_doctor_times( $branch, $doctor, DateTimeImmutable $day ) {
	$date = $day->format( 'Y-m-d' );
	$t    = jpn_timings_for( $branch, $doctor );
	if ( ! $t || jpn_is_closed( $branch, $date ) || jpn_on_leave( $doctor, $branch, $date ) || ! in_array( (int) $day->format( 'w' ), $t['days'], true ) ) {
		return array();
	}
	$out = array();
	foreach ( $t['sessions'] as $s ) {
		for ( $m = $s[0]; $m + $t['slot'] <= $s[1]; $m += $t['slot'] ) {
			$out[] = $m;
		}
	}
	return $out;
}

/** Which doctors already hold each time at a branch on a day: [minute => [doctor ids]]. */
function jpn_taken( $branch, $date ) {
	global $wpdb;
	$rows  = $wpdb->get_results(
		$wpdb->prepare( 'SELECT doctor, slot_time FROM ' . jpn_bookings_table() . ' WHERE branch = %s AND slot_date = %s AND slot_lock = 1', $branch, $date ),
		ARRAY_A
	);
	$taken = array();
	foreach ( (array) $rows as $r ) {
		$taken[ (int) $r['slot_time'] ][] = $r['doctor'];
	}
	return $taken;
}

/**
 * Free times for a branch and day, for one doctor or for anyone. Times already past today are left out.
 * Returns [['t' => minutes, 'doctors' => [free doctor ids]], ...]. Nothing about patients leaves this function.
 */
function jpn_free_times( $branch, DateTimeImmutable $day, $doctor = null ) {
	$date    = $day->format( 'Y-m-d' );
	$taken   = jpn_taken( $branch, $date );
	$now     = new DateTimeImmutable( 'now', wp_timezone() );
	$cutoff  = $now->format( 'Y-m-d' ) === $date ? ( (int) $now->format( 'G' ) * 60 + (int) $now->format( 'i' ) + 15 ) : -1;
	$doctors = $doctor ? array( $doctor ) : wp_list_pluck( jpn_doctors_at( $branch ), 'id' );
	$free    = array();
	foreach ( $doctors as $id ) {
		foreach ( jpn_doctor_times( $branch, $id, $day ) as $m ) {
			if ( $m > $cutoff && ! in_array( $id, $taken[ $m ] ?? array(), true ) ) {
				$free[ $m ][] = $id;
			}
		}
	}
	ksort( $free );
	$out = array();
	foreach ( $free as $m => $ids ) {
		$out[] = array(
			't'       => $m,
			'doctors' => $ids,
		);
	}
	return $out;
}

/**
 * Saves a booking. With no doctor chosen, each free doctor is tried in turn; the unique key makes the insert
 * itself the check, so two people booking the same last slot at the same moment can't both get it.
 * Returns the new booking row, or WP_Error.
 */
function jpn_create_booking( array $b ) {
	global $wpdb;
	$day = jpn_clean_date( $b['date'], ! empty( $b['allow_past'] ) );
	if ( ! $day ) {
		return new WP_Error( 'jpn_date', __( 'Pick a day within the next 60 days.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	$slot       = jpn_free_times( $b['branch'], $day, $b['doctor'] ?: null );
	$candidates = array();
	foreach ( $slot as $s ) {
		if ( $s['t'] === (int) $b['time'] ) {
			$candidates = $s['doctors'];
		}
	}
	if ( ! $candidates ) {
		return new WP_Error( 'jpn_taken', __( 'That time has just been taken. Please pick another.', 'jpnagar-clinic' ), array( 'status' => 409 ) );
	}
	// a refused insert is the double-booking guard working, not a fault worth printing
	$quiet = $wpdb->suppress_errors( true );
	foreach ( $candidates as $doctor ) {
		$ok = $wpdb->insert(
			jpn_bookings_table(),
			array(
				'branch'     => $b['branch'],
				'doctor'     => $doctor,
				'slot_date'  => $day->format( 'Y-m-d' ),
				'slot_time'  => (int) $b['time'],
				'slot_lock'  => 1,
				'status'     => 'booked',
				'name'       => $b['name'],
				'phone'      => $b['phone'],
				'email'      => $b['email'] ?? '',
				'problem'    => $b['problem'] ?? '',
				'note'       => $b['note'] ?? '',
				'source'     => $b['source'] ?? 'online',
				'created_at' => current_time( 'mysql' ),
			),
			array( '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		if ( $ok ) {
			$wpdb->suppress_errors( $quiet );
			return jpn_get_booking( (int) $wpdb->insert_id );
		}
	}
	$wpdb->suppress_errors( $quiet );
	return new WP_Error( 'jpn_taken', __( 'That time has just been taken. Please pick another.', 'jpnagar-clinic' ), array( 'status' => 409 ) );
}

function jpn_get_booking( $id ) {
	global $wpdb;
	return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . jpn_bookings_table() . ' WHERE id = %d', $id ), ARRAY_A );
}

/** Changes a booking's status. Cancelling frees the slot (slot_lock NULL); restoring takes it back if still free. */
function jpn_set_status( $id, $status, $reason = '' ) {
	global $wpdb;
	$row = jpn_get_booking( $id );
	if ( ! $row ) {
		return new WP_Error( 'jpn_missing', __( 'That booking no longer exists.', 'jpnagar-clinic' ), array( 'status' => 404 ) );
	}
	$data = array(
		'status' => $status,
		'reason' => 'cancelled' === $status ? $reason : '',
	);
	$data['slot_lock'] = 'cancelled' === $status ? null : 1;
	$quiet             = $wpdb->suppress_errors( true );
	$ok                = $wpdb->update( jpn_bookings_table(), $data, array( 'id' => $id ), array( '%s', '%s', '%d' ), array( '%d' ) );
	$wpdb->suppress_errors( $quiet );
	if ( false === $ok ) {
		// restoring a cancelled booking whose slot someone else has taken since
		return new WP_Error( 'jpn_taken', __( 'Someone else has that time now.', 'jpnagar-clinic' ), array( 'status' => 409 ) );
	}
	return jpn_get_booking( $id );
}
