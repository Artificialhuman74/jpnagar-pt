"""Generates the ten phone service pages (demo/mobile) from the same content as the desktop pages.
Content is general physiotherapy information for the clinic to check before launch."""
import os, sys
from gen_services import PAGES, CAP, NAME, E

SPINE = dict(id='spine', file='spine.html', name='Spine & Back Care', h1='Spine &amp; Back Care',
  title='Spine and Back Care', desc='Physiotherapy for back and neck pain, slip disc, sciatica and posture problems at three branches in South Bangalore.',
  lead='For back and neck pain that won’t go away, or keeps coming back.', area='lower', cta='Book for back pain', mode='map',
  conds=[('Lower back pain', 'back', 'lower', 'Pain in the muscles, joints and discs low in the back.'),
         ('Neck pain', 'back', 'neck', 'Often from posture, strain, or stiff joints and muscles in the neck.'),
         ('Slip disc', 'back', '120:204', 'A disc between two vertebrae bulges out and can press on a nerve.'),
         ('Sciatica', 'back', '120:200,100:272,99:334', 'An irritated nerve low in the back sends pain down the back of the leg.'),
         ('Stiffness', 'back', 'upper,lower', 'Joints along the spine that have stopped moving freely.'),
         ('Posture from desk work', 'back', 'neck,upper', 'Long hours at a desk load the neck and upper back.'),
         ('Pain in pregnancy', 'back', 'lower,hip-a,hip-b', 'The growing bump shifts posture and loads the lower back and pelvis.')],
  ch1=('Posture, movement and strength checks on your first visit.', ['How you stand, sit and walk', 'How far you can bend and turn, and what brings the pain on', 'The strength of the muscles that hold your spine', 'Any reports, X-rays or scans you bring']),
  ch2=('Hands-on treatment and gentle machines, picked for you.', [('manual', 'Hands-on work on stiff joints and tight muscles.'), ('ift', 'Gentle currents through small pads to calm the pain.'), ('traction', 'A slow, steady pull that eases pressure on the spine.')]),
  ch3=('Core and posture exercises you can do at home.', [('catcow', 'Gently rounding and dipping the back on all fours.'), ('bridge', 'Lifting the hips to strengthen the back and hips.')]))

WHO = [('Dr. P. Senthil', 'Founder · MPT, COMT'), ('Dr. Vanitha Senthil', 'MPT, COMT'), ('Dr. Jeya Chitra Devi', 'HOD, Arekere')]


def subs(step, items):
    return '\n'.join(
        f'      <button class="subtab" type="button" aria-pressed="{"true" if i == 0 else "false"}" data-sub="{i}" data-scene="{s}" data-cap="{E(CAP[s])}">'
        f'<b>{E(NAME[s])}</b><span>{E(t)}</span><i class="bar" aria-hidden="true"></i></button>'
        for i, (s, t) in enumerate(items))


def page(p):
    book = f'book.html?service={p["id"]}' + (f'&amp;area={p["area"]}' if p['area'] else '')
    scene_mode = p['mode'] == 'scene'
    pills = '\n'.join(
        f'    <button class="pill" type="button" aria-pressed="{"true" if i == 0 else "false"}" data-cond data-text="{E(text)}" '
        + (f'data-scene="{face}"' if scene_mode else f'data-face="{face}" data-spots="{spots}"') + f'>{E(name)}</button>'
        for i, (name, face, spots, text) in enumerate(p['conds']))
    first = p['conds'][0]
    steps = [s.split(' · ', 1)[1] for s in p.get('steps', ('1 · Find the cause', '2 · Ease the pain', '3 · Make it last'))]
    ch1_lead, ticks = p['ch1']
    if p.get('ch1subs'):
        ch1_body, ch1_attr = f'    <div class="subtabs" data-subs="0">\n{subs(0, p["ch1subs"])}\n    </div>', ''
    else:
        ch1_body = '    <ul class="ticks">\n' + '\n'.join(f'      <li><i data-icon="tick"></i><span>{E(t)}</span></li>' for t in ticks) + '\n    </ul>'
        ch1_attr = f' data-scene="assess" data-cap="{E(CAP["assess"])}"'
    note = p.get('note', 'These are examples. Do only the exercises your physiotherapist gives you.')
    therapies = p['id'] == 'therapies'
    who = '\n'.join(f'    <a href="team.html?open={i}"><div class="photo"></div><b>{n}</b><small>{d}</small></a>' for i, (n, d) in enumerate(WHO))
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(p['title'])} · J.P. Nagar Physio</title>
<meta name="description" content="{E(p['desc'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;display=swap">
<link rel="stylesheet" href="../canon/base.css">
<link rel="stylesheet" href="site.css">
</head><body class="has-sticky" data-service="{p['id']}" data-area="{p['area']}">
<header class="top"><img class="logo" src="../canon/logo.webp" alt="J.P. Nagar Medical & Physiotherapy Centre" width="408" height="301"></header>
<a class="backlink" href="services.html"><i data-icon="back"></i>All services</a>
<div class="phead" data-reveal>
  <h1>{p['h1'].replace('<br>', ' ')}</h1>
  <p>{E(p['lead'])}</p>
