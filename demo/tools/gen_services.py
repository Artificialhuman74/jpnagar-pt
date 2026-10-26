"""Generates the nine service pages from one template (Spine & Back Care keeps its own page).
Content is general physiotherapy information for the clinic to check before launch."""
import html, os, sys

E = lambda s: html.escape(s, quote=True)

# scenes available: assess manual ift tens ultrasound swd traction myofascial hotcold catcow bridge stretch
CAP = {
    'assess': 'Day one: posture, movement and strength checks',
    'manual': 'Manual therapy: steady pressure from the hands',
    'ift': 'IFT: two gentle currents crossing where it hurts',
    'tens': 'TENS: mild pulses that quieten the pain signal',
    'ultrasound': 'Ultrasound: sound waves into the tissue, gliding in small circles',
    'swd': 'Short wave diathermy: deep, even warmth in the joint',
    'traction': 'Traction: a slow pull that eases the lower spine',
    'myofascial': 'Myofascial release: slow pressure as the tissue lets go',
    'hotcold': 'Heat relaxes, cold calms swelling',
    'catcow': 'Cat–cow: round, then gently dip the back',
    'bridge': 'Bridge: lift the hips, hold, lower slowly',
    'stretch': 'Stretching: a straight-leg lift, held gently',
}
NAME = {'assess': 'Assessment', 'manual': 'Manual therapy', 'ift': 'IFT', 'tens': 'TENS', 'ultrasound': 'Ultrasound', 'swd': 'Short wave diathermy',
        'traction': 'Lumbar traction', 'myofascial': 'Myofascial release', 'hotcold': 'Heat and cold', 'catcow': 'Cat–cow', 'bridge': 'Bridge', 'stretch': 'Stretching'}

