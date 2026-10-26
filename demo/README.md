# J.P. Nagar Physio · website demo

Plain HTML, CSS and JavaScript. Nothing to install apart from Python 3, which comes with macOS.

## Run it

From this `demo` folder:

```bash
bash start.sh        # the demo on its own (data kept in the browser)
bash start.sh --wp   # talking to a local WordPress running the clinic plugin (needs Docker)
```

It opens <http://localhost:8080> (the hub) and prints the address for a phone on the same Wi-Fi. Stop it with Ctrl+C.

- Phone site: <http://localhost:8080/mobile/home.html>, or `/mobile/index.html` for one phone frame
- Desktop site: <http://localhost:8080/desktop/home.html?t=16:40>
- The earlier desktop layout, kept in the repository for comparison (not part of the build): <http://localhost:8080/desktop-v1/home.html>

## Try it on your phone

Your phone and Mac must be on the same Wi-Fi. `start.sh` prints the phone address (`http://<your Mac>:8080/m`). Stop
the server when you're done, because anyone on the same Wi-Fi can open it while it runs.

That address is plain `http`, and browsers only share a location with secure (`https`) pages, so **"Use my location"
can't be tested this way**: the phone falls back to typing an area or pincode. To test the nearest branch from a
phone's location, use the staging site, which is served over `https`.

## Notes

- Add `?t=16:40` to a page address to show the branches as open at 4:40 pm. Without it, open/closed uses the real time in India. The desktop site keeps the setting as you move between pages.
- Photos, the Google rating and reviews, distances, taken slots and the therapist-per-branch list are samples.
- Fonts load from Google Fonts, so the first load needs internet.
