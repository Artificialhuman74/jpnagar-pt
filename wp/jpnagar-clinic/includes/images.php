<?php
/**
 * Photos from the admin. The admin crops them on the phone to the card's shape; here they are checked, resized
 * and saved as WebP; a server that can't write WebP refuses the upload. The upload itself is never kept or served.
 */

defined( 'ABSPATH' ) || exit;

// the cards each kind of photo sits in (the admin's cropper uses the same shapes)
const JPN_PHOTO_KINDS = array(
	'portrait' => array( 'w' => 800, 'h' => 1000 ),
	'clinic'   => array( 'w' => 1050, 'h' => 1330 ),
);

/**
 * Takes one uploaded file from $_FILES['photo'] and returns the new attachment id, or WP_Error.
 * @param string $kind 'portrait' or 'clinic'.
 */
function jpn_save_photo( $kind ) {
	if ( ! isset( JPN_PHOTO_KINDS[ $kind ] ) ) {
		return new WP_Error( 'jpn_kind', 'Unknown photo type.', array( 'status' => 400 ) );
	}
	if ( empty( $_FILES['photo']['tmp_name'] ) || ! is_uploaded_file( $_FILES['photo']['tmp_name'] ) ) {
		return new WP_Error( 'jpn_file', __( 'No photo arrived. Please try again.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	if ( (int) $_FILES['photo']['size'] > 15 * MB_IN_BYTES ) {
		return new WP_Error( 'jpn_file', __( 'That photo is too large. Please pick one under 15 MB.', 'jpnagar-clinic' ), array( 'status' => 413 ) );
	}
	$tmp  = $_FILES['photo']['tmp_name'];
	$type = wp_get_image_mime( $tmp );
	if ( ! in_array( $type, array( 'image/jpeg', 'image/png', 'image/webp' ), true ) ) {
		return new WP_Error( 'jpn_file', __( 'Please pick a JPEG, PNG or WebP photo.', 'jpnagar-clinic' ), array( 'status' => 415 ) );
	}
	$editor = wp_get_image_editor( $tmp );
	if ( is_wp_error( $editor ) ) {
		return $editor;
	}
	$size = JPN_PHOTO_KINDS[ $kind ];
	// never upscale: resize only shrinks; the admin already cropped to the card's shape
	$resized = $editor->resize( $size['w'], $size['h'], false );
	if ( is_wp_error( $resized ) ) {
		return $resized;
	}
	$editor->set_quality( 82 );

	$uploads = wp_upload_dir();
	if ( ! empty( $uploads['error'] ) ) {
		return new WP_Error( 'jpn_upload', $uploads['error'], array( 'status' => 500 ) );
	}
	// WebP only: photos are never stored or served in another format
	if ( ! $editor->supports_mime_type( 'image/webp' ) ) {
		return new WP_Error( 'jpn_webp', __( 'This server can’t make WebP images yet. Ask the host to enable WebP in PHP’s GD or Imagick.', 'jpnagar-clinic' ), array( 'status' => 500 ) );
	}
	$mime  = 'image/webp';
	$ext   = 'webp';
	$name  = wp_unique_filename( $uploads['path'], sprintf( 'jpn-%s-%s.%s', $kind, wp_generate_password( 8, false ), $ext ) );
	$saved = $editor->save( trailingslashit( $uploads['path'] ) . $name, $mime );
	if ( is_wp_error( $saved ) ) {
		return $saved;
	}
	$id = wp_insert_attachment(
		array(
			'post_mime_type' => $saved['mime-type'],
			'post_title'     => 'portrait' === $kind ? 'Doctor photo' : 'Clinic photo',
			'post_status'    => 'inherit',
		),
		$saved['path'],
		0,
		true
	);
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $saved['path'] );
		return $id;
	}
	require_once ABSPATH . 'wp-admin/includes/image.php';
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $saved['path'] ) );
	// marks the photo as one of ours, so content can only point at photos this plugin made
	update_post_meta( $id, '_jpn_photo', $kind );
	return $id;
}
