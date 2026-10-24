# J.P. Nagar Medical & Physiotherapy Centre: website

The redesign of [jpnagarmedicalandphysiotherapy.com](https://jpnagarmedicalandphysiotherapy.com) and its clinic admin.

- `demo/`: the approved, clickable design: the desktop site, the phone site and the clinic admin. Plain HTML, CSS and JavaScript.
- `PRODUCT.md`: what the site must do, for whom, and the facts it must not invent.
- `DESIGN.md`: the design system.
- `CLAUDE.md`: how to build the production site from the demo, and the performance and Safari rules every change must follow.

## Run the demo

```bash
bash demo/start.sh
```

This serves `demo/` on port 8080 for this computer and for phones on the same Wi-Fi. The hub page shows the phone link. Publishing from the admin (`/admin/`) updates the patient pages on every device. Stop it with Ctrl+C.
