"""API tests for the J.P. Nagar Clinic plugin. Run through run.sh, which builds a fresh WordPress first."""
import json, base64, subprocess, threading, urllib.request, urllib.error, sys, os, datetime
D = os.path.dirname(os.path.abspath(__file__))
PORT = os.environ.get('JPN_TEST_PORT', '8899')
SITE = 'http://127.0.0.1:' + PORT
BASE = SITE + '/?rest_route=/jpnagar/v1'
APP_PASS = os.environ['JPN_APP_PASS']
AUTH = 'Basic ' + base64.b64encode(('admin:' + APP_PASS).encode()).decode()
# the next Monday at least two days away, in the clinic's time zone, so the tests never depend on today's date
_today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).date()
_mon = _today + datetime.timedelta(days=(7 - _today.weekday()) % 7 or 7)
if (_mon - _today).days < 2: _mon += datetime.timedelta(days=7)
DAY, SUNDAY, TUESDAY = _mon.isoformat(), (_mon - datetime.timedelta(days=1)).isoformat(), (_mon + datetime.timedelta(days=1)).isoformat()
fails = []
def call(method, path, body=None, owner=False, headers=None):
    url = BASE + path.replace('?', '&', 1) if '?' in path else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    h = {'Content-Type': 'application/json'}
    if owner: h['Authorization'] = AUTH
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read() or 'null')
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw[:300]
def check(name, cond, info=''):
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else '  -> ' + str(info)[:400]))
    if not cond: fails.append(name)
def wp(*a):
    return subprocess.run(['docker','compose','run','--rm','-T','cli','wp',*a], cwd=D, capture_output=True, text=True).stdout.strip()
def reset_limits(): wp('transient','delete','--all')
n = [0]
def phone():
    n[0] += 1; return '98%08d' % n[0]
def book(t, doctor=None, branch='arekere', **kw):
    b = {'branch': branch, 'date': DAY, 'time': t, 'name': kw.pop('name', 'Test Patient'), 'phone': kw.pop('phone', None) or phone()}
    if doctor: b['doctor'] = doctor
    b.update(kw)
    return call('POST', '/bookings', b)

# ---- public: slots
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
check('slots: arekere has times with Dr Jeya', s == 200 and r['times'] and r['times'][0]['t'] == 540 and r['times'][0]['doctors'] == ['jeya'], (s, r))
check('slots: arekere afternoon starts 16:00 after lunch', any(x['t'] == 960 for x in r['times']) and not any(x['t'] == 800 for x in r['times']), r)
s, r = call('GET', f'/slots?branch=jpnagar&date={DAY}')
check('slots: jpnagar has no bookable doctor yet', s == 200 and r['times'] == [], (s, r))
s, r = call('GET', f'/slots?branch=arekere&date={DAY}&doctor=senthil')
check('slots: doctor not at branch is refused', s == 400, (s, r))
s, r = call('GET', f'/slots?branch=arekere&date={SUNDAY}')
check('slots: Sunday is closed', s == 200 and r['times'] == [], (s, r))
s, r = call('GET', f'/slots?branch=arekere&date=2020-01-01')
check('slots: past date refused', s == 400, (s, r))
s, r = call('GET', f'/slots?branch=nowhere&date={DAY}')
check('slots: unknown branch refused', s == 400, (s, r))

# ---- public: bookings
s, r = book(540)
check('book: any doctor gets Jeya at 9:00', s == 200 and r['doctor'] == 'jeya' and r['time'] == 540, (s, r))
first_id = r.get('id') if isinstance(r, dict) else None
s, r = book(540)
check('book: same slot again is taken (409)', s == 409, (s, r))
s, r = book(545)
check('book: time off the slot grid refused', s >= 400, (s, r))
s, r = book(600, website='http://spam')
check('book: honeypot refused', s == 400, (s, r))
s, r = book(600, phone='12345')
check('book: bad phone refused', s == 400, (s, r))
s, r = book(600, doctor='senthil')
check('book: doctor not at branch refused', s == 400, (s, r))
reset_limits()
s, r = book(600, name='ಬೆಂಗಳೂರು ' * 30)
check('book: long Kannada name saved without breaking', s == 200, (s, r))
if s == 200:
    nm = wp('db','query',f"SELECT name FROM wp_jpn_bookings WHERE id={r['id']}",'--skip-column-names')
    check('book: name cut to 120 whole characters', len(nm) == 120 and nm.encode('utf-8').decode('utf-8') == nm, (len(nm), nm[-5:]))
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
check('slots: booked times disappear', not any(x['t'] in (540, 600) for x in r['times']), r)

