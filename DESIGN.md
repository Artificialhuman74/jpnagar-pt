---
name: J.P. Nagar Medical & Physiotherapy Centre
description: A light, app-like clinic world in the logo's navy and cyan, shared by the patient desktop site, the patient phone site and the clinic admin.
colors:
  canvas: "#FFFFFF"
  surface: "#F3F4F7"
  line: "#E2E4EA"
  line-2: "#C9CCD6"
  ink: "#141629"
  ink-2: "#565A6E"
  ink-3: "#666A7D"
  act: "#2B3192"
  act-press: "#1F2470"
  act-soft: "#ECEDF8"
  sky: "#00A8EC"
  sky-soft: "#E6F6FD"
  sky-ink: "#0070A8"
  err: "#B42318"
  err-soft: "#FDECEC"
typography:
  display:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 2.2rem + 3.2vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 2.2vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline-phone:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.032em"
  headline-admin:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.25rem + 1.35vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title-phone:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  name:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  body-phone:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
  label:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.3
  time:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.2
    fontFeature: "\"tnum\" 1"
  ticket-time:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "68px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.045em"
    fontFeature: "\"tnum\" 1"
rounded:
  tag: "8px"
  control: "12px"
  field: "14px"
  button: "16px"
  dock-item: "20px"
  card: "22px"
  panel: "26px"
  sheet: "28px"
  hero: "30px"
  full: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gutter-phone: "18px"
  gutter-admin: "20px"
  gutter-desktop: "clamp(24px, 4vw, 64px)"
  section-desktop: "clamp(96px, 8.5vw, 136px)"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.act}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.act-press}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "54px"
  button-line:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "54px"
  button-danger:
    backgroundColor: "{colors.err-soft}"
    textColor: "{colors.err}"
    rounded: "{rounded.button}"
    height: "54px"
  pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "9px 14px"
    height: "44px"
  pill-selected:
    backgroundColor: "{colors.sky-soft}"
    textColor: "{colors.act}"
  pill-filter-selected:
    backgroundColor: "{colors.act}"
    textColor: "{colors.canvas}"
  slot:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
  slot-selected:
    backgroundColor: "{colors.act}"
    textColor: "{colors.canvas}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "54px"
  segmented-track:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.field}"
    padding: "4px"
  tag-mark:
    backgroundColor: "{colors.sky-soft}"
    textColor: "{colors.sky-ink}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  list-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.card}"
  list-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
    height: "64px"
  status-arrived:
    backgroundColor: "{colors.sky-soft}"
    textColor: "{colors.sky-ink}"
    rounded: "{rounded.tag}"
  status-walkin:
    backgroundColor: "{colors.act-soft}"
    textColor: "{colors.act}"
    rounded: "{rounded.tag}"
  status-cancelled:
    backgroundColor: "{colors.err-soft}"
    textColor: "{colors.err}"
    rounded: "{rounded.tag}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
---

# Design System: J.P. Nagar Medical & Physiotherapy Centre

## Overview

**Creative North Star: "The Porcelain Clinic"**

A neighbourhood physiotherapy clinic presented with the calm of a well-run front desk: cool white and grey rooms, one navy ink for anything you can press, and small cyan marks that say "open", "now", "here". The world is light and quiet so that the two things with real character stand out: the porcelain-atlas anatomy (cool grey bodies, ivory bones, cyan accents, realistic hands) and the few tactile objects the patient holds, the printed appointment ticket, the tilting team cards and the liquid glass dock.

Three surfaces share the world. The desktop site is a 12-column editorial frame with a large Figtree type scale and hover states. The phone site is the same world compressed into an app: thumb-reach actions pinned above a frosted dock, sheets that rise from the bottom, one task per screen. The clinic admin is the phone site turned into a day sheet for one owner: a grey ground, white rounded list cards of time-ordered rows, a cyan NOW line, and one navy action pinned above the dock. Density is low everywhere; big type and 44px targets come from an audience that is often older or in pain.

