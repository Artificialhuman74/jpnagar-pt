# Automated booking confirmations: Meta Cloud API

The clinic sends an approved confirmation template to an opted-in patient's WhatsApp number and an approved new-booking alert to opted-in reception/owner numbers. Both are queued after a booking is saved, including front-desk bookings. The existing branch email and manual WhatsApp buttons continue working.

This integration is **disabled by default**. No credentials are included and no real messages have been sent during development. Do not enable it on the shared local demo.

## Why direct Meta

| Option | Costs beyond development and hosting | Best fit |
|---|---|---|
| Meta Cloud API (implemented) | Meta's applicable delivered-message charges | The current booking-only requirement and a maintained WordPress backend |
| Twilio | $0.005 per inbound/outbound WhatsApp message, plus applicable Meta fees | A later requirement for multiple messaging channels |
| AiSensy / Wati | Provider plan, feature/usage fees and applicable message charges; check API and webhook access on the selected plan | A shared staff inbox and assisted onboarding |

Direct integration removes the intermediary's fee, but requires maintaining the API token, templates, webhook and scheduled worker. It uses the existing WordPress database and hosting. Messages, reminders and additional clinic recipients each contribute to usage. Do not quote a provider's marked-up India tariff as the direct Meta rate: confirm the account currency, current rate card and approved template category before quoting the clinic.

