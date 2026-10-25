# Building the J.P. Nagar Physio site

Read PRODUCT.md first: it covers audience, stack (WordPress child theme or small plugin on GoDaddy, free plugins only), scope and the facts that must not be invented.
The demo in `demo/` is the approved design. Build the real site from it.

## 1. Reuse the demo's code before writing anything new

The demo is plain HTML, CSS and JavaScript with no framework and no build step. That carries straight into WordPress templates and enqueued assets.

The rules:
- Port files; don't rewrite them.
- Change data and markup to come from WordPress, and keep the CSS and JS as they are.
- Only write new code where the demo has nothing for the job.

| Need | Reuse | Notes |
|---|---|---|
| Tokens: colours, type, buttons, slots | `demo/canon/base.css` | Shared by both builds. `--ink-3` is `#666A7D`, tuned to pass contrast. |
| Desktop styles | `demo/desktop/desktop.css` | |
| Phone styles | `demo/mobile/site.css` | Sits on top of base.css. |
| Branch data, opening hours, slots, icons, helpers | `demo/desktop/app.js`, `demo/mobile/app.js` | `BRANCHES`, `branchStatus`, `slotsFor`, `nextFree`, `savedKm`/`kmText`. |
| Body figure (front/back, male/female) and hotspots | `FIG`, `REGIONS`, `POS`, `spotXY` in `desktop/app.js` | `mobile/kit.js` exposes the same to the phone build. |
| Anatomy drawing kit (porcelain style) | `demo/desktop/anatomy.js` | |
| The 12 treatment animations | `demo/desktop/scenes.js` | `showScene(host, name)`; `TREATMENTS` holds the copy. |
| Service-page logic (map, story, auto-advance) | `demo/desktop/service.js`, `demo/mobile/service.js` | |
| Service-page content (all 10) | `demo/tools/gen_services.py` (desktop), `demo/tools/gen_mobile.py` (phone) | Holds conditions, chapters and captions. Run with an output folder to rebuild the pages. |
| Booking flow and live ticket | `demo/desktop/book.js` + `booked.js`, `demo/mobile/book.html` | |
| Clinic photo carousel | `demo/desktop/carousel.js` | `gradientCarousel(root, opts)`; used by both builds. |
| Tilting / flipping team cards | `demo/desktop/tilt.js` | Any `[data-tilt]`; flips via `[data-flip]` buttons. |

When something already exists in both builds, share one copy rather than forking it. The phone pages already load the desktop's `anatomy.js`, `scenes.js`, `carousel.js` and `tilt.js` through `mobile/kit.js`.

## 2. Decisions already made: don't undo them

- **Booking order:** where it hurts, then the time and therapist, then details.
  - The choice of physiotherapist depends on the problem. Therapist cards tag who "Treats this".
  - "Where it hurts" stays optional (Skip). Never make time the first step.
- **Booking confirmation:** the plugin reserves the slot and emails the branch, so the copy says the booking is with the branch. WhatsApp is optional.
- **No guessed location:** distances and "nearest" appear only after the visitor shares a location or picks an area. No sample km figures.
- **Illustration style:** "porcelain atlas" (cool grey bodies, ivory bones, cyan accents). The anatomy must be realistic and seamless, with no mitten hands.
- **Two builds in the demo:** desktop and phone are separate builds in `demo/`. Ask before merging them into one responsive theme.

## 3. Check before building anything: performance and Safari

Every iPhone browser runs on Safari's engine (WebKit), so Safari behaviour is iPhone behaviour.
- Chrome hides costs that make Safari stutter.
- Test on Safari (macOS and a real iPhone) first, then Chrome on a mid-range Android.
- Don't write separate code per browser. Use only techniques that are cheap everywhere.

**Motion**
- Animate only `transform` and `opacity`.
- Never animate `filter`/blur, `box-shadow`, `clip-path`, `width`/`height`, `top`/`left` or margins.
  - A blur during the scene swap made Safari stutter.
- Colour changes behind moving things: crossfade two pre-coloured layers with `opacity`. Don't animate the colour itself.
  - Animating the colour made the carousel cards stutter.
- Use `will-change` only on elements that really move, and remove it from anything inside a rounded clipped box (see the corners rule below).
- Animations and timers run only while on screen. Use IntersectionObserver, as the scene clock and auto-advance timers in the demo do.
- Respect `prefers-reduced-motion`.

**Heavy animation**
- Live SVG with filters, redrawn every frame, is the most expensive thing in the demo.
- For production, export each treatment animation as a short looping video (MP4 + WebM, muted, `playsinline`, a few hundred KB) with a poster frame.
  - This is cheap on every phone and looks identical in every browser.
- If they stay as live SVG: keep the phone "calm" mode in `anatomy.js` (no camera drift, no breathing). Keep the clock that stops when nothing is visible, and keep the setAttribute dedupe.

