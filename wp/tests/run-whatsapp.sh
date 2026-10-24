#!/usr/bin/env bash
# Isolated from the shared demo and the ordinary API test project's database.
set -euo pipefail
cd "$(dirname "$0")"
export COMPOSE_PROJECT_NAME=jpn-whatsapp-tests
export JPN_TEST_PORT="${JPN_TEST_PORT:-8901}"
trap 'docker compose down -v --remove-orphans >/dev/null 2>&1' EXIT
bash run.sh
docker compose run --rm -T cli sh -c 'cat > /tmp/jpn-whatsapp-tests.php && wp eval-file /tmp/jpn-whatsapp-tests.php' < whatsapp.php