Sources: [Meta pricing](https://business.whatsapp.com/products/platform-pricing), [Twilio pricing](https://www.twilio.com/en-us/whatsapp/pricing), [AiSensy pricing](https://aisensy.com/pricing), [Wati plans](https://www.wati.io/en/pricing/).

## 1. Prepare the client's Meta account

Use the **client's** business portfolio, Meta app, WhatsApp Business Account and billing details. Add the WhatsApp product, register the business sender, complete number verification and any account checks Meta requests. Use a supported Graph API version from the app dashboard and a production system-user access token with access to that WhatsApp account and `whatsapp_business_messaging` permission. Template/account management APIs require additional permissions if used; this plugin sends messages and does not create templates.

An existing WhatsApp Business **app** account is not sufficient. If the clinic wants to continue using the app on the same number, check eligibility for supported Coexistence onboarding before changing the existing registration. Do not delete the clinic's existing WhatsApp account to experiment. [Coexistence overview](https://aisensy.com/tutorials/whatsapp-co-existence-everything-you-need-to-know)

Collect a separate reception/owner mobile number to receive alerts, including its country code. Confirm that each recipient agrees to receive booking notifications. A number used for sending is not the reception alert destination.

## 2. Create the two templates

Create these in WhatsApp Manager using **positional/numbered variables**, language **English (`en`)**, and a **body only** (no header, footer or buttons). Submit as utility messages. Meta determines classification and approval; the owner alert needs its own approval, and its category can differ. Do not enable the integration until both are approved. If Meta rejects the internal alert, keep branch email working while revising it or selecting a permitted notification channel.

`jpn_booking_confirmation`, six body parameters:

```text
Hi {{1}}, your appointment at J.P. Nagar Medical & Physiotherapy Centre, {{2}}, is confirmed for {{3}} at {{4}} with {{5}}.
Booking ID: {{6}}.
To change or cancel your visit, call or WhatsApp +91 99161 16625.
```

Order: patient name, branch name, date, time with IST, doctor name, booking reference. Example reference: `JP-ARK-00042`, matching the website ticket.

`jpn_booking_alert`, seven body parameters:

```text
A new clinic appointment has been booked.
Booking ID: {{1}}.
Patient: {{2}}. Contact: {{3}}.
Branch: {{4}}. Date: {{5}}. Time: {{6}}. Physiotherapist: {{7}}.
Please check the clinic diary for details.
```

Order: booking reference, patient name, patient mobile number, branch name, date, time with IST, doctor name. Neither template sends symptoms, body selections or clinical notes. If using another approved language code or template name, configure it below without changing the parameter order.

[Meta's official template-send example](https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text).

## 3. Configure the production server

Put configuration in the server's **wp-config.php**, before WordPress loads. Keep the real file and tokens out of Git and browser code. Replace every placeholder, including `vXX.X`, before enabling. Secrets can also come from server environment variables read in wp-config.php.

```php
define( 'JPN_WA_ENABLED', false ); // Set true only after the remaining setup is complete.
define( 'JPN_WA_ACCESS_TOKEN', 'REPLACE_WITH_PRODUCTION_SYSTEM_USER_TOKEN' );
define( 'JPN_WA_PHONE_NUMBER_ID', 'REPLACE_WITH_META_PHONE_NUMBER_ID' );
define( 'JPN_WA_GRAPH_VERSION', 'vXX.X' ); // Pin a currently supported version from Meta's dashboard.
define( 'JPN_WA_APP_SECRET', 'REPLACE_WITH_META_APP_SECRET' );
define( 'JPN_WA_VERIFY_TOKEN', 'REPLACE_WITH_A_LONG_RANDOM_SECRET_YOU_GENERATE' );
define( 'JPN_WA_PATIENT_TEMPLATE', 'jpn_booking_confirmation' );
define( 'JPN_WA_CLINIC_TEMPLATE', 'jpn_booking_alert' );
define( 'JPN_WA_LANGUAGE', 'en' );
define( 'JPN_WA_CLINIC_OPT_IN', false ); // True only after the clinic recipients agree.
define( 'JPN_WA_CLINIC_RECIPIENTS', array(
    '*' => array( 'REPLACE_WITH_COUNTRY_CODE_AND_OWNER_MOBILE' ),
    // Optional branch-specific recipients, in addition to '*':
    // 'arekere' => array( 'REPLACE_WITH_COUNTRY_CODE_AND_RECEPTION_MOBILE' ),
    // 'jpnagar' => array(),
    // 'bannerghatta' => array(),
) );
```

Use international mobile numbers, e.g. `91` followed by the Indian 10-digit mobile number. Duplicate recipients within a branch are removed. A shared owner recipient receives one alert per booking, and each additional branch recipient receives another billable alert. The number's Meta **Phone Number ID** is an account identifier, not the visible telephone number.

## 4. Connect the webhook and scheduler

In the Meta app's WhatsApp configuration, set:

- Callback URL: `https://jpnagarmedicalandphysiotherapy.com/wp-json/jpnagar/v1/whatsapp/webhook`
- Verify token: exactly the configured `JPN_WA_VERIFY_TOKEN`.
- Subscribe to the WhatsApp `messages` webhook field and ensure the app is subscribed to the correct WhatsApp Business Account.

GET verification works while sending is disabled. POST events require a valid `X-Hub-Signature-256` HMAC using the app secret, and the configured sender ID. The handler ignores inbound message content and records delivery statuses only. It does not implement a chatbot or reply to customers.

Exclude the webhook and booking REST endpoints from page caches and any interactive Cloudflare challenge. The queue uses a one-minute WordPress cron interval. **Set a real hosting cron to run due WordPress events every minute**, because traffic-driven WP-Cron cannot guarantee timely notifications on a quiet clinic site. Example, adapting paths and the installed PHP/WP-CLI executables to the host:

```sh
wp --path=/ABSOLUTE/PATH/TO/WORDPRESS cron event run --due-now --quiet
```

Each run processes up to ten due notifications. No separate service or paid queue is required. Once the server cron is confirmed working, WordPress's traffic-based cron can be disabled in wp-config.php with `DISABLE_WP_CRON` to avoid duplicate scheduler launches; the queue's atomic claims also guard concurrent workers.

## 5. Activate and verify

1. Confirm templates, sender registration, permissions, billing, webhook and scheduler.
2. Set clinic opt-in true after obtaining agreement, then set `JPN_WA_ENABLED` true.
3. Make a test booking using an opted-in test patient's WhatsApp number and an agreed clinic recipient. Verify the ticket and email, then both WhatsApp deliveries. This live check incurs applicable Meta message charges.
4. Test booking without checking the consent box: the clinic alert should send, with no patient message.
5. Review diagnostics using the owner's authenticated `GET /wp-json/jpnagar/v1/admin/whatsapp`, or on the server:

```sh
wp eval 'print_r(jpn_wa_status()->get_data());'
```

Diagnostics show missing configuration **names**, aggregate states and the last 20 jobs with booking IDs. They do not expose credentials, phone numbers or patient names. They are not part of the published website snapshot. Check that `clinic_recipients_configured` is true as well as `ready`.

## Delivery and failure behaviour

- The slot must be saved before any notifications are queued. Rejected and duplicate-slot bookings send nothing. Notification failure never cancels a booking.
- Patient consent must be the JSON boolean `true`. It is unchecked by default on both booking pages. The queue records the consent wording and server timestamp with the recipient. Front-desk API bookings may explicitly record the same consent; the current admin form does not assume it.
- Each booking/kind/recipient has a database unique key. Concurrent workers claim pending jobs atomically. HTTP success with a message ID means **accepted**, not delivered; signed webhooks advance through sent, delivered and read.
- Explicit rate limits, server rejections and transient API errors retry with backoff, at most five attempts. Permanent API errors and delivery failures are retained for investigation without automatic re-sending.
- A timeout, missing message ID or interrupted worker is **unknown**: the message may already have been sent. These are not automatically retried. The outgoing callback correlation value lets a later signed webhook resolve that state, including a webhook arriving before the HTTP response. Inspect the diary and Meta before any manual replacement message; exactly-once delivery across a network cannot be guaranteed.
- A cancelled/arrived booking or an appointment whose start time has passed is skipped if its confirmation has not yet sent. Cancelling after a confirmation was sent does not send a cancellation message in this feature.
- To pause sending, set `JPN_WA_ENABLED` false. Existing bookings and email remain available; no new WhatsApp jobs are created. Pending jobs may resume if re-enabled before the appointment. Jobs retain recipient and consent metadata in the WordPress database; apply the clinic's retention and access rules to that table and its backups.

Reminders, cancellation/rescheduling notifications, marketing, chatbot conversations and a staff inbox are outside this change.

## Local verification

```sh
bash wp/tests/run-whatsapp.sh
```

This creates the dedicated `jpn-whatsapp-tests` Docker project on port 8901, runs the existing booking/API regression suite, then tests WhatsApp against real WordPress/MySQL with intercepted Meta HTTP responses. It tears down only that test project and its volumes. It does not change `jpn-dev`, send emails externally or send real WhatsApp messages. Override `JPN_TEST_PORT` if needed. Credentials in the test process are deliberately fictitious.

## CodeRabbit review follow-ups

Noted 25 October 2026 for [PR #3](https://github.com/Artificialhuman74/jpnagar-pt/pull/3), reviewed commit `ec2ec38`. The review completed with two actionable comments and no critical findings. Both follow-ups have been implemented.

- [x] **Consent wording consistency (trivial):** the test runner now checks the exact consent label on both booking pages against `JPN_WA_CONSENT_TEXT`, alongside the existing consent-value test. [Review comment](https://github.com/Artificialhuman74/jpnagar-pt/pull/3#discussion_r4368063280)
- [x] **Schema-version lookup (minor):** the small `jpn_wa_db_version` option is autoloaded, and `JPN_WA_DB_VERSION` is bumped to `2` so existing installations update the setting. Integration checks cover fresh installs and migration from version `1`. [Review comment](https://github.com/Artificialhuman74/jpnagar-pt/pull/3#discussion_r4368063285)
