<?php
/**
 * Activation: the bookings table, the admin capability and the starting content (the clinic's real branches and
 * team from PRODUCT.md). Which doctors work at which branch is not confirmed yet (only Dr. Jeya Chitra Devi at Arekere
 * is), so the others start at every branch and the owner narrows it down in the admin.
 */

defined( 'ABSPATH' ) || exit;

const JPN_DB_VERSION = '1';

function jpn_bookings_table() {
	global $wpdb;
	return $wpdb->prefix . 'jpn_bookings';
}

function jpn_activate() {
	jpn_install_table();
	$admin = get_role( 'administrator' );
	if ( $admin ) {
		$admin->add_cap( JPN_CAP );
	}
	jpn_seed_defaults();
}

function jpn_maybe_upgrade() {
	if ( get_option( 'jpn_db_version' ) !== JPN_DB_VERSION ) {
		jpn_install_table();
	}
}

/**
 * One patient per doctor per slot is enforced by the database itself: the unique key covers branch, doctor, day
 * and time plus slot_lock, which is 1 while a booking stands and NULL once it is cancelled (NULLs never collide),
 * so a cancelled slot can be booked again and two people can never hold the same one.
 */
function jpn_install_table() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$table   = jpn_bookings_table();
	$charset = $wpdb->get_charset_collate();
	dbDelta(
		"CREATE TABLE {$table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		branch varchar(32) NOT NULL,
		doctor varchar(40) NOT NULL,
		slot_date date NOT NULL,
		slot_time smallint(5) unsigned NOT NULL,
		slot_lock tinyint(1) NULL DEFAULT 1,
		status varchar(16) NOT NULL DEFAULT 'booked',
		name varchar(120) NOT NULL,
		phone varchar(15) NOT NULL,
		email varchar(190) NOT NULL DEFAULT '',
		problem varchar(255) NOT NULL DEFAULT '',
		note text NULL,
		source varchar(16) NOT NULL DEFAULT 'online',
		reason varchar(32) NOT NULL DEFAULT '',
		created_at datetime NOT NULL,
		PRIMARY KEY  (id),
		UNIQUE KEY one_per_doctor (branch,doctor,slot_date,slot_time,slot_lock),
		KEY by_day (slot_date,branch)
		) {$charset};"
	);
	update_option( 'jpn_db_version', JPN_DB_VERSION, false );
}

function jpn_seed_defaults() {
	if ( false === get_option( 'jpn_branches' ) ) {
		update_option( 'jpn_branches', jpn_default_branches(), false );
	}
	if ( false === get_option( 'jpn_schedule' ) ) {
		$schedule = array();
		foreach ( jpn_default_branches() as $id => $b ) {
			$schedule[ $id ] = array(
				'days'     => array( 1, 2, 3, 4, 5, 6 ),
				'sessions' => $b['sessions'],
				'slot'     => 30,
				'own'      => array(),
			);
		}
		update_option( 'jpn_schedule', $schedule, false );
	}
	foreach ( array( 'jpn_leave', 'jpn_closed' ) as $key ) {
		if ( false === get_option( $key ) ) {
			update_option( $key, array(), false );
		}
	}
	if ( false === get_option( 'jpn_content_draft' ) ) {
		$content = jpn_default_content();
		update_option( 'jpn_content_draft', $content, false );
		update_option( 'jpn_content_live', $content, false );
	}
}

/** Branch facts from PRODUCT.md. Sessions are minutes from midnight. */
function jpn_default_branches() {
	return array(
		'jpnagar'      => array(
			'name'     => 'JP Nagar 7th Phase',
			'short'    => 'JP Nagar',
			'phone'    => '+918026656988',
			'addr'     => 'No. 2/8, 1st Floor, Puttenahalli Rd, opp. Govt. Primary School, JP Nagar 7th Phase, Bengaluru 560078',
			'landmark' => 'Opposite Govt. Primary School',
			'sessions' => array( array( 540, 780 ), array( 1020, 1260 ) ),
		),
		'arekere'      => array(
			'name'     => 'Arekere MICO Layout',
			'short'    => 'Arekere',
			'phone'    => '+918026489922',
			'addr'     => 'No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Rd, Arekere MICO Layout 2nd Stage, Bengaluru 560076',
			'landmark' => 'Near L&T South City',
			'sessions' => array( array( 540, 780 ), array( 960, 1260 ) ),
		),
		'bannerghatta' => array(
			'name'     => 'Bannerghatta Road',
			'short'    => 'Bannerghatta',
			'phone'    => '+919916116625',
			'addr'     => 'No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076',
			'landmark' => 'Behind Meenakshi Temple',
			'sessions' => array( array( 480, 720 ), array( 960, 1200 ) ),
		),
	);
}

function jpn_default_content() {
	$all       = array_keys( jpn_default_branches() );
	$branches  = array();
	foreach ( jpn_default_branches() as $id => $b ) {
		$branches[ $id ] = array(
			'name'     => $b['name'],
			'phone'    => $b['phone'],
			'addr'     => $b['addr'],
			'landmark' => $b['landmark'],
		);
	}
	return array(
		'home'     => array(
			'headline' => 'Feel better, sooner.',
			'intro'    => 'Expert physiotherapy at 3 branches in South Bangalore.',
		),
		'services' => array(),
		'photos'   => array(),
		'branches' => $branches,
		'doctors'  => array(
			array(
				'id'       => 'senthil',
				'name'     => 'Dr. P. Senthil (PT)',
				'role'     => 'Founder · Chief Consultant Physiotherapist',
				'years'    => '27+ years',
				'deg'      => array( 'MPT', 'MD(A.M)', 'D.ACU', 'COMT', 'MIAP' ),
				'treats'   => array( 'Orthopaedic and sports injuries', 'Neurological conditions', 'Long-term and complex pain' ),
				'bg'       => array( 'BPT and MPT (Sports & Musculoskeletal), Rajah Muthiah Medical College', 'Certified Orthopaedic Manual Therapist', 'Founded the clinic in 2012' ),
				'branches' => $all,
				'photo'    => 0,
			),
			array(
				'id'       => 'vanitha',
				'name'     => 'Dr. Vanitha Senthil (PT)',
				'role'     => 'Senior Consultant Physiotherapist',
				'years'    => '',
				'deg'      => array( 'MPT', 'COMT', 'MIAP' ),
				'treats'   => array( 'Restoring mobility', 'Structured rehabilitation programmes', 'Guided therapeutic exercise' ),
				'bg'       => array( 'Master of Physiotherapy', 'Certified Orthopaedic Manual Therapist' ),
				'branches' => $all,
				'photo'    => 0,
			),
			array(
				'id'       => 'jeya',
				'name'     => 'Dr. Jeya Chitra Devi (PT)',
				'role'     => 'HOD & Senior Consultant Physiotherapist',
				'years'    => '15+ years',
				'deg'      => array( 'BPT' ),
				'treats'   => array( 'Orthopaedic and post-surgery rehab', 'Sports physiotherapy', 'Neurological rehabilitation', 'Posture and work-related problems' ),
				'bg'       => array( 'BPT, Dr. MGR Medical University', 'Head of Department at the Arekere branch' ),
				'branches' => array( 'arekere' ),
				'photo'    => 0,
			),
		),
	);
}
