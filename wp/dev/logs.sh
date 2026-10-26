#!/usr/bin/env bash
# Follows everything the local WordPress logs: PHP errors and warnings (wp-content/debug.log, which is also where the
# plugin writes failed emails and failed bookings) and the web server's own log. Ctrl+C stops.
cd "$(dirname "$0")"
docker compose exec -T wp sh -c 'touch /var/www/html/wp-content/debug.log; tail -n 50 -F /var/www/html/wp-content/debug.log' &
docker compose logs -f --tail 20 wp
