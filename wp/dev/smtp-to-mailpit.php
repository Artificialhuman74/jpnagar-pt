<?php
// Local only: sends WordPress's email over SMTP to Mailpit (inbox at http://localhost:8025), the way the live site
// sends through its SMTP plugin, so booking emails can be read without reaching anyone.
add_action(
	'phpmailer_init',
	function ( $mailer ) {
		$mailer->isSMTP();
		$mailer->Host     = 'mail';
		$mailer->Port     = 1025;
		$mailer->SMTPAuth = false;
	}
);
add_filter(
	'wp_mail_from',
	function () {
		return 'website@jpnagarmedicalandphysiotherapy.com';
	}
);
