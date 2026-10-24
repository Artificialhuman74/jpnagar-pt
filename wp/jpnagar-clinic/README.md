# J.P. Nagar Clinic (WordPress plugin)

The backend for the new site: bookings, doctors, schedules, published content, and the API that both the patient
pages and the clinic admin use. The frontends are ported from `demo/` (see CLAUDE.md).

## What's in it

| File | Job |
|---|---|
| `includes/install.php` | Bookings table, the `jpn_manage_clinic` capability, and starting content from PRODUCT.md |
| `includes/data.php` | Reading settings and content; checking everything that arrives from a browser |
| `includes/slots.php` | Free times, and booking with one patient per doctor per slot |
| `includes/snapshot.php` | Publishing: writes `uploads/jpnagar/site-data.js` (+ `.gz`) and clears the page cache |
| `includes/images.php` | Photo uploads: resized and saved as WebP |
| `includes/rest.php` | The API under `/wp-json/jpnagar/v1/` |

## How the rules are kept

- **No double-booking.** The bookings table has a unique key on branch, doctor, day and time while a booking
  stands. A booking for "any doctor" is given a specific free doctor as it's saved, so the database refuses a second
  booking for the same slot even if two people book at the same moment.
- **Visitors never read the database for content.** Publishing writes one static file; pages load it with a version
  number that changes on each publish.
- **Owner-only admin.** Every `/admin/*` route needs the `jpn_manage_clinic` capability and WordPress's REST nonce.
- **Photos.** Uploads are checked (JPEG, PNG or WebP, under 15 MB), shrunk to the card's size and saved as WebP. The
  upload itself is not kept.

## API

Public:
- `GET /slots?branch=&date=&doctor=`: free times (minutes from midnight) and which doctors are free. Nothing about patients.
- `POST /bookings`: a patient's booking. Rate-limited, with a hidden honeypot field `website`. The branch is emailed.

Owner (`/admin/...`):
- `state`
- `bookings` (GET a day, POST a front-desk booking)
- `bookings/{id}/status`
- `schedule/{branch}` (publish timings to all doctors)
- `schedule/{branch}/own/{doctor}`
- `leave` and `closed` (POST to add, DELETE to undo; each returns the cancelled bookings to call)
- `content` (save the draft)
- `publish`
- `photos`

## Still to do

- Port the patient pages and the admin from `demo/` onto this API.
- Serve the admin at admin.jpnagarmedicalandphysiotherapy.com inside the owner's WordPress login, which needs the
  login cookie to cover the subdomain.
- Test on a staging copy, then move the host to PHP 8.x.