# ---- concurrency: 6 people, one slot, at once
reset_limits()
res = []
def go(i): res.append(book(630, phone='97%08d' % i))
th = [threading.Thread(target=go, args=(i,)) for i in range(6)]
[t.start() for t in th]; [t.join() for t in th]
oks = [x for x in res if x[0] == 200]
check('race: 6 at once on one slot -> exactly 1 booked', len(oks) == 1, [x[0] for x in res])
check('race: the rest told it is taken (409), none broke', all(x[0] in (200, 409) for x in res), res)

# ---- rate limits
reset_limits()
p = phone(); codes = [book(660 + 30 * i, phone=p)[0] for i in range(4)]
check('limit: 4th booking from one phone in a day refused', codes[:3] == [200, 200, 200] and codes[3] == 429, codes)
s, r = book(1110, phone=p)
check('limit: the phone limit says so (not "too many from here")', s == 429 and 'mobile number already has 3 bookings' in r.get('message', ''), (s, r))
reset_limits()
codes = [book(990 + 30 * i)[0] for i in range(6)]
check('limit: 6th booking from one address in 10 min refused', codes[:5] == [200] * 5 and codes[5] == 429, codes)
s, r = book(1140)
check('limit: the connection limit says so', s == 429 and 'from this connection' in r.get('message', ''), (s, r))
reset_limits()
codes = [book(540)[0] for i in range(6)]  # all taken -> 409, should not count
check('limit: failed attempts are not counted', codes == [409] * 6 and book(1170)[0] == 200, codes)
reset_limits()
codes = [book(1200 + 0 * i, headers=None)[0] for i in range(1)]
spoof = [call('POST', '/bookings', {'branch':'arekere','date':DAY,'time':1230,'name':'Spoof','phone':phone()}, headers={'CF-Connecting-IP': '1.2.3.%d' % i})[0] for i in range(6)]
check('limit: fake Cloudflare header does not reset the limit', spoof[-1] == 429 or spoof.count(200) <= 4, spoof)
reset_limits()

# ---- owner auth
s, r = call('GET', '/admin/state')
check('owner: no login is refused', s in (401, 403), (s, r))
s, r = call('GET', '/admin/state', owner=True)
check('owner: state loads', s == 200, (s, r))
s, r = call('GET', f'/admin/bookings?date={DAY}&branch=arekere', owner=True)
check('owner: day list loads', s == 200, (s, str(r)[:200]))

# ---- desk booking + status
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
free = [x['t'] for x in r['times'] if 'jeya' in x['doctors']][0]
s, r = call('POST', '/admin/bookings', {'branch':'arekere','date':DAY,'time':free,'name':'Walk In','phone':phone()}, owner=True)
check('desk: walk-in booked', s == 200 and r.get('doctor') == 'jeya', (s, r))
desk_id = r.get('id') if isinstance(r, dict) else None
s, r = call('POST', f'/admin/bookings/{desk_id}/status', {'status':'arrived'}, owner=True)
check('desk: mark arrived', s == 200 and r.get('status') == 'arrived', (s, r))

# ---- leave cancels and undo restores
s, r = call('POST', '/admin/leave', {'branch':'arekere','doctor':'jeya','date':DAY}, owner=True)
cancelled = [int(x['id']) for x in r.get('cancelled', [])] if isinstance(r, dict) else []
check('leave: cancels Jeya\'s booked patients and lists them', s == 200 and first_id in cancelled and not r.get('failed'), (s, r))
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
check('leave: no slots that day', r['times'] == [], r)
s, r = book(900)
check('leave: booking that day refused', s >= 400, (s, r))
s, r = call('POST', '/admin/leave', {'branch':'arekere','doctor':'jeya','date':DAY}, owner=True)
check('leave: twice is refused (409)', s == 409, (s, r))
s, r = call('DELETE', '/admin/leave', {'branch':'arekere','doctor':'jeya','date':DAY}, owner=True)
check('leave undo: all restored', s == 200 and r.get('not_restored') == [], (s, r))
st = wp('db','query',f"SELECT status FROM wp_jpn_bookings WHERE id={first_id}",'--skip-column-names')
check('leave undo: first booking is booked again', st == 'booked', st)

