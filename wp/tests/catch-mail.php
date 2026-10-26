<?php
// Test only: keeps booking emails instead of sending them, so the suite can read the last one.
add_filter(
	'pre_wp_mail',
	function ( $r, $a ) {
		file_put_contents( WP_CONTENT_DIR . '/caught-mail.txt', 'TO: ' . $a['to'] . "\nSUBJECT: " . $a['subject'] . "\n\n" . $a['message'] );
		return true;
	},
	10,
	2
);