**Safari quirks this project has already hit**
- **Rounded corners:** `overflow:hidden` + `border-radius` does not clip children on their own layer (3D transforms, `will-change`).
  - Use `clip-path: inset(0 round R)` only on boxes whose content is static, such as card faces.
  - For boxes containing animation, keep the animation off its own layer instead. `clip-path` over constantly animating content stutters in Safari.
- **SVG filters inside masked or filtered parents:** these may not draw at all. That's why the ticket body figures vanished on iPhone. Use plain fills there.
- **Viewport height:** use `dvh` (with a `vh` fallback), not `100vh`, because the iPhone address bar changes the height.
- **Frosted glass:** `backdrop-filter` needs `-webkit-backdrop-filter`. Keep it to small elements: dock, floating buttons, bars.
- **Forms:** buttons and inputs don't inherit the font unless told (`button,input,textarea,select{font-family:inherit}`).
- **CSS `zoom`:** it doesn't scale iframe contents. Use `transform: scale()` with a wrapper sized to match.

**Layout stability**
- Reserve space for anything that loads or changes:
  - `aspect-ratio` on stages;
  - `width`/`height` on images;
  - captions held at their longest text;
  - time-slot grids held at the longest session.
- Update UI in place instead of rebuilding lists on every tap. Rebuilding loses scroll and focus and causes jumps.
- Scope class names. A loose `.next{margin-top}` pushed unrelated "next" arrows down twice.

**Before calling anything done**
- Measure, don't guess. `demo/tools/cdp.mjs` drives an isolated headless Chrome:
  - start Chrome with `--remote-debugging-port=9333 --user-data-dir=<temp folder>`;
  - run `node cdp.mjs jobs.json`;
  - `CPU=4` simulates a phone.
- Targets:
  - steady 60fps with no frame over 50ms during scene swaps;
  - layout shift (CLS) under 0.1;
  - nothing running (rAF or infinite animations) when nothing is visible;
  - no console errors on any page.
- Then check in real Safari (macOS, and an iPhone via Safari's Develop menu). Headless Chrome cannot show Safari-only problems.
- Accessibility (target WCAG 2.2 AA):
  - text ≥4.5:1 contrast;
  - touch targets ≥44px;
  - errors announced (`aria-invalid` + `aria-describedby`);
  - focus moved to each new step;
  - skip link;
  - no interactive elements nested inside other interactive elements.

## 4. The admin site (admin.jpnagarmedicalandphysiotherapy.com)

The approved design is `demo/admin/` (direction contract: `.impeccable/surfaces/demo-admin.md`). There is one user, Dr. Senthil, the owner. He is not technical and uses it on his phone. Keep every screen this sparse. The dock has four tabs:

- **Today:** bookings for any day; add walk-in or phone bookings; call, WhatsApp, mark arrived, cancel.
- **Schedule:**
  - per-branch default timings, published to all doctors in one tap;
  - per-doctor different timings;
  - one-tap leave for a doctor for a day, which cancels their bookings at that branch and lists the patients to call (with undo);
  - closed days.
- **Doctors:** add, edit or remove doctors per branch: photo, qualifications, what they treat, background, branches.
- **Content:** home text, branch details, service text and clinic photos, edited as a draft, then **Publish to website**.

Rules the production build must keep:
- **Slots:** one patient per doctor per slot, so a branch's capacity per slot is the number of doctors working then. "Any" bookings take whichever doctor is free.
- **Data:** WordPress is the only data store. The admin is a small front end on the subdomain, talking to a custom plugin's REST API.
  - Only the owner's account can use it: a capability check on every endpoint, and the subdomain is `noindex`.
  - There is no second database.
- **Publishing:** content changes are drafts until Publish. On Publish, the plugin saves to the database once, then rebuilds a static snapshot: one JSON file, served pre-compressed with gzip and Brotli. It also purges the page cache. Visitors are served cached pages and that file, so **a visit never reads the database**.
  - Schedule changes take effect at once, because booking needs them. They rebuild the snapshot's hours too.
  - The demo stands in for this with `localStorage` (`jp-published`, read by `demo/canon/published.js`).
- **Images:** every upload is resized (about 600px for portraits, 1200px for clinic photos) and stored as compressed **WebP** on the server. Never serve the original. The demo does this in the browser with a canvas (`toWebP` in `admin.js`).
- **Leave and closed days:** when they cancel bookings, the system keeps the cancelled list so it can be undone, and shows each patient's call and WhatsApp buttons. Automatic SMS/WhatsApp is a paid add-on and isn't in scope.

## 5. Running the demo

`bash demo/start.sh` serves `demo/` on port 8080 for this Mac and for phones on the same Wi-Fi. The hub page shows the phone link (`<mac-ip>:8080/m`). Adding `?t=16:40` to a URL pins the demo clock.
