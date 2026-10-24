"""The demo's web server: serves demo/ to this Mac and to phones on the same Wi-Fi, plus one endpoint the admin
publishes to. Publishing writes canon/published-data.js, a single static file every patient page loads, the same
idea as the real site (content rebuilt into one static file on publish; visitors never touch a database).
Demo only: there is no login on the publish endpoint, so run it on a trusted network.

With JPN_WP set (bash start.sh --wp), the demo talks to a real WordPress running the clinic plugin instead: WordPress's
own paths are passed through on this same address (so the browser sees one site and its login cookie just works), the
pages load the plugin's published file in place of canon/published-data.js, and the demo's own publish endpoint is off.
usage: python3 tools/serve.py [port]"""
import http.client, http.server, json, os, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'canon', 'published-data.js')
MAX = 25 * 1024 * 1024  # photos are WebP, but leave room for a few
WP = urllib.parse.urlsplit(os.environ['JPN_WP']) if os.environ.get('JPN_WP') else None
WP_PATHS = ('/wp-json/', '/wp-content/', '/wp-includes/', '/wp-admin', '/wp-login.php')
API = '/?rest_route=/jpnagar/v1'
HOP = {'connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'proxy-authorization', 'proxy-authenticate'}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        # the published file must be re-checked on every load so a publish shows up straight away
        if self.path.split('?')[0].endswith('published-data.js'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def to_wordpress(self):
        path, _, query = self.path.partition('?')
        return bool(WP) and (path.startswith(WP_PATHS) or (path == '/' and 'rest_route=' in query))

    def proxy(self, path=None):
        """Passes the request to WordPress as it came (same Host, cookies, body) and its answer back as it went."""
        n = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(n) if n else None
        headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP}
        conn = http.client.HTTPConnection(WP.hostname, WP.port or 80, timeout=60)
        try:
            conn.request(self.command, path or self.path, body=body, headers=headers)
            r = conn.getresponse()
            data = r.read()
        except OSError as e:
            return self.send_error(502, 'WordPress is not answering: ' + str(e))
        finally:
            conn.close()
        self.send_response(r.status, r.reason)
        for k, v in r.getheaders():
            if k.lower() not in HOP and k.lower() != 'content-length':
                self.send_header(k, v)
        self.send_header('Content-Length', str(len(data)))
        super().end_headers()
        self.wfile.write(data)
        return r.status, data

    def published_from_wordpress(self):
        """canon/published-data.js, but the plugin's published file, plus where the plugin's API is."""
        conn = http.client.HTTPConnection(WP.hostname, WP.port or 80, timeout=30)
        try:
            conn.request('GET', '/wp-content/uploads/jpnagar/site-data.js', headers={'Host': self.headers.get('Host', '')})
            r = conn.getresponse()
            snap = r.read() if r.status == 200 else b'window.PUBLISHED_DATA = null;\n'
        except OSError:
            snap = b'window.PUBLISHED_DATA = null;\n'
        finally:
            conn.close()
        body = ('window.JPN_API = %s;\n' % json.dumps(API)).encode() + snap
        self.send_response(200)
        self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.to_wordpress():
            return self.proxy()
        if WP and self.path.split('?')[0].endswith('/canon/published-data.js'):
            return self.published_from_wordpress()
        return super().do_GET()

    def do_HEAD(self):
        return self.proxy() if self.to_wordpress() else super().do_HEAD()

    def do_PUT(self):
        return self.proxy() if self.to_wordpress() else self.send_error(405)

    def do_DELETE(self):
        return self.proxy() if self.to_wordpress() else self.send_error(405)

    def do_POST(self):
        if self.to_wordpress():
            return self.proxy()
        if WP:
            return self.send_error(410, 'Publishing goes to WordPress when the demo runs with --wp')
        if self.path.split('?')[0] != '/api/publish':
            return self.send_error(404)
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > MAX:
            return self.send_error(413)
        try:
            data = json.loads(self.rfile.read(n))
        except ValueError:
            return self.send_error(400)
        tmp = DATA + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write('window.PUBLISHED_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
        os.replace(tmp, DATA)
        body = b'{"ok":true}'
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if self.command == 'POST' and not WP:
            sys.stderr.write('published at %s\n' % self.log_date_time_string())


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    if not os.path.exists(DATA):
        with open(DATA, 'w') as f:
            f.write('window.PUBLISHED_DATA = null;\n')
    http.server.ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
