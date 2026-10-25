#!/bin/bash
# Starts the demo for the Mac and for phones on the same Wi-Fi.
# Saves this Mac's address (the demo hub shows it) and opens the hub. Ctrl+C stops the server.
#   bash start.sh        the demo on its own (data kept in the browser)
#   bash start.sh --wp   the demo talking to a local WordPress running the clinic plugin (needs Docker)
cd "$(dirname "$0")" || exit 1
PORT=8080
if [ "$1" = "--wp" ]; then
  bash ../wp/dev/up.sh || exit 1
  export JPN_WP=http://127.0.0.1:8898
fi
kill $(lsof -ti tcp:$PORT) 2>/dev/null
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
printf '{"ip":"%s","port":%s}\n' "$IP" "$PORT" > lan.json
echo
echo "  On this Mac:  http://localhost:$PORT/"
if [ -n "$IP" ]; then echo "  On a phone:   http://$IP:$PORT/m   (same Wi-Fi as this Mac)"; else echo "  No Wi-Fi address found: connect to Wi-Fi to use a phone."; fi
[ -n "$JPN_WP" ] && echo "  Data:         local WordPress (owner login in wp/dev/owner-login.txt)"
echo "  Stop:         Ctrl+C"
echo
(sleep 1; open "http://localhost:$PORT/") &
exec python3 tools/serve.py $PORT
