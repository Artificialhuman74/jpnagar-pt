<?php
/**
 * Plugin Name: J.P. Nagar Clinic
 * Description: Bookings, doctors, schedules and published content for jpnagarmedicalandphysiotherapy.com, plus the API the clinic admin uses.
 * Version: 0.1.0
 * Requires at least: 6.1
 * Requires PHP: 7.4
 * Author: J.P. Nagar Medical & Physiotherapy Centre
 * Text Domain: jpnagar-clinic
 *
 * Everything the clinic changes lives here. Visitors never read the database for content: publishing writes one
 * static snapshot file (includes/snapshot.php) that the pages load, and the page cache is cleared once.
 */

defined( 'ABSPATH' ) || exit;

define( 'JPN_VERSION', '0.1.0' );
define( 'JPN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JPN_URL', plugin_dir_url( __FILE__ ) );
// the one capability that opens the clinic admin; given to administrators on activation
define( 'JPN_CAP', 'jpn_manage_clinic' );

require_once JPN_DIR . 'includes/data.php';
require_once JPN_DIR . 'includes/slots.php';
require_once JPN_DIR . 'includes/snapshot.php';
require_once JPN_DIR . 'includes/images.php';
require_once JPN_DIR . 'includes/rest.php';
require_once JPN_DIR . 'includes/install.php';
require_once JPN_DIR . 'includes/admin-host.php';

register_activation_hook( __FILE__, 'jpn_activate' );
add_action( 'plugins_loaded', 'jpn_admin_host_setup', 1 );
add_action( 'plugins_loaded', 'jpn_maybe_upgrade' );
add_action( 'rest_api_init', 'jpn_register_routes' );