# ---- leave + closed + undo leave must NOT restore onto a closed day
call('POST', '/admin/leave', {'branch':'arekere','doctor':'jeya','date':DAY}, owner=True)
call('POST', '/admin/closed', {'branch':'arekere','date':DAY,'reason':'Test'}, owner=True)
s, r = call('DELETE', '/admin/leave', {'branch':'arekere','doctor':'jeya','date':DAY}, owner=True)
check('undo leave on a closed day: nothing restored, all listed', s == 200 and first_id in r.get('not_restored', []), (s, r))
s, r = call('DELETE', '/admin/closed', {'branch':'arekere','date':DAY}, owner=True)
check('undo closed: closed-day list restores nothing it did not cancel', s == 200, (s, r))
st = wp('db','query',f"SELECT status FROM wp_jpn_bookings WHERE id={first_id}",'--skip-column-names')
check('booking from the leave stays cancelled (owner restores by hand)', st == 'cancelled', st)

# ---- slot freed by a cancel can be rebooked, and restoring then clashes
reset_limits()
s, r = book(540)
check('cancelled slot can be booked again', s == 200, (s, r))
s, r = call('POST', f'/admin/bookings/{first_id}/status', {'status':'booked'}, owner=True)
check('restoring a booking whose slot is now taken -> 409', s == 409, (s, r))