PAGES = [
  dict(id='ortho', file='ortho.html', name='Orthopaedic Physiotherapy', h1='Orthopaedic<br>Physiotherapy',
       title='Orthopaedic Physiotherapy in South Bangalore', desc='Physiotherapy for knee, shoulder, hip, elbow and ankle problems, frozen shoulder and fracture recovery at three branches in South Bangalore.',
       lead='For joints and muscles that hurt, stiffen, or haven’t been the same since an injury.', area='knee', cta='Book for joint pain', mode='map',
       conds=[('Knee pain', 'front', 'knee-a', 'Wear in the joint, an injury, or weak muscles around the knee.'),
              ('Frozen shoulder', 'front', 'shoulder-a', 'The shoulder slowly stiffens and becomes painful to move.'),
              ('Tennis elbow', 'front', 'elbow-a', 'Overworked tendons on the outer side of the elbow.'),
              ('Hip pain', 'front', 'hip-a', 'Stiff or aching hips, from wear or an old injury.'),
              ('Ankle sprain', 'front', 'foot-a', 'Stretched or torn ligaments around the ankle.'),
              ('Fracture recovery', 'front', 'hand-a', 'Getting movement and strength back once a bone has healed.')],
       ch1=('A full check of the joint on your first visit.', ['Where it hurts, and what makes it better or worse', 'How far the joint moves, and how it feels to move', 'The strength of the muscles around it', 'Any X-rays, scans or reports you bring']),
       ch2=('Hands-on treatment and gentle machines, picked for you.', [('manual', 'Hands-on work on stiff joints and tight muscles.'), ('ultrasound', 'Sound waves to ease a sore tendon or ligament.'), ('swd', 'Deep warmth for a stiff, aching joint.')]),
       ch3=('Exercises to keep the joint strong and moving.', [('stretch', 'Lengthening the muscles that pull on the joint.'), ('bridge', 'Strength for the hips, back and knees.')])),
  dict(id='sports', file='sports.html', name='Sports Physiotherapy', h1='Sports<br>Physiotherapy',
       title='Sports Physiotherapy in South Bangalore', desc='Physiotherapy for sprains, strains, ligament injuries and running or gym injuries, with a safe plan back to sport, at three branches in South Bangalore.',
       lead='For sprains, strains and injuries from running, the gym or the field, and getting you back to it safely.', area='knee', cta='Book for a sports injury', mode='map',
       conds=[('Ankle sprain', 'front', 'foot-a', 'Rolled ankles that stretch or tear the ligaments.'),
              ('Knee ligament injury', 'front', 'knee-a', 'Twisting injuries to the ligaments that steady the knee.'),
              ('Hamstring strain', 'back', '96:286', 'A pulled muscle at the back of the thigh, often from sprinting.'),
              ('Shoulder injury', 'front', 'shoulder-a', 'Strains from lifting, throwing or racquet sports.'),
              ('Shin pain', 'front', '98:384', 'Pain along the shin from running more, or more often.')],
       ch1=('A check of the injury and of what your sport needs.', ['How the injury happened', 'Strength, balance and movement, compared with the other side', 'What your sport asks of your body', 'Any scans or reports you bring']),
       ch2=('Treatment to settle the injury and start healing well.', [('ultrasound', 'Sound waves to a sore tendon or ligament.'), ('hotcold', 'Cold for a fresh injury, heat once it settles.'), ('myofascial', 'Slow pressure to free up tight tissue.')]),
       ch3=('Building back strength and range, then back to sport.', [('stretch', 'Getting full range back without forcing it.'), ('bridge', 'Strength for the hips and the back of the legs.')])),
  dict(id='postop', file='postop.html', name='Post-Operative Rehab', h1='Post-Operative<br>Rehab',
       title='Post-Operative Rehab and Joint Replacement Physiotherapy in South Bangalore', desc='Rehab after knee or hip replacement, fracture surgery, spine surgery and ligament repairs, at a pace that suits your operation, at three branches in South Bangalore.',
       lead='Getting moving again after surgery, at a pace that suits your operation.', area='knee', cta='Book rehab after surgery', mode='map',
       conds=[('Knee replacement', 'front', 'knee-a', 'Getting the new knee bending, straightening and walking well.'),
              ('Hip replacement', 'front', 'hip-a', 'Safe movement and strength back after a new hip.'),
              ('Ligament repair', 'front', 'knee-b', 'Protecting the repair while the knee regains strength.'),
              ('Shoulder surgery', 'front', 'shoulder-a', 'Bringing movement back gradually, within your surgeon’s limits.'),
              ('Spine surgery', 'back', 'lower', 'Walking, posture and core strength after an operation on the back.'),
              ('Fracture surgery', 'front', 'hand-a', 'Movement and strength back once plates or pins are in place.')],
       ch1=('A check of where you are, and what your surgeon has advised.', ['Your surgeon’s notes and any limits they have set', 'How far you can move, and how it feels', 'Swelling, strength and how you walk', 'What you need to get back to at home and work']),
       ch2=('Calming the swelling and loosening the stiffness.', [('hotcold', 'Cold to calm swelling in the early weeks.'), ('manual', 'Gentle hands-on work for stiff joints and scar tissue.'), ('tens', 'Mild pulses to help with pain.')]),
       ch3=('Strength and confidence, step by step.', [('bridge', 'Strength for standing up, walking and stairs.'), ('stretch', 'Getting back the range the joint needs.')]),
       note='Your exercises will follow your surgeon’s guidance and the type of operation you had.'),
  dict(id='neuro', file='neuro.html', name='Neurological Physiotherapy', h1='Neurological<br>Physiotherapy',
       title='Neurological Physiotherapy and Stroke Rehab in South Bangalore', desc='Physiotherapy after a stroke, for Parkinson’s, balance problems and nerve injuries, to rebuild movement and independence, at three branches in South Bangalore.',
       lead='Rebuilding movement, balance and independence after a stroke and other nerve conditions.', area='', cta='Book an assessment', mode='map',
       conds=[('Stroke recovery', 'front', '120:40,shoulder-a,elbow-a,hand-a,knee-a,foot-a', 'Retraining movement on the side the stroke has affected.'),
              ('Parkinson’s', 'front', '120:40,knee-a,knee-b,foot-a,foot-b', 'Keeping steps long, balance steady and movement flowing.'),
              ('Balance and falls', 'front', 'foot-a,foot-b,knee-a,knee-b', 'Steadier standing and walking, and fewer falls.'),
              ('Nerve injuries', 'front', 'elbow-a,hand-a', 'Weakness or numbness after a nerve is injured.'),
              ('Bell’s palsy', 'front', '108:46', 'Weakness on one side of the face.')],
       ch1=('A careful look at how you move, and what you want to do again.', ['How you sit, stand and walk', 'Balance and coordination', 'Strength and muscle tone on each side', 'What you want to be able to do again']),
       ch2=('Keeping muscles and joints supple while movement returns.', [('stretch', 'Stretches to stop tight muscles from stiffening joints.'), ('manual', 'Hands-on work to ease stiffness and tone.')]),
       ch3=('Strength for standing, walking and everyday tasks.', [('bridge', 'Strength for standing up and walking.')]),
       ch2t='Get moving again', ch3t='Keep improving'),
  dict(id='women', file='women.html', name='Women’s Health', h1='Women’s<br>Health',
       title='Women’s Health Physiotherapy in South Bangalore', desc='Physiotherapy for back and pelvic pain in pregnancy, recovery after delivery and pelvic floor care, at three branches in South Bangalore.',
       lead='Care for the back, pelvis and pelvic floor through pregnancy, after delivery, and beyond.', area='lower', cta='Book for women’s health', mode='map',
       conds=[('Back pain in pregnancy', 'back', 'lower', 'A growing bump shifts posture and loads the lower back.'),
              ('Pelvic girdle pain', 'back', 'hip-a,hip-b', 'Pain at the joints at the back and front of the pelvis.'),
              ('After delivery', 'front', '120:196', 'Rebuilding core strength and posture after your baby.'),
              ('Tummy muscle gap', 'front', '120:176', 'A gap between the tummy muscles after pregnancy.'),
              ('Pelvic floor care', 'front', '120:236', 'Strengthening the muscles that support the bladder.')],
       ch1=('A check that fits where you are in pregnancy or recovery.', ['Where it hurts, and what pregnancy or delivery has changed', 'How you stand, sit, bend and lift', 'Core and pelvic floor strength, at a pace you’re comfortable with', 'Your due date, or how your delivery went']),
       ch2=('Gentle, safe relief for back and pelvic pain.', [('manual', 'Gentle hands-on work for the back and pelvis.'), ('myofascial', 'Slow pressure to ease tight tissue.'), ('hotcold', 'Heat for tight muscles, where it’s safe to use.')]),
       ch3=('Exercises for the core, back and pelvic floor.', [('catcow', 'Easing the back on all fours.'), ('bridge', 'Strength for the hips, back and pelvic floor.')]),
       note='In pregnancy, do only the exercises your physiotherapist gives you.'),
  dict(id='paeds', file='paeds.html', name='Paediatric Physiotherapy', h1='Paediatric<br>Physiotherapy',
       title='Paediatric Physiotherapy for Children in South Bangalore', desc='Physiotherapy for children: delayed walking or crawling, posture, flat feet, stiff necks in babies and sports injuries in teens, at three branches in South Bangalore.',
       lead='Helping children move, play and grow with confidence.', area='', cta='Book for my child', mode='map',
       conds=[('Delayed walking or crawling', 'front', 'hip-a,hip-b,knee-a,knee-b', 'Help to reach sitting, crawling and walking milestones.'),
              ('Posture in children', 'back', 'upper,lower', 'Slouching or uneven shoulders from long hours at a desk.'),
              ('Flat feet', 'front', 'foot-a,foot-b', 'Low arches that make feet or legs ache.'),
              ('Stiff neck in babies', 'back', 'neck', 'A baby who keeps the head tilted to one side.'),
              ('Sports injuries in teens', 'front', 'knee-a', 'Strains, sprains and growth-related knee pain.')],
       ch1=('A playful check of how your child moves.', ['How your child sits, crawls, stands or walks', 'Strength, balance and coordination for their age', 'What you have noticed at home or school', 'Any reports from your doctor']),
       ch2=('Treatment that feels like play.', [('stretch', 'Gentle stretches for tight muscles.'), ('bridge', 'Strength for the hips and back.')]),
       ch3=('Simple routines you can do together at home.', [('catcow', 'An easy move for a supple back.')]),
       ch2t='Learn through play', ch3t='Practise at home'),
  dict(id='geri', file='geri.html', name='Geriatric Physiotherapy', h1='Geriatric<br>Physiotherapy',
       title='Geriatric Physiotherapy for Older Adults in South Bangalore', desc='Physiotherapy for arthritis, balance and fall prevention, stiffness and staying mobile, for older adults, at three branches in South Bangalore.',
       lead='Staying strong, steady and independent as you get older.', area='knee', cta='Book for an elderly parent', mode='map',
       conds=[('Knee arthritis', 'front', 'knee-a,knee-b', 'Wear in the knees that makes walking and stairs hard.'),
              ('Balance and falls', 'front', 'foot-a,foot-b', 'Steadier on your feet, and less worried about falling.'),
              ('Back stiffness', 'back', 'lower', 'A stiff, aching back, especially in the morning.'),
              ('Hip arthritis', 'front', 'hip-a', 'Stiff hips that make getting up and walking hard.'),
              ('Shoulder stiffness', 'front', 'shoulder-a', 'Trouble reaching up, behind or across.')],
       ch1=('A gentle check of strength, balance and everyday movement.', ['How you walk, stand up and keep your balance', 'Strength and how far your joints move', 'Pain and stiffness through the day', 'Your home, and what you want to keep doing']),
       ch2=('Easing pain and stiffness in the joints.', [('swd', 'Deep warmth for stiff, arthritic joints.'), ('ultrasound', 'Sound waves to ease sore tendons.'), ('hotcold', 'Heat to loosen stiff muscles.')]),
       ch3=('Strength and balance to stay independent.', [('bridge', 'Strength for getting up from a chair or bed.'), ('stretch', 'Keeping the legs supple for walking.')])),
  dict(id='home', file='homecare.html', name='Home Care Physiotherapy', h1='Home Care<br>Physiotherapy',
       title='Home Care Physiotherapy in South Bangalore', desc='Physiotherapy at home when travel is hard: after a hospital stay, after surgery, bedside rehab and care for elderly parents, around our three South Bangalore branches.',
       lead='The same care, at home, when getting to the clinic is hard.', area='', cta='Book a home visit', mode='scene',
       conds=[('After a hospital stay', 'bridge', '', 'Rebuilding strength so getting in and out of bed is easier.'),
              ('Bedside rehab', 'stretch', '', 'Exercises in bed, guided by your physiotherapist.'),
              ('Pain relief at home', 'tens', '', 'Small, portable machines that work just as well at home.'),
              ('Getting steady again', 'assess', '', 'Balance and walking practice around your own home.')],
       ch1=('A check of how you manage around your home.', ['How you move around your home', 'Getting in and out of bed and chairs', 'Strength and balance', 'What family members can help with']),
       ch2=('Treatment brought to you.', [('manual', 'Hands-on treatment at your bedside.'), ('tens', 'A small, portable unit for pain.')]),
       ch3=('Exercises that fit your home and routine.', [('bridge', 'Strength for getting up from the bed.'), ('stretch', 'Gentle stretches you can do lying down.')]),
       note='Areas we visit and timings to be confirmed by the clinic.'),
  dict(id='therapies', file='therapies.html', name='Therapies & Equipment', h1='Therapies &amp;<br>Equipment',
       title='Physiotherapy Treatments and Equipment in South Bangalore', desc='Manual therapy, exercise, IFT, TENS, ultrasound, short wave diathermy, traction, myofascial release, and heat and cold therapy, explained step by step.',
       lead='Hands-on treatment, exercise and gentle machines. See how each one works.', area='', cta='Book a visit', mode='scene',
       conds=[('Manual therapy', 'manual', '', 'Hands that move stiff joints and work on tight muscles.'),
              ('IFT', 'ift', '', 'Two gentle currents that cross where it hurts.'),
              ('Ultrasound', 'ultrasound', '', 'Sound waves you can’t hear, into the tissue below.'),
              ('TENS', 'tens', '', 'Mild pulses that calm pain signals.'),
              ('Traction', 'traction', '', 'A slow, controlled pull that eases the lower spine.'),
              ('Heat and cold', 'hotcold', '', 'Heat relaxes tight muscles; cold calms swelling.')],
       ch1=('Treatment with the hands: joints, muscles and the tissue around them.', None),
       ch1subs=[('manual', 'Moving stiff joints and easing tight muscles.'), ('myofascial', 'Slow, sustained pressure until tight tissue lets go.'), ('stretch', 'Guided stretches through the full range.')],
       ch2=('Gentle machines that calm pain and warm deep tissue.', [('ift', 'Two currents that cross where it hurts.'), ('tens', 'Mild pulses that quieten pain.'), ('ultrasound', 'Sound waves into a sore tendon.'), ('swd', 'Deep, even warmth in a joint.'), ('traction', 'A slow pull on the lower spine.')]),
       ch3=('Heat, cold and the exercises that keep you well.', [('hotcold', 'Heat or cold, depending on the stage.'), ('catcow', 'Easing the spine on all fours.'), ('bridge', 'Strength for the hips and back.')]),
       ch1t='Hands-on', ch2t='Gentle machines', ch3t='Heat, cold and exercise', steps=('1 · Hands-on', '2 · Machines', '3 · Exercise')),
]

