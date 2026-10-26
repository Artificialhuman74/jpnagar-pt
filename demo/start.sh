#!/bin/bash
# Starts the demo for the Mac and for phones on the same Wi-Fi.
# Saves this Mac's address (the demo hub shows it) and opens the hub. Ctrl+C stops the server.
#   bash start.sh        the demo on its own (data kept in the browser)
#   bash start.sh --wp   the demo talking to a local WordPress running the clinic plugin (needs Docker)
cd "$(dirname "$0")" || exit 1
PORT=8080
# the server this demo started last time (its process id is kept in .serve.pid) is stopped; anything else listening on
# the port is left alone, and nothing else is started
# (both the process id and its start time must match, so a reused id never points at another program)
started() { ps -o lstart= -p "$1" 2>/dev/null | tr -s ' ' | sed 's/^ //; s/ $//'; }
for pid in $(lsof -ti tcp:$PORT -sTCP:LISTEN 2>/dev/null); do
  spid=''; sstart=''; [ -f .serve.pid ] && read -r spid sstart < .serve.pid
  if [ "$spid" = "$pid" ] && [ -n "$sstart" ] && [ "$(started "$pid")" = "$sstart" ]; then kill "$pid"
  else echo "Port $PORT is in use by another program ($(ps -o comm= -p "$pid")). Stop it, then run this again."; exit 1; fi
done
sleep 0.3
if [ "$1" = "--wp" ]; then
  bash ../wp/dev/up.sh || exit 1
  export JPN_WP=http://127.0.0.1:8898
fi
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
printf '{"ip":"%s","port":%s}\n' "$IP" "$PORT" > lan.json
echo
echo "  On this Mac:  http://localhost:$PORT/"
if [ -n "$IP" ]; then echo "  On a phone:   http://$IP:$PORT/m   (same Wi-Fi as this Mac)"; else echo "  No Wi-Fi address found: connect to Wi-Fi to use a phone."; fi
[ -n "$JPN_WP" ] && echo "  Data:         local WordPress (owner login in wp/dev/owner-login.txt)"
echo "  Stop:         Ctrl+C"
echo
(sleep 1; open "http://localhost:$PORT/") &
python3 tools/serve.py $PORT &
SERVER=$!
printf '%s %s\n' "$SERVER" "$(started "$SERVER")" > .serve.pid
# when the server stops (Ctrl+C, or it fails to start), so does its record
# (only if the record is still this run's: a newer start may already have written its own)
trap 'kill "$SERVER" 2>/dev/null; [ "$(cut -d" " -f1 .serve.pid 2>/dev/null)" = "$SERVER" ] && rm -f .serve.pid' EXIT INT TERM
wait "$SERVER"
