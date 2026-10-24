# J.P. Nagar Physio · website demo

Plain HTML, CSS and JavaScript. Nothing to install apart from Python 3, which comes with macOS.

## Run it

From this `demo` folder:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080> in your browser. Stop the server with Ctrl+C.

- Mobile app: <http://localhost:8080/mobile/index.html> (one phone frame) or <http://localhost:8080/mobile/home.html> (full screen)
- Desktop site: <http://localhost:8080/desktop/home.html?t=16:40>
- Earlier desktop layout, for comparison: <http://localhost:8080/desktop-v1/home.html>

## Try the mobile app on your phone

Your phone and Mac must be on the same Wi-Fi.

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Find your Mac's address:

```bash
ipconfig getifaddr en0
```

On the phone, open `http://<that address>:8080/mobile/home.html`. Stop the server when you're done, because anyone on the same Wi-Fi can open it while it runs.

## Notes

- Add `?t=16:40` to a page address to show the branches as open at 4:40 pm. Without it, open/closed uses the real time in India. The desktop site keeps the setting as you move between pages.
- Photos, the Google rating and reviews, distances, taken slots and the therapist-per-branch list are samples.
- Fonts load from Google Fonts, so the first load needs internet.
