---
version: 1
slug: "demo-admin"
primary_target: "demo/admin"
related_targets: []
---

# Admin site (admin.jpnagarmedicalandphysiotherapy.com)

Mode: Operate. One user: Dr. P. Senthil, the owner, non-technical, almost always on his phone. Jobs, one dock tab each (the patient site's liquid dock): Today (bookings for any day, add walk-in/phone bookings, call/arrived/cancel); Schedule (per branch: default timings published to all doctors in one tap, per-doctor different timings, one-tap leave for a doctor for a day that cancels their slots there and lists booked patients to call, branch closed days); Doctors (add/remove doctors per branch with photo, qualifications, what they treat, background); Content (edit all website text and photos as a draft, then Publish to website). Keep every screen sparse: one job per screen, big type, big targets, plain words.

Constraints: same world as the patient site (canon/base.css tokens, Figtree, navy for actions, cyan for small marks). Booking rule: one patient per therapist per slot; patients pick a therapist from the branch's list or "Any". Data lives in WordPress. Publishing writes the content to the database once and regenerates a static compressed snapshot plus the page cache; visitors never trigger a database read. Photos are stored as compressed WebP. The demo keeps sample data in the browser, labelled sample, and the demo patient site reads the published snapshot.

## Direction contract
THESIS: The admin is the clinic's day sheet: today's patients in time order with a live "now" line, not a dashboard of widgets and charts.
OWN-WORLD: Cool grey ground (#F3F4F7), white rounded list cards, navy (#2B3192) for actions and the selected tab, cyan (#00A8EC) only for the now line and small marks, Figtree 800 headings, 17px names, tabular times.
STORY: He opens it, sees who is coming today and who is next, taps a patient to call or mark arrived, adds a walk-in in seconds, and changes days off or website text without help.
FIRST VIEWPORT: Date line and "Today · N bookings" heading; branch tabs (All + three branches); one white list card of time rows (time, name, branch · therapist · problem, status), the cyan NOW line between past and upcoming; a full-width navy "+ Add a booking" button above the patient site's liquid dock with four items (Today, Schedule, Doctors, Content); a day switcher (‹ Today ›) replaces a separate week view.
FORM: "Today list", candidate 1 of 7 on the ranked list; seed key 6bbb00d3.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
