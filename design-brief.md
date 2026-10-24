# Design brief: J.P. Nagar Physio website redesign

Status: draft, awaiting approval. Product facts live in PRODUCT.md.

## 1. Job and audience
- A patient in pain or recovering from surgery, on a phone, nervous and in a hurry. Also family booking for a parent or child.
- They need three things fast: reassurance this is the right place, the branch nearest to them, and a slot they can book now.
- Modes: Home, Services and Branch pages persuade; Booking is a task to complete (operate); service and team detail is read.

## 2. Outcome and proof
- **Primary action:** book a slot. Secondary: call or WhatsApp.
- **Reassurance, in this order:** Google rating and real reviews next to booking; founder Dr. P. Senthil (27+ years, real degrees, est. 2012); "your first visit" in three steps.
- Only real evidence. No invented numbers, quotes or photos; conflicting facts stay as marked placeholders until the clinic confirms them.

## 3. Direction (agreed so far)
- **Built around booking.** The homepage hero *is* the booking card: nearest branch, next free slots, tap one to continue.
- **Light, neat, modern, calm healthcare feel**, with delight. New colours (current ones rejected); the logo stays exactly as it is.
- **No top menu.** Just the logo at the top. A floating **liquid glass dock**, bottom centre on every device: Home · Services · **Book** (centre, highlighted) · Branches · Team.
- **Call and WhatsApp** as their own small floating buttons, separate from the dock. The Chaty bubble and the top phone/email strip are removed.
- **Images:** 3D cards that tilt toward the mouse with a light sheen on desktop, and have soft depth and lift on tap on phones. Photos get a tonal treatment so they don't wash out on the light background.
- **Gallery:** a slow-moving carousel of 3D cards; tap to open full-screen and swipe.
- **Team:** cards showing photo, name, role and degree chips. "Know more" opens a slide-up glass sheet with bullet-point details and "Book at this branch".
- **Find a service:** a "Tap where it hurts" body map (neck, shoulder, back, knee and so on) that shows matching services, with a plain list below.
- **Bullets, not paragraphs**, everywhere.
- **Motion:** smooth and noticeable, fast on cheap Android phones, and reduced for people who turn off motion.
- The visual world (exact colour, type, glass treatment) is chosen at the start of the mockup step.

## 4. Scope
- Mockups on a Claude Design canvas: key desktop and mobile screens, plus booking states and components.
- About is folded into Home and Team. No login or signup. English only. A website that feels like an app; not installable.

## 5. States
- **Location:** asking for permission; allowed (sorted with distances); denied (enter area or pincode); unknown area (show all 3).
- **Booking:** branch closed today (Sunday); no slots left that day; slot just taken by someone else; form errors (phone format); success.
- **Content ranges:** 3 branches; 3 named physiotherapists (more may come); 10 services; gallery of roughly 10–30 photos.

## 6. Constraints and open decisions
- It must run inside the existing WordPress site on GoDaddy with free tools. A fully custom booking UI means a small custom booking plugin (WordPress REST + MySQL) rather than a restyled third-party form.
- Liquid glass uses blur everywhere; the refraction edge works in Chrome/Android and falls back to plain blur in Safari.
- Text must be editable by clinic staff.
- **Still needed from the clinic:**
  - slot length and patients per slot;
  - therapist schedules for each branch (needed for therapist choice);
  - exact branch map pins;
  - new photos and team portraits;
  - which mapping of body areas to services is correct.
- Accessibility: WCAG 2.2 AA, large tap targets, readable for older patients.

## 7. Screens
| # | Screen | Desktop | Mobile |
|---|---|---|---|
| 1 | Home (hero booking card, reviews, founder, first visit, body map, gallery, story, branches) | ✓ | ✓ |
| 2 | Booking 1: branch (location sort, pincode fallback) | ✓ | ✓ |
| 3 | Booking 2: problem/service + therapist | | ✓ |
| 4 | Booking 3: date and time slot | ✓ | ✓ |
| 5 | Booking 4: your details | | ✓ |
| 6 | Booking confirmed + WhatsApp | | ✓ |
| 7 | Services (body map + list) | ✓ | ✓ |
| 8 | Service page template (Spine & Back Care) | ✓ | ✓ |
| 9 | Branches (nearest first + map) | ✓ | ✓ |
| 10 | Branch page template (JP Nagar) | ✓ | ✓ |
| 11 | Team + "Know more" sheet | ✓ | ✓ |
| 12 | Gallery full-screen viewer | | ✓ |
| — | States: location denied, no slots, Sunday closed, slot taken | | ✓ |
| — | Components: glass dock, floating Call/WhatsApp, 3D tilt card | ✓ | ✓ |
