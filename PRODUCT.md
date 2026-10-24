# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing WordPress 6.1 site on GoDaddy shared hosting (PHP 7.4, MySQL), currently Talemy theme + child theme with Elementor 3.23 / Elementor Pro 3.8.1. The redesign ships as child-theme templates or a small custom plugin deployed over SSH, plus free plugins (booking, reviews, caching) and Cloudflare free. Mockups are made first on a Claude Design canvas, then rebuilt as code. No separate backend, no new hosting, same domain.

## Users

- **Primary:** adults in South Bangalore with pain or an injury (back, neck, knee, shoulder, sports injury) or recovering from surgery, usually searching on a phone for physiotherapy close to them. They want to know which branch is nearest, whether it is open, and how to book or call right now.
- **Also:** family members booking for elderly parents (geriatric care, home care, post-joint-replacement rehab), and parents booking for children (paediatric physiotherapy).

## Product Purpose

The clinic's website. It must turn a local search into a booked appointment, a call or a WhatsApp message at the right branch, and help each branch and service rank in local Google search. Success means patients can find their branch and book a slot in under a minute on a phone, and the clinic gets bookings routed to the right branch without double-booking.

## Positioning

- Physiotherapy-only clinic, established 2012, founder-led by Dr. P. Senthil (PT), MPT, COMT: 27+ years of clinical practice.
- Three neighbourhood branches in South Bangalore, each with parking, open Monday–Saturday with both morning and evening sessions.
- Named senior physiotherapists with real qualifications (see Evidence on Hand).

## Operating Context

- Branches:
  1. **JP Nagar:** No. 2/8, 1st Floor, Puttenahalli Road, opp. Govt. Primary School, Puttenahalli, JP Nagar 7th Phase, Bengaluru 560078. Mon–Sat 9am–1pm & 5–9pm. Phone +91 99161 16625, 080 26656988. Parking.
  2. **Arekere MICO Layout:** No. 129, 1st Floor, Lakshmi Nivas, 3rd Cross, near L&T South City, Bannerghatta Main Road, Arekere MICO Layout 2nd Stage, Bengaluru 560076. Mon–Sat 9am–1pm & 4–9pm. Phone +91 99161 16625, 080 26489922. Parking.
  3. **Bannerghatta Road:** No. 22, 1st Floor, above Greens Vegetable Shop, behind Meenakshi Temple, Classic Orchards Layout, Kalena Agrahara, Bengaluru 560076. Mon–Sat 8am–12pm & 4–8pm. Phone +91 99161 16625. Parking.
- Shared contact: +91 99161 16625 (phone and WhatsApp), jpnagarmedicalandphysio@gmail.com.
- Clinic also lists itself on JustDial and Practo; reviews live on Google Business Profile.
- Staff manage bookings in wp-admin; bookings are emailed to the respective branch.

## Capabilities and Constraints

- Agreed scope: 3 branch pages with local SEO and structured data; online booking with branch, date and time-slot selection and no double-booking; click-to-call and WhatsApp on every page; 10 service pages; Google Reviews on the site; caching + Cloudflare.
- Service pages (10, client may revise): Orthopaedic; Spine & Back Care; Sports; Neurological; Post-Operative & Joint Replacement Rehab; Women's Health; Paediatric; Geriatric; Home Care; Therapies & Equipment (manual therapy, IFT, ultrasound, TENS, SWD, traction, hot/cold, myofascial release).
- No login or signup anywhere. Patients only browse services and book.
- Booking asks for name and phone (required), problem/service, email (optional) and an optional therapist choice ("Any available" by default). Confirmation is an on-screen screen plus a free "Send to clinic on WhatsApp" button with the booking pre-filled; automatic SMS/WhatsApp is a paid add-on.
- Nearest branch: browser location (with permission), falling back to typing an area or pincode; branches are sorted nearest to farthest. Uses fixed branch coordinates and a built-in list of South Bangalore areas/pincodes, so there is no paid maps API.
- The About page is folded into Home (story, why choose us) and Team (the people).
- It is a website that feels like an app, not an installable app.
- English only.
- Free plugins only; no new recurring costs.
- Text must stay editable by clinic staff after launch.
- **Decided (Oct 2026):** a slot can hold several patients as long as each is with a different physiotherapist (one patient per therapist per slot), so a branch's capacity per slot is the number of therapists working there. Patients pick a therapist by name from that branch's own list, or "Any available".
- **Undecided (confirm with clinic):** booking slot length, holidays, which therapists work at which branch and on which days (only Dr. Jeya Chitra Devi is confirmed at Arekere), first-visit length (demo shows "45 min [Confirm duration]"), typical number of sessions (demo keeps "[Confirm typical count]" until confirmed).

## Brand Commitments

- Keep the existing name "J.P. Nagar Medical & Physiotherapy Centre" and the current logo exactly.
- Everything else (colour, type, layout, photography style) may be redesigned.
- Chosen by the developer (Oct 2026): the category-standard clinic look, done at the craft level of Apple, One Medical and Airbnb. Light and minimal. Few colours: the logo's navy for actions, the logo's cyan for small marks only, cool neutrals otherwise. No big highlighted item in the dock: all five items are equal, with a quiet indicator for the current page.

## Evidence on Hand

- Team (from the live "Our Professionals" page):
  - Dr. P. Senthil (PT), MPT, MD(A.M), D.ACU, COMT, MIAP: Founder, Managing Director, Chief Consultant Physiotherapist. BPT and MPT (Sports & Musculoskeletal) from Rajah Muthiah Medical College. 27+ years.
  - Dr. Vanitha Senthil (PT), MPT, COMT, MIAP: Senior Consultant Physiotherapist.
  - Dr. Jeya Chitra Devi (PT), BPT (Dr. MGR Medical University): HOD & Senior Consultant Physiotherapist, Arekere branch. 15+ years.
- Existing service list (12) and therapy list (12) on the live /services/ and /therapies/ pages.
- Current homepage counters: 15 therapists, 15,000+ happy clients, 28 years of experience.
- **Conflicting facts to confirm, do not resolve by guessing:** patient count (10,000+ on About vs 15,000+ elsewhere); "28 years of experience" vs clinic established 2012; About page says "two locations" but there are three.
- **Absent, must not be fabricated:** recent clinic photos (current ones are 2021–22 WhatsApp photos), written testimonials (real Google reviews come from the reviews widget), insurance/pricing information, before/after outcomes.

## Product Principles

1. Booking, calling and WhatsApp are always one tap away, on every page, at every scroll position on mobile.
2. Every page answers "which branch, is it open, how do I get there" without hunting.
3. Trust comes from real people and real credentials, never stock claims or invented numbers.
4. Each branch and each service stands as its own findable page with unique, local content.
5. Clinic staff can update text, hours and photos without a developer.

## Accessibility & Inclusion

Many visitors are older adults or in pain: large tap targets, high-contrast readable text, plain language, and a booking flow that works one-handed on a phone. Target WCAG 2.2 AA.
