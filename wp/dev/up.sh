#!/usr/bin/env bash
# Starts the local WordPress the demo talks to (first run installs it). Needs Docker.
# The demo server passes WordPress's requests through, so WordPress always answers on the demo's own address
# (http://localhost:8080 on this Mac, or the Mac's Wi-Fi address on a phone).
set -euo pipefail
cd "$(dirname "$0")"
docker compose up -d --wait >/dev/null 2>&1
wp() { docker compose run --rm -T cli wp "$@" 2>/dev/null; }
if ! wp core is-installed >/dev/null 2>&1; then
  for i in $(seq 30); do wp db check >/dev/null 2>&1 && break; sleep 2; done
  pass=$(openssl rand -hex 12)
  wp core install --url=http://localhost:8080 --title="J.P. Nagar Physio (local)" --admin_user=owner --admin_password="$pass" --admin_email=owner@example.test --skip-email >/dev/null
  printf 'Local WordPress owner login (this Mac only)\nuser: owner\npassword: %s\n' "$pass" > owner-login.txt
  wp option update timezone_string Asia/Kolkata >/dev/null
  wp config set WP_ENVIRONMENT_TYPE local >/dev/null
  wp config set WP_DEBUG_LOG true --raw >/dev/null
  # answer on whatever address the page was opened on, since every request arrives through the demo server
  wp config set WP_HOME "'http://' . (\$_SERVER['HTTP_HOST'] ?? 'localhost:8080')" --raw >/dev/null
  wp config set WP_SITEURL "'http://' . (\$_SERVER['HTTP_HOST'] ?? 'localhost:8080')" --raw >/dev/null
  wp plugin activate jpnagar-clinic >/dev/null
  # sample branches for Dr. Senthil and Dr. Vanitha, as the demo admin has them, so every branch has times to book;
  # the real assignments are still to be confirmed by the clinic
  wp eval '$c = jpn_content("draft"); foreach ($c["doctors"] as &$d) { if ($d["id"] === "senthil") $d["branches"] = array("jpnagar","arekere","bannerghatta"); if ($d["id"] === "vanitha") $d["branches"] = array("jpnagar","bannerghatta"); } update_option("jpn_content_draft", $c, false); update_option("jpn_content_live", $c, false); jpn_write_snapshot();' >/dev/null
  echo "Installed. Owner login saved in wp/dev/owner-login.txt"
else
  wp plugin activate jpnagar-clinic >/dev/null 2>&1 || true
fi