# ---- timings change rewrites the website file
v0 = wp('option','get','jpn_snapshot_version')
s, r = call('PUT', '/admin/schedule/arekere', {'timings': {'days':[1,2,3,4,5,6],'sessions':[[540,780],[960,1230]],'slot':30}}, owner=True)
v1 = wp('option','get','jpn_snapshot_version')
check('timings: saved', s == 200 and r.get('sessions')[1] == [960,1230], (s, r))
check('timings: website file version changed', v0 != v1, (v0, v1))
js = subprocess.run(['curl','-s',SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
check('timings: website file shows 16:00-20:30', '"sessions":[[9,13],[16,20.5]]' in js, js[:300])
gz = subprocess.run(['docker','compose','exec','-T','wp','sh','-c','gzip -dc /var/www/html/wp-content/uploads/jpnagar/site-data.js.gz | cmp - /var/www/html/wp-content/uploads/jpnagar/site-data.js && echo same; ls /var/www/html/wp-content/uploads/jpnagar/'], cwd=D, capture_output=True, text=True).stdout
check('snapshot: .gz matches .js, no temp files left', 'same' in gz and '.tmp' not in gz, gz)
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
check('timings: 20:00 slot now exists, 20:30 does not', any(x['t'] == 1200 for x in r['times']) and not any(x['t'] == 1230 for x in r['times']), r)

# ---- hours that differ by day
week = {'1': [[540, 780]], '2': [[600, 720], [690, 900]], '3': []}  # Mon mornings; Tue overlapping (second dropped); Wed closed
s, r = call('PUT', '/admin/schedule/arekere', {'timings': {'week': week, 'slot': 60}}, owner=True)
check('week: per-day hours saved', s == 200 and r.get('days') == [1, 2], (s, r))
check('week: overlapping hours cleaned up', s == 200 and r['week']['2'] if isinstance(r.get('week'), dict) else r.get('week', [None, None, None])[2] == [[600, 720]], r.get('week'))
s, r = call('GET', f'/slots?branch=arekere&date={DAY}')
check('week: Monday offers 9-12 on the hour only', [x['t'] for x in r['times']] == [540, 600, 660, 720] or set(x['t'] for x in r['times']) <= {540, 600, 660, 720}, r)
s, r = call('GET', f'/slots?branch=arekere&date={TUESDAY}')
check('week: Tuesday follows its own hours', s == 200 and all(600 <= x['t'] < 720 for x in r['times']) and r['times'], r)
js = subprocess.run(['curl','-s', SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
check('week: website file has each day and the slot length', '"week":{"1":[[9,13]],"2":[[10,12]]}' in js and '"slot":60' in js, js[js.find('"arekere"'):js.find('"arekere"') + 300])
s, r = call('PUT', '/admin/schedule/arekere', {'timings': {'days': [1, 2, 3, 4, 5, 6], 'sessions': [[540, 780], [960, 1230]], 'slot': 30}}, owner=True)
check('week: older one-set-of-hours timings still accepted', s == 200 and r.get('days') == [1, 2, 3, 4, 5, 6], (s, r))

# ---- content draft + publish
s, st8 = call('GET', '/admin/state', owner=True)
draft = st8.get('draft') or st8.get('content') or {}
if draft:
    draft['home']['headline'] = 'Test headline'
    for d in draft['doctors']:
        if d['id'] == 'senthil': d['branches'] = ['jpnagar']
    s, r = call('PUT', '/admin/content', draft, owner=True)
    check('content: draft saved', s == 200, (s, r))
    js = subprocess.run(['curl','-s',SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
    check('content: draft not on website before Publish', 'Test headline' not in js)
    s, r = call('GET', f'/slots?branch=jpnagar&date={DAY}')
    check('content: Senthil not bookable before Publish', r['times'] == [], r)
    s, r = call('POST', '/admin/publish', {}, owner=True)
    js = subprocess.run(['curl','-s',SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
    check('publish: website file has new headline', s == 200 and 'Test headline' in js, (s, r))
    s, r = call('GET', f'/slots?branch=jpnagar&date={DAY}')
    check('publish: Senthil now bookable at JP Nagar', r['times'] and r['times'][0]['doctors'] == ['senthil'], r)
else:
    check('state has the content draft', False, list(st8.keys()))

# ---- desk cancel
s, r = call('POST', f'/admin/bookings/{desk_id}/status', {'status':'cancelled'}, owner=True)
check('desk: cancel', s == 200 and r.get('status') == 'cancelled', (s, r))

# ---- booking email: to the branch, readable date
reset_limits()
wp_rm = subprocess.run(['docker','compose','exec','-T','wp','rm','-f','/var/www/html/wp-content/caught-mail.txt'], cwd=D)
s, r = call('POST', '/bookings', {'branch':'jpnagar','date':TUESDAY,'time':600,'name':'Mail Test','phone':phone(),'problem':'Lower back'})
mail = subprocess.run(['docker','compose','exec','-T','wp','cat','/var/www/html/wp-content/caught-mail.txt'], cwd=D, capture_output=True, text=True).stdout
nice = datetime.date.fromisoformat(TUESDAY).strftime('%a ') + str(datetime.date.fromisoformat(TUESDAY).day) + datetime.date.fromisoformat(TUESDAY).strftime(' %b') + ', 10:00 am'
check('email: sent to the branch address', s == 200 and 'TO: jpnagarmedicalandphysio@gmail.com' in mail, (s, mail))
check('email: date reads like "' + nice + '"', ('When: ' + nice) in mail and nice in mail.split('\n')[1], mail)

# ---- photos
def upload(path, mime, kind='portrait'):
    out = subprocess.run(['curl','-s','-u','admin:' + APP_PASS,'-F','kind=' + kind,'-F','photo=@' + path + ';type=' + mime, BASE + '/admin/photos'], capture_output=True, text=True).stdout
    try: return json.loads(out)
    except Exception: return out
tmp = subprocess.run(['mktemp','-d'], capture_output=True, text=True).stdout.strip()
subprocess.run(['docker','compose','exec','-T','wp','php','-r','$i=imagecreatetruecolor(3000,3750);imagefill($i,0,0,imagecolorallocate($i,200,120,90));imagejpeg($i,"/tmp/big.jpg",90);'], cwd=D)
subprocess.run(['docker','compose','cp','wp:/tmp/big.jpg', tmp + '/big.jpg'], cwd=D, capture_output=True)
r = upload(tmp + '/big.jpg', 'image/jpeg')
check('photo: uploaded', isinstance(r, dict) and r.get('id'), r)
if isinstance(r, dict) and r.get('url'):
    info = subprocess.run(['docker','compose','exec','-T','wp','php','-r','$p="/var/www/html/wp-content/uploads/".substr(parse_url($argv[1],PHP_URL_PATH),strlen("/wp-content/uploads/"));$s=getimagesize($p);echo $s[0],"x",$s[1]," ",$s["mime"];', r['url']], cwd=D, capture_output=True, text=True).stdout
    check('photo: WebP, shrunk to 800x1000', info.startswith('800x1000 image/webp'), info)
# a photo already smaller than the card (a close crop) used to fail: WordPress won't "resize" it
subprocess.run(['docker','compose','exec','-T','wp','php','-r','$i=imagecreatetruecolor(500,625);imagefill($i,0,0,imagecolorallocate($i,90,140,200));imagewebp($i,"/tmp/small.webp",82);'], cwd=D)
subprocess.run(['docker','compose','cp','wp:/tmp/small.webp', tmp + '/small.webp'], cwd=D, capture_output=True)
r = upload(tmp + '/small.webp', 'image/webp')
check('photo: smaller than the card uploads as is', isinstance(r, dict) and r.get('id'), r)
# over PHP's upload limit: refused with the reason and the limit, not "no photo arrived"
subprocess.run(['docker','compose','exec','-T','wp','php','-r','$w=1600;$h=2000;$i=imagecreatetruecolor($w,$h);for($y=0;$y<$h;$y+=2)for($x=0;$x<$w;$x+=2)imagefilledrectangle($i,$x,$y,$x+1,$y+1,imagecolorallocate($i,mt_rand(0,255),mt_rand(0,255),mt_rand(0,255)));imagepng($i,"/tmp/huge.png");'], cwd=D)
subprocess.run(['docker','compose','cp','wp:/tmp/huge.png', tmp + '/huge.png'], cwd=D, capture_output=True)
r = upload(tmp + '/huge.png', 'image/png')
check('photo: over the server limit says so, with the limit', 'too big for the server' in str(r) and 'MB' in str(r), r)
log = subprocess.run(['docker','compose','exec','-T','wp','sh','-c','grep -c "photo upload failed" /var/www/html/wp-content/debug.log || true'], cwd=D, capture_output=True, text=True).stdout.strip()
check('photo: every refused upload is logged with its cause', log.isdigit() and int(log) >= 1, log)
open(tmp + '/bad.jpg', 'w').write('<?php echo 1; ?>')
r = upload(tmp + '/bad.jpg', 'image/jpeg')
check('photo: a PHP file pretending to be a jpeg is refused', 'jpn_file' in str(r), r)
s, r = call('POST', '/admin/photos', {'kind':'portrait'})
check('photo: no login refused', s in (401, 403), (s, r))

# ---- clinic photos by branch (more than the old six), and a photo per service
ids = [upload(tmp + '/small.webp', 'image/webp', 'clinic').get('id') for _ in range(8)]
svc = upload(tmp + '/small.webp', 'image/webp', 'service')
check('photos: clinic and service photos upload', all(ids) and isinstance(svc, dict) and svc.get('id'), (ids, svc))
s, st8 = call('GET', '/admin/state', owner=True)
draft = st8['draft']
draft['photos'] = [{'id': ids[i], 'label': '', 'branch': ['jpnagar', 'arekere', 'bannerghatta', 'nowhere'][i % 4]} for i in range(8)]
draft['service_photos'] = {'spine': svc['id'], 'ortho': 999999}
s, r = call('PUT', '/admin/content', draft, owner=True)
check('photos: all eight kept (no six-photo cap), each with its branch', s == 200 and len(r['photos']) == 8 and r['photos'][0]['branch'] == 'jpnagar', (s, r.get('photos')))
check('photos: an unknown branch is dropped to none', s == 200 and r['photos'][3]['branch'] is None, r.get('photos'))
check('photos: a service photo is kept, a made-up id is not', s == 200 and r['service_photos'] == {'spine': svc['id']}, r.get('service_photos'))
s, r = call('POST', '/admin/publish', {}, owner=True)
js = subprocess.run(['curl','-s', SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
check('photos: website file has branch photos and the service photo', s == 200 and js.count('"branch":"jpnagar"') == 2 and '"service_photos":{"spine":"' in js, js[js.find('"photos"'):js.find('"photos"') + 200])
s, st8 = call('GET', '/admin/state', owner=True)
check('photos: the admin gets every photo\'s address back', str(svc['id']) in st8['photo_urls'] and all(str(i) in st8['photo_urls'] for i in ids), list(st8['photo_urls'])[:12])

# ---- the home page's own photo
hp = upload(tmp + '/small.webp', 'image/webp', 'home')
s, st8 = call('GET', '/admin/state', owner=True); draft = st8['draft']
draft['home']['photo'] = hp.get('id')
s, r = call('PUT', '/admin/content', draft, owner=True)
check('home photo: kept in the draft', s == 200 and r['home']['photo'] == hp.get('id'), (s, r.get('home')))
s, r = call('POST', '/admin/publish', {}, owner=True)
js = subprocess.run(['curl','-s', SITE + '/wp-content/uploads/jpnagar/site-data.js'], capture_output=True, text=True).stdout
check('home photo: on the website after Publish', s == 200 and ('"home":{' in js and hp['url'].split('/')[-1] in js), js[js.find('"home"'):js.find('"home"') + 220])
draft['home']['photo'] = 424242
s, r = call('PUT', '/admin/content', draft, owner=True)
check('home photo: an id that isn\'t one of our photos is dropped', s == 200 and r['home']['photo'] == 0, r.get('home'))

# ---- no PHP warnings or notices anywhere in the run
log = subprocess.run(['docker','compose','exec','-T','wp','sh','-c','grep -v -E "J.P. Nagar Clinic: (booking email for|photo upload failed)" /var/www/html/wp-content/debug.log 2>/dev/null || true'], cwd=D, capture_output=True, text=True).stdout.strip()
check('no PHP warnings, notices or errors logged', log == '', log[:600])

print('\n%d failed' % len(fails)); sys.exit(1 if fails else 0)
