#!/usr/bin/env bash
# Runs the plugin's API tests against a fresh local WordPress (needs Docker).
#   bash wp/tests/run.sh          build, test, leave the site up at http://localhost:8899
#   bash wp/tests/run.sh --down   ...and remove it afterwards
set -euo pipefail
cd "$(dirname "$0")"
export JPN_TEST_PORT="${JPN_TEST_PORT:-8899}"
docker compose down -v --remove-orphans >/dev/null 2>&1 || true
docker compose up -d --wait >/dev/null 2>&1
wp() { docker compose run --rm -T cli wp "$@" 2>/dev/null; }
for i in $(seq 30); do wp core is-installed >/dev/null 2>&1 && break; wp db check >/dev/null 2>&1 && break; sleep 2; done
pass=$(openssl rand -hex 12)
wp core install --url="http://localhost:$JPN_TEST_PORT" --title="JPN test" --admin_user=admin --admin_password="$pass" --admin_email=test@example.test --skip-email >/dev/null
wp option update timezone_string Asia/Kolkata >/dev/null
wp config set WP_ENVIRONMENT_TYPE local >/dev/null
wp config set WP_DEBUG_LOG true --raw >/dev/null
wp plugin activate jpnagar-clinic >/dev/null
export JPN_APP_PASS="$(wp user application-password create admin tests --porcelain | tail -1)"
status=0
python3 test_api.py || status=$?
if [ "${1:-}" = "--down" ]; then docker compose down -v >/dev/null 2>&1; fi
exit $status