TOP = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · J.P. Nagar Physio</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;display=swap">
<link rel="stylesheet" href="desktop.css">
</head>
<body data-page="{id}" data-service="{id}" data-area="{area}">
<a class="skiplink" href="#main">Skip to content</a>
<header class="hd">
  <div class="wrap hd-in">
    <a class="hd-logo" href="home.html"><img src="../canon/logo.webp" alt="J.P. Nagar Medical &amp; Physiotherapy Centre, home" width="408" height="301"></a>
    <div class="hd-right">
      <span class="live" data-live></span>
      <span class="hd-sep" aria-hidden="true"></span>
      <a class="hd-call" href="tel:+919916116625"><i data-icon="phone"></i>+91 99161 16625</a>
      <a class="btn btn--ghost btn--sm" href="https://wa.me/919916116625" target="_blank" rel="noopener"><i data-icon="whatsapp"></i>WhatsApp</a>
    </div>
  </div>
</header>
'''

def subtabs(step, items):
    return '\n'.join(f'            <button class="subtab" type="button" aria-pressed="{"true" if i == 0 else "false"}" data-sub="{i}" data-scene="{s}" data-cap="{E(CAP[s])}"><b>{E(NAME[s])}</b><span>{E(t)}</span><i class="bar" aria-hidden="true"></i></button>' for i, (s, t) in enumerate(items))

def page(p):
    book = f'book.html?service={p["id"]}' + (f'&amp;area={p["area"]}' if p['area'] else '')
    pills = '\n'.join(
        f'          <button class="pill" type="button" aria-pressed="{"true" if i == 0 else "false"}" data-cond data-text="{E(text)}" ' +
        (f'data-scene="{face}"' if p['mode'] == 'scene' else f'data-face="{face}" data-spots="{spots}"') + f'>{E(name)}</button>'
        for i, (name, face, spots, text) in enumerate(p['conds']))
    first = p['conds'][0]
    steps = p.get('steps', ('1 · Find the cause', '2 · Ease the pain', '3 · Make it last'))
    ch1t, ch2t, ch3t = p.get('ch1t', 'Find the cause'), p.get('ch2t', 'Ease the pain'), p.get('ch3t', 'Make it last')
    ch1_lead, ticks = p['ch1']
    if p.get('ch1subs'):
        ch1_body = f'          <div class="subtabs" data-subs="0">\n{subtabs(0, p["ch1subs"])}\n          </div>'
        ch1_attr = ''
    else:
        ch1_body = '          <ul class="ticks">\n' + '\n'.join(f'            <li><i data-icon="tick"></i><span>{E(t)}</span></li>' for t in ticks) + '\n          </ul>'
        ch1_attr = f' data-scene="assess" data-cap="{E(CAP["assess"])}"'
    note = p.get('note', 'These are examples. Do only the exercises your physiotherapist gives you.')
    help_h = 'Treatments' if p['id'] == 'therapies' else 'Helps with'
    help_hint = 'point at one to see how it works' if p['mode'] == 'scene' else 'point at one to see where it happens'
    return TOP.format(title=E(p['title']), desc=E(p['desc']), id=p['id'], area=p['area']) + f'''
