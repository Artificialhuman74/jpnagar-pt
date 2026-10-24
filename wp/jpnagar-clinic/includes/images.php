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

/** The largest upload this server takes, in bytes: the smaller of PHP's two limits (what WordPress reports). */
function jpn_upload_limit() {
	return (int) wp_max_upload_size();
}

/**
 * Takes one uploaded file from $_FILES['photo'] and returns the new attachment id, or WP_Error.
 * @param string $kind 'portrait' or 'clinic'.
 */
function jpn_save_photo( $kind ) {
	if ( ! isset( JPN_PHOTO_KINDS[ $kind ] ) ) {
		return new WP_Error( 'jpn_kind', 'Unknown photo type.', array( 'status' => 400 ) );
	}
	$limit = size_format( jpn_upload_limit() );
	// a photo over PHP's limits arrives as nothing at all (post_max_size) or with an error code (upload_max_filesize)
	if ( empty( $_FILES['photo'] ) ) {
		$sent = isset( $_SERVER['CONTENT_LENGTH'] ) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
		if ( $sent > jpn_upload_limit() ) {
			/* translators: %s: the largest upload the server accepts, e.g. "2 MB" */
			return new WP_Error( 'jpn_too_big', sprintf( __( 'That photo is too big for the server (it takes up to %s). Please try again: the admin shrinks photos before sending.', 'jpnagar-clinic' ), $limit ), array( 'status' => 413 ) );
		}
		return new WP_Error( 'jpn_file', __( 'No photo arrived. Please try again.', 'jpnagar-clinic' ), array( 'status' => 400 ) );
	}
	$code = (int) ( $_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE );
	if ( UPLOAD_ERR_OK !== $code ) {
		$why = array(
			UPLOAD_ERR_INI_SIZE   => array( 413, sprintf( /* translators: %s: upload limit */ __( 'That photo is too big for the server (it takes up to %s).', 'jpnagar-clinic' ), $limit ) ),
			UPLOAD_ERR_FORM_SIZE  => array( 413, sprintf( /* translators: %s: upload limit */ __( 'That photo is too big for the server (it takes up to %s).', 'jpnagar-clinic' ), $limit ) ),
			UPLOAD_ERR_PARTIAL    => array( 400, __( 'The upload was cut off part way. Check the connection and try again.', 'jpnagar-clinic' ) ),
			UPLOAD_ERR_NO_FILE    => array( 400, __( 'No photo arrived. Please try again.', 'jpnagar-clinic' ) ),
			UPLOAD_ERR_NO_TMP_DIR => array( 500, __( 'The server has no folder for uploads (PHP upload_tmp_dir). Ask the host to fix it.', 'jpnagar-clinic' ) ),
			UPLOAD_ERR_CANT_WRITE => array( 500, __( 'The server could not save the upload (disk full or no permission). Ask the host to check.', 'jpnagar-clinic' ) ),
			UPLOAD_ERR_EXTENSION  => array( 500, __( 'A PHP extension on the server stopped the upload. Ask the host to check.', 'jpnagar-clinic' ) ),
		);
		list( $status, $msg ) = $why[ $code ] ?? array( 500, __( 'The upload failed on the server.', 'jpnagar-clinic' ) );
		return new WP_Error( 'jpn_upload_' . $code, $msg, array( 'status' => $status ) );
	}
	if ( ! is_uploaded_file( $_FILES['photo']['tmp_name'] ) ) {
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
		/* translators: %s: the image library's own error */
		return new WP_Error( 'jpn_read', sprintf( __( 'The server couldn’t open that photo (%s). Try another photo, or a JPEG.', 'jpnagar-clinic' ), $editor->get_error_message() ), array( 'status' => 422 ) );
	}
	$size = JPN_PHOTO_KINDS[ $kind ];
	// never upscale: resize only shrinks; the admin already cropped to the card's shape
	// only a photo bigger than the card is shrunk: WordPress refuses to "resize" one that already fits (a close crop,
	// or a small photo) and that refusal used to fail the whole upload
	$now     = $editor->get_size();
	$resized = $now['width'] > $size['w'] || $now['height'] > $size['h'] ? $editor->resize( $size['w'], $size['h'], false ) : true;
	if ( is_wp_error( $resized ) ) {
		/* translators: %s: the image library's own error */
		return new WP_Error( 'jpn_resize', sprintf( __( 'The server couldn’t resize that photo (%s).', 'jpnagar-clinic' ), $resized->get_error_message() ), array( 'status' => 500 ) );
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
		/* translators: %s: the image library's own error */
		return new WP_Error( 'jpn_save', sprintf( __( 'The server couldn’t save the WebP copy (%s).', 'jpnagar-clinic' ), $saved->get_error_message() ), array( 'status' => 500 ) );
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