</div>

<section class="where" aria-labelledby="where-h">
  <h2 class="where-h" id="where-h">{'Treatments' if therapies else 'Helps with'}<small>{'Tap one to see how it works' if scene_mode else 'Tap one to see where it happens'}</small></h2>
  <div class="where-stage" data-map-stage data-mode="{p['mode']}"></div>
  <div class="where-cap" aria-live="polite"><b data-cond-name>{E(first[0])}</b><p data-cond-text>{E(first[3])}</p></div>
  <div class="cond-row" role="group" aria-label="{'Treatments' if therapies else 'Problems we treat'}">
{pills}
  </div>
</section>

<section class="sec how" aria-labelledby="how-h">
  <h2 id="how-h" data-reveal>{'How each one works' if therapies else 'How we treat it'}</h2>
  <div class="seg" role="tablist" aria-label="Stages">
    <button type="button" role="tab" data-goto="0" aria-selected="true"><small>1</small>{E(steps[0])}</button>
    <button type="button" role="tab" data-goto="1" aria-selected="false"><small>2</small>{E(steps[1])}</button>
    <button type="button" role="tab" data-goto="2" aria-selected="false"><small>3</small>{E(steps[2])}</button>
    <span class="seg-ind" aria-hidden="true"></span>
  </div>
  <div class="how-stage" data-story-stage>
    <div class="scene-host" data-story-host></div>
    <div class="sub-slot" data-sub-slot></div>
    <p class="how-cap" data-story-cap aria-live="polite"></p>
  </div>
  <div class="chapter" data-step="0" role="tabpanel"{ch1_attr}>
    <p class="how-lead">{E(ch1_lead)}</p>
{ch1_body}
  </div>
  <div class="chapter" data-step="1" role="tabpanel" hidden>
    <p class="how-lead">{E(p['ch2'][0])}</p>
    <div class="subtabs" data-subs="1">
{subs(1, p['ch2'][1])}
    </div>
  </div>
  <div class="chapter" data-step="2" role="tabpanel" hidden>
    <p class="how-lead">{E(p['ch3'][0])}</p>
    <div class="subtabs" data-subs="2">
{subs(2, p['ch3'][1])}
    </div>
    <p class="how-note">{E(note)}</p>
  </div>
</section>

<section class="sec">
  <h2 data-reveal>What to expect</h2>
  <ol class="steps" data-inview>
    <li data-reveal><div><b>First visit · 45 min</b><span>Assessment and your first treatment. [Confirm duration]</span></div></li>
    <li data-reveal><div><b>Next few weeks</b><span>Sessions as often as your plan needs. [Confirm typical count]</span></div></li>
    <li data-reveal><div><b>Back to normal</b><span>A home routine to keep you well.</span></div></li>
  </ol>
</section>

<section class="sec">
  <h2 data-reveal>Who treats it</h2>
  <div class="who-treats">
{who}
  </div>
</section>

<section class="sec">
  <div class="nextfree" data-nextfree hidden>
    <b data-nf-title></b>
    <div class="nf-times" data-nf-times></div>
    <a class="link" href="branches.html">Other branches<i data-icon="chevron"></i></a>
  </div>
</section>

<div class="stickybook">
  <a class="sb-icon" href="tel:+919916116625" aria-label="Call the clinic"><i data-icon="phone"></i></a>
  <a class="btn btn--act" href="{book}">{E(p['cta'])}</a>
  <a class="sb-icon" href="https://wa.me/919916116625" target="_blank" rel="noopener" aria-label="WhatsApp the clinic"><i data-icon="whatsapp"></i></a>
</div>
<nav class="dock" data-active="services"></nav>
<script src="app.js"></script>
<script src="../canon/published-data.js"></script>
<script src="../canon/published.js"></script>
<script src="kit.js"></script>
<script src="../desktop/anatomy.js"></script>
<script src="../desktop/scenes.js"></script>
<script src="service.js"></script>
</body></html>
'''


if __name__ == '__main__':
    OUT = sys.argv[1]
    for p in PAGES + [SPINE]:
        with open(os.path.join(OUT, p['file']), 'w') as f:
            f.write(page(p))
        print('wrote', p['file'])