<main id="main" tabindex="-1" class="wrap">
  <a class="back-link" href="services.html"><i data-icon="chevron"></i>All services</a>

  <section class="svc-hero" aria-labelledby="svc-h">
    <div>
      <h1 class="display" id="svc-h">{p['h1']}</h1>
      <p class="lead">{E(p['lead'])}</p>
      <div class="conds">
        <h2 class="sub-h">{help_h} <small>· {help_hint}</small></h2>
        <div class="pills">
{pills}
        </div>
      </div>
      <div class="svc-cta">
        <a class="btn btn--act btn--lg" href="{book}"><span>{E(p['cta'])}</span><i class="arrow" data-icon="arrow"></i></a>
        <p class="next-free" data-next></p>
      </div>
    </div>
    <div class="spine-stage map-stage" data-map-stage data-mode="{p['mode']}">
      <div class="cond-cap" aria-live="polite"><b data-cond-name>{E(first[0])}</b><p data-cond-text>{E(first[3])}</p></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="how-h">
    <div class="sec-head">
      <h2 class="h2" id="how-h">{'How each one works' if p['id'] == 'therapies' else 'How we treat it'}</h2>
      <p class="lead">{'Three groups, used together in your plan. Scroll to watch each one.' if p['id'] == 'therapies' else 'Three stages, adjusted as you improve. Scroll to watch each one.'}</p>
    </div>
    <div class="story">
      <div class="story-stage">
        <div class="story-steps" role="group" aria-label="Stages">
          <button type="button" data-goto="0" aria-current="step">{E(steps[0])}</button>
          <button type="button" data-goto="1">{E(steps[1])}</button>
          <button type="button" data-goto="2">{E(steps[2])}</button>
        </div>
        <div class="scene-host" data-story-host></div>
        <p class="story-cap" data-story-cap aria-live="polite"></p>
      </div>
      <div class="chapters">
        <article class="chapter" data-step="0"{ch1_attr} aria-labelledby="ch1">
          <div class="chapter-h"><span class="n" aria-hidden="true">1</span><h3 id="ch1">{E(ch1t)}</h3></div>
          <p class="lead">{E(ch1_lead)}</p>
{ch1_body}
        </article>
        <article class="chapter" data-step="1" aria-labelledby="ch2">
          <div class="chapter-h"><span class="n" aria-hidden="true">2</span><h3 id="ch2">{E(ch2t)}</h3></div>
          <p class="lead">{E(p['ch2'][0])}</p>
          <div class="subtabs" data-subs="1">
{subtabs(1, p['ch2'][1])}
          </div>
        </article>
        <article class="chapter" data-step="2" aria-labelledby="ch3">
          <div class="chapter-h"><span class="n" aria-hidden="true">3</span><h3 id="ch3">{E(ch3t)}</h3></div>
          <p class="lead">{E(p['ch3'][0])}</p>
          <div class="subtabs" data-subs="2">
{subtabs(2, p['ch3'][1])}
          </div>
          <p class="note">{E(note)}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="sec visit" aria-labelledby="exp-h">
    <div>
      <h2 class="h2" id="exp-h">What to expect</h2>
      <p class="lead">From your first visit to managing on your own.</p>
    </div>
    <ol class="hsteps" data-inview>
      <li><b>First visit · 45 min</b><span>Assessment and your first treatment. [Confirm duration]</span></li>
      <li><b>Next few weeks</b><span>Sessions as often as your plan needs. [Confirm typical count]</span></li>
      <li><b>Back to normal</b><span>A home routine to keep you well.</span></li>
    </ol>
  </section>

  <section class="sec" aria-labelledby="who-h">
    <div class="sec-head">
      <h2 class="h2" id="who-h">Who treats it</h2>
      <a class="link" href="team.html">Meet the whole team<i data-icon="chevron"></i></a>
    </div>
    <div class="who3" data-who></div>
  </section>

  <section class="sec ready" aria-labelledby="go-h">
    <div>
      <h2 class="h2" id="go-h">Start with an assessment.</h2>
      <p class="lead">Your first visit finds the cause and starts your treatment.</p>
      <a class="btn btn--act btn--lg" href="{book}"><span>{E(p['cta'])}</span><i class="arrow" data-icon="arrow"></i></a>
    </div>
    <div class="go-times">
      <p class="sub-h" data-go-title>Next free times</p>
      <div class="qb-chips" data-go-times></div>
      <a class="link" href="branches.html">Other branches<i data-icon="chevron"></i></a>
    </div>
  </section>
</main>

<footer class="ft" data-footer></footer>
<div class="fab"></div>
<nav class="dock" data-active="services"></nav>
<script src="../canon/clinic.js"></script>
<script src="../canon/figure.js"></script>
<script src="app.js"></script>
<script src="../canon/published-data.js"></script>
<script src="../canon/published.js"></script>
<script src="anatomy.js"></script>
<script src="scenes.js"></script>
<script src="service.js"></script>
</body>
</html>
'''

if __name__ == '__main__':
  OUT = sys.argv[1]
  for p in PAGES:
    with open(os.path.join(OUT, p['file']), 'w') as f:
        f.write(page(p))
    print('wrote', p['file'])