The palette is the logo's: navy (#2B3192) and cyan (#00A8EC) over cooled neutrals. Nothing else is coloured except error red and the anatomy's heat accent.

**Key Characteristics:**
- One family (Figtree), heavy 800 headings with tight negative tracking, tabular numbers for every time.
- Navy is the action colour and the selected state; cyan is never a fill larger than a dot, line, tick or tag.
- Cool grey (#F3F4F7) ground with white cards, or white ground with grey insets; depth is soft, cool and navy-tinted.
- Generous radii that scale with the object (8px tags up to 30px heroes), pills fully round.
- Motion is eased (cubic-bezier(.16,1,.3,1)), moves only transform and opacity, and stops when off screen.

## Colors

Cool neutrals tinted toward the logo's navy, one navy for action, one cyan for marks.

### Primary
- **Logo Navy** (act): Every pressable primary: Book, Add a booking, Publish, the chosen slot, the selected weekday or filter pill, the current dock item's icon and label, the booking progress bar. Also the ticket's printed header gradient (to #1E2378).
- **Pressed Navy** (act-press): Hover and press state of navy buttons; selection text colour.
- **Navy Wash** (act-soft): Text-selection background, walk-in status tags, the admin's informational notice band.

### Secondary
- **Logo Cyan** (sky): Small marks only: the open dot and its beating ring, the dock indicator's top bar, ticks in lists, the admin NOW line, step-progress current segment, carousel dot, body-map hotspots, the anatomy's treatment accent.
- **Cyan Mist** (sky-soft): Background for marks that need a field: credential and arrived tags, avatar initials, selected day tile, the soft halo behind the body map, input focus ring.
- **Deep Cyan Text** (sky-ink): Cyan as readable text: text links ("Change", "Help"), tag text, NOW label. The plain cyan is never used for text on white.

### Neutral
- **Clinic White** (canvas): Page ground on patient surfaces; card, row, field and slot fill everywhere.
- **Cool Grey Ground** (surface): Admin page ground, tinted desktop pages, ghost buttons, segmented tracks, inset panels (reviews, close panel, "where it hurts" block), taken slots.
- **Hairline** (line): 1px dividers between rows, 1.5px borders on pills, slots, fields and day tiles.
- **Hairline Strong** (line-2): Desktop header separator, scrollbar thumb, closed-status dot, disabled button fill.
- **Ink** (ink): Headings, names, body text, toasts and tooltips (white on ink).
- **Slate** (ink-2): Sublines, secondary meta, ticket labels, unselected segment text.
- **Muted Slate** (ink-3): Dock labels at rest, placeholders, row chevrons, struck-through taken slots. Tuned to #666A7D so it passes 4.5:1 on white and on the grey ground; do not lighten it.

### Error
- **Clinic Red** (err) on **Red Wash** (err-soft): Field errors, cancelled status, leave and cancel actions, the inline confirm band (text #7A1A12 on the wash). Destructive actions are a soft red wash with red text, never a solid red fill.

### Named Rules
**The Navy Presses Rule.** If it is navy, it is an action or the current choice. Navy never decorates a heading, an icon in a list or a background panel. One deliberate exception, chosen by the owner: the phone home hero's tagline band ("Feel better, sooner.") is a deep navy band joined under the photo; its Book button above it stays the action.

**The Cyan Is a Mark Rule.** Cyan appears as dots, 2-3px lines, ticks, tags and halos. It is never a button fill, never a large surface, and never body text (use sky-ink for cyan text).

**The Two Logo Colours Rule.** The palette is the logo's navy and cyan plus cool neutrals and error red. The photo placeholders' warm taupe and the anatomy's heat orange (#FF8A4C) are content colours, not UI colours.

## Typography

**Display Font:** Figtree (with -apple-system, system-ui, sans-serif)
**Body Font:** Figtree
**Label/Mono Font:** Figtree with tabular numerals for times, dates, ticket numbers and phone numbers

**Character:** One friendly geometric sans across all three surfaces, made authoritative by weight (800 for headings) and tight tracking rather than by a second family. Body text stays at 400-600 and generous size so older readers never squint.

### Hierarchy
- **Display** (800, clamp(3.5rem → 5.5rem), 0.98): Desktop home hero only.
- **Headline** (800, clamp(2.75rem → 4rem), 1.02): Desktop page titles. Phone: 40px on the home hero, 34px on page heads, 32px on booking steps. Admin: 28px, line-height 1.1, one line.
- **Title** (800, clamp(2rem → 2.75rem), 1.08): Desktop section heads. Phone and sheets: 23-24px at 750. Admin card heads: 18px.
- **Title Small** (750, 1.375rem, 1.2): Desktop sub-heads, card backs, column titles.
- **Name** (700, 17px, 1.25): The patient's or therapist's name in a row, a step title, a branch name. The primary read of any list.
- **Body** (400, 17px desktop / 16px phone, 1.55 / 1.45): Running copy; desktop leads at 1.25rem in Slate, capped at 42ch.
- **Small / Label** (600-750, 13-15px): Sublines, meta, field labels (14px 700), tag text (12-13px 700-750).
- **Time** (800, 17px, tabular): Row times in the admin, slot labels (700, 16px). The ticket time is the one oversized numeral (68px, 800, -0.045em).

### Named Rules
**The Weight Not Family Rule.** Hierarchy comes from Figtree's weight and size alone. No second typeface, no italics for emphasis, no uppercase section labels.

**The Tabular Time Rule.** Every time, date number, ticket ID and phone number uses tabular numerals so columns of times align.

**The Balanced Heading Rule.** Headings use `text-wrap: balance`, paragraphs and list items `text-wrap: pretty`. Admin headings fit one line; their sublines wrap.

## Layout

**Desktop:** a centred frame up to 1360px of content with gutters of clamp(24px, 4vw, 64px) and sections spaced clamp(96px, 8.5vw, 136px) apart. Columns are separated by hairlines rather than boxed. Two-column compositions (hero, booking, service story with a sticky stage) collapse to one column at 1020px; container queries reflow inner grids at 720-780px. The dock floats bottom-centre; call and WhatsApp buttons appear bottom-right once the header scrolls away.

**Phone:** a single column with 18px page gutters and 10-12px card insets, so cards sit nearly edge to edge. Bottom of screen is reserved: the floating dock at 18px from the bottom, pinned actions just above it (bottom ≈ 98px plus safe area), and body padding of 120px or more so nothing hides behind them. Horizontal carousels scroll-snap with the gutter bled out.

**Admin:** the phone layout on a grey ground, 20px page gutters, list cards inset 12px. Above 640px it stays a phone-width column (max 560px) centred on the screen; sheets and pinned bars centre with it. Every safe-area inset (top, bottom) is honoured.

**Rhythm:** 6 / 8 / 12 / 16px are the working gaps; 44px is the minimum target in every direction on every surface. Stages that load or change hold their size (aspect-ratio on stages, captions held at their longest text, slot grids held at the longest session).

## Elevation & Depth

Hybrid: tonal layering does most of the work (white on cool grey, grey insets on white) and shadows are soft, cool and long, tinted with the ink's navy-black (rgba(20,22,41,…)) rather than pure black. Shadows sit low and spread downward with a negative spread, so cards look set on the page rather than hovering. Frosted glass is reserved for small floating chrome: the dock, the call/WhatsApp buttons, the sticky booking head, the publish bar and sheets.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(20,22,41,.06), 0 12px 28px -14px rgba(20,22,41,.28)`): Patient-site cards, the booking card, service and branch cards, the ticket.
- **Lift** (`box-shadow: 0 2px 4px rgba(20,22,41,.06), 0 26px 50px -22px rgba(20,22,41,.36)`): Desktop hover on profile and branch cards.
- **Whisper** (`box-shadow: 0 1px 2px rgba(20,22,41,.05)`): Admin list cards and day-switch buttons on the grey ground; the ground does the separating.
- **Navy Glow** (`box-shadow: 0 14px 30px -14px rgba(43,49,146,.6)`): Pinned primary buttons above the dock and the sliding navy indicator, so the action reads as lifted.
- **Dock Glass** (`box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 0 0 1px rgba(20,22,41,.06), 0 18px 36px -16px rgba(20,22,41,.45)`): The dock only; inner top highlight plus hairline ring plus long drop.
- **Sheet** (`box-shadow: 0 -20px 50px -20px rgba(20,22,41,.45)`): Bottom sheets, casting upward.
- **Selected Segment** (`box-shadow: 0 2px 8px -3px rgba(20,22,41,.25)`): The white thumb in a segmented track.

### Named Rules
**The Cool Shadow Rule.** Shadows are tinted rgba(20,22,41) (or navy rgba(43,49,146) under navy actions), soft and offset downward with negative spread. No hard offset shadows, no black.

**The Small Glass Rule.** `backdrop-filter` (always with `-webkit-backdrop-filter`) is for small floating elements only: dock, floating buttons, sticky bars, sheets. Never a full-page or large-card effect.

**The Solid Backing Rule.** When a pinned action sits above the dock, a fixed gradient from transparent to the page ground fills the gap beneath both, so the list never shows through between them.

## Shapes

Corners are generous and scale with the object: tags 8px, small controls 12px, fields, slots and segmented tracks 14px, buttons and inputs 16px, dock items 20px, list cards and the ticket 22px, panels and the booking card 24-26px, sheets 28px (top corners only), heroes and tilted cards 30px. Pills, avatars and status dots are fully round. Borders are 1px hairlines for dividers and 1.5px for interactive outlines (pills, slots, fields, day tiles). Rows inside a list card are divided by hairlines, never separated into individual cards. The ticket is the one shape with cut-outs: two circular notches (13px) masked into each side and a dashed perforation between its parts.

Rounded clipping follows the Safari rule: `clip-path: inset(0 round R)` only on boxes whose content is static (tilted card faces, the phone hero); boxes containing live animation keep the animation off its own layer instead.

## Components

### Buttons
Confident and soft: big, rounded, heavy label, no outline.
- **Shape:** gently rounded rectangle (16px; 12px for the 44px small size), height 54px on phones, 56px on desktop, 58px for the admin's pinned action, 60px large.
- **Primary:** Logo Navy fill, white 700 label at 17px, 22-28px side padding, an optional 20px drawn icon. On desktop and when pinned it carries the Navy Glow.
- **Hover / Press:** fill moves to Pressed Navy; press scales to 0.98. A trailing arrow nudges 4px right on hover. Busy state shows a white spinner and 0.85 opacity.
- **Ghost:** Cool Grey Ground fill, Ink label (hover #E7E9EF). **Line:** white with an inset 1.5px Hairline ring (hover ring goes Muted Slate). **Danger:** Red Wash with Clinic Red label. **Disabled:** Hairline Strong fill, no shadow.
- **Text link:** Deep Cyan Text, 700, underline on hover with 4px offset.

### Pills and Tags
- **Choice pill:** white, 1.5px Hairline border, fully round, 14px 600 label, at least 40px (44px in admin). Selected: navy border, Cyan Mist fill, navy text.
- **Filter pill (admin branch tabs, weekday toggles, slot length, picks):** selected is solid navy with white text and `aria-pressed="true"`.
- **Tags (credentials, chips, "Treats this", statuses):** 8px corners, 12-13px 700-800 text. Cyan Mist with Deep Cyan Text for informational marks; status tags are Arrived (cyan), Walk-in (navy wash), Cancelled (red wash).

### Segmented Tracks
A Cool Grey track with 4px padding and 14px corners holding equal buttons; the selected option is a white thumb with the Selected Segment shadow and Ink text. Where the track animates (session tabs, chapter tracks, the slim treatment sub-track) a single indicator slides under the options rather than each option changing fill; the slim treatment track uses a navy pill indicator on white with numbered circles.

### Inputs / Fields
- **Style:** 54-56px tall, 16px corners, 1.5px Hairline border, white fill, 17px input text, 14px 700 label above with optional "(optional)" in Muted Slate.
- **Focus:** border goes Logo Navy with a 4px Cyan Mist ring.
- **Error:** border and 13px message in Clinic Red; the field carries `aria-invalid` and `aria-describedby`.
- **Selects** (admin timings): 48px, 14px corners, same border.

### Navigation: the liquid glass dock
Floating, frosted, equal. A fixed capsule bottom-centre (18px from the bottom, 26px corners on phone, 28px on desktop), white at 62-66% with `blur(20px) saturate(1.8)` and the Dock Glass shadow. Items are equal columns: five on the patient sites, four in the admin (Today, Schedule, Doctors, Content); no item is enlarged or coloured differently. Each item is a drawn 23-24px icon over an 11px 600 label in Muted Slate. The current item turns navy and a single **sliding indicator** moves behind it: a 7% navy wash in the item's rounded shape with a 28×3px cyan bar on its top edge, gliding over 0.55s on the house ease. Icons shrink to 0.88 on press and pop once on arrival.

### Cards / Containers
- **Patient cards:** white, 22-26px corners, Rest shadow (or a 1px Hairline ring on desktop, lifting to Lift on hover), 10-24px padding.
- **Grey insets:** Cool Grey Ground panels with 16-28px corners for secondary blocks inside white pages.
- **Admin list card:** white, 22px corners, Whisper shadow, inset 12px from the screen edge, an optional head (18px title with a 13px Slate count on the right), then rows.

### Admin Day Sheet (signature)
The admin's Today screen is a time-ordered list, not a dashboard. Header: a 15px 600 Slate date line over a 28px 800 one-line heading, with a 44px day switcher (previous / next, white 14px-corner buttons) on the right. Below it the horizontally scrolling branch filter pills. Each **row** is a full-width button: a 64px time column (17px 800 tabular, with a 12px Muted Slate sub-label), the name (17px 700) over a wrapping 14px Slate subline (branch · therapist · problem), and a status tag or chevron on the right; rows are at least 64px tall and divided by hairlines; press tints the row Cool Grey. Past rows dim their name and time to Slate; cancelled rows strike the name through (2px) in Muted Slate. The **NOW line** sits between past and upcoming: a 12px 800 Deep Cyan label followed by a 2px cyan rule. One full-width navy action ("Add a booking") is pinned above the dock with the Solid Backing beneath it. Empty days show a centred 17px name-weight line over 15px Slate copy. Unpublished website edits raise a frosted **publish bar** in the same pinned position.

### Sheets
Bottom sheets rise from below with a springy curve (0.6s, cubic-bezier(.2,.9,.25,1.04)) over a 38% ink scrim: 28px top corners, 94% white with `blur(24px) saturate(1.6)`, a 40×5px grab handle, a close button top-right, max height 88-92vh. In the admin, sheets carry facts as a two-column definition list (96px Slate term, 700 value), a two-up row of actions, and destructive confirms as an inline red-wash band rather than a second dialog. On wide screens the sheet centres at 560px.

### The Ticket (signature)
The booking confirmation is a printed paper ticket. A navy header (linear 160° #2B3192 → #1E2378 with a cyan glow in the top-right corner and a faint 14px dot grid) carries the logo on a white tile, a tabular ticket ID, the day and the 68px time with a light-cyan (#8EDBFA) am/pm. A dashed perforation and circular side notches split it from a white body with a two-column grid of 11px Slate labels over 15px 700 values, an inset "where it hurts" block with small body figures in plain fills, and cyan-text chips. On the phone it feeds out of a small printer with a cyan print-head light; the paper moves as one layer with its drop-shadow baked in. Its letter-spaced uppercase stamp and spaced ticket numbers belong to the printed-ticket object and are not a general label style.

### Tilted and Flip Cards (signature)
Team portraits are 30px-corner cards that lean toward the pointer in 3D (perspective 1000px), with parallax layers inside, a pointer-following glare and edge highlight, and a blurred shadow beneath that grows with the tilt. A frosted "flip" pill turns the card over (rotateY 180°) to a white back with the role, credential tags, ticked list and actions; a round grey button turns it back. Faces are clipped with `clip-path: inset(0 round 30px)` because Safari ignores overflow clipping on 3D children. Smaller tilt (8°) is also applied to carousel photos.

### Gradient Carousel (signature)
Clinic photos sit on a gentle convex arc: the front card (300×380px, 26px corners) full size, up to two on each side stepping back, turning outward (17° per step) and fading. Behind it a soft glow takes the front photo's tint from the logo's own blues (cyan, periwinkle, deep sky, navy, light sky), crossfading between pre-coloured layers over 1.6s instead of animating colour. 58px round arrows, swipe, drag and arrow keys move it; auto-advance runs only while it is on screen and never with reduced motion.

### Porcelain Atlas Anatomy (signature illustration)
Bodies are drawn from measured adult proportions, never cartoon shapes. Skin is cool porcelain (#F9FAFC → #D6DBE8), hair cool grey, bones ivory-white (#FFFFFF → #ECEFF6) with grey linework (#A3ACC4), discs in pale cyan (#B9E8FA), couches pale grey. Hands are fully articulated with nails and creases; joints are seamless; there are no mitten hands. Cyan (#00A8EC, deep #0079B8) marks what the treatment does (currents, waves, pressure), heat uses orange (#FF8A4C on #FFE3D2), and labels are white rounded capsules with a Hairline stroke. Each scene opens on the whole patient, then the camera settles on the treated area. The body-map figure for "where it hurts" uses the same family: flat cool-grey silhouettes with cyan hotspot dots that glow when chosen, turning front/back with a 3D flip.

## Do's and Don'ts

### Do:
- **Do** use Logo Navy (#2B3192) for every primary action and current selection, and nothing else.
- **Do** keep cyan to dots, 2-3px lines, ticks, tags and halos; use Deep Cyan Text (#0070A8) when cyan must be read.
- **Do** keep Muted Slate at #666A7D so muted text still passes 4.5:1.
- **Do** set every time and number in tabular Figtree, and headings at 800 with negative tracking.
- **Do** give every target at least 44px and keep the primary action within thumb reach above the dock on phones.
- **Do** animate only `transform` and `opacity` on the house ease cubic-bezier(.16,1,.3,1); crossfade pre-coloured layers instead of animating colour.
- **Do** stop scene clocks, carousels and auto-advance timers when they leave the screen (IntersectionObserver), and honour `prefers-reduced-motion` with a single still frame.
- **Do** play anatomy scenes in calm mode on phones (no camera drift, no breathing once the camera arrives) and keep the setAttribute dedupe.
- **Do** draw every icon as inline SVG with a consistent stroke; size icons to the text beside them (18-24px).
- **Do** pair `backdrop-filter` with `-webkit-backdrop-filter` and use `dvh` with a `vh` fallback for viewport heights.

### Don't:
- **Don't** fill a button, banner or large surface with cyan, or use plain cyan for text.
- **Don't** enlarge or recolour one dock item over the others; the current page shows only the sliding indicator.
- **Don't** introduce a second typeface, uppercase letter-spaced section labels or eyebrow text above headings.
- **Don't** use black or hard offset shadows; shadows are soft and tinted rgba(20,22,41).
- **Don't** animate `filter`, blur, `box-shadow`, `clip-path`, `width`/`height`, `top`/`left` or margins.
- **Don't** put SVG filters inside masked or filtered parents (the ticket's figures use plain fills).
- **Don't** draw mitten hands, seams at joints, or stylised cartoon bodies; the anatomy stays porcelain and realistic.
- **Don't** turn the admin into a dashboard of widgets and charts; it is a time-ordered day sheet with one pinned action.
- **Don't** split one list into floating separate cards; rows share a card and are divided by hairlines.
