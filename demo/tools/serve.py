"""The demo's web server: serves demo/ to this Mac and to phones on the same Wi-Fi, plus one endpoint the admin
publishes to. Publishing writes canon/published-data.js, a single static file every patient page loads, the same
idea as the real site (content rebuilt into one static file on publish; visitors never touch a database).
Demo only: there is no login on the publish endpoint, so run it on a trusted network.
usage: python3 tools/serve.py [port]"""
import http.server, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'canon', 'published-data.js')
MAX = 25 * 1024 * 1024  # photos are WebP, but leave room for a few


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        # the published file must be re-checked on every load so a publish shows up straight away
        if self.path.split('?')[0].endswith('published-data.js'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_POST(self):
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
        if self.command == 'POST':
            sys.stderr.write('published at %s\n' % self.log_date_time_string())


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    if not os.path.exists(DATA):
        with open(DATA, 'w') as f:
            f.write('window.PUBLISHED_DATA = null;\n')
    http.server.ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
