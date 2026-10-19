(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasLibs = !!(window.gsap && window.ScrollTrigger);
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  root.classList.add('js');
  if (reduce || !hasLibs) root.classList.add('no-motion');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var header = $('.site-header'), toggle = $('.menu-toggle'), mobileNav = $('#navigation'), dock = $('.dock');
  var lenis = null;

  /* ---------- tone switcher ---------- */
  var tones = $$('.tones button');
  var nodeRGB = '109,176,236';
  function readNode() { nodeRGB = getComputedStyle(root).getPropertyValue('--node').trim() || nodeRGB; }
  function setTone(t) {
    root.dataset.tone = t;
    tones.forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.tone === t)); });
    try { localStorage.setItem('tone', t); } catch (e) {}
    var meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
    readNode();
  }
  tones.forEach(function (b) { b.addEventListener('click', function () { setTone(b.dataset.tone); }); });
  setTone(root.dataset.tone || 'midnight');

  /* ---------- mobile menu ---------- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function () { setMenu(false); });

  /* ---------- section highlight ---------- */
  var navLinks = $$('a', dock).concat($$('a', mobileNav));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) {
          if (l.hash === '#' + en.target.id) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section').forEach(function (s) { io.observe(s); });
  }

  /* ---------- hero: 3D network with hunting attack paths ---------- */
  var canvas = $('#scene'), ctx = canvas.getContext('2d'), hero = $('.hero');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), heroVisible = true;
  var ptr = { x: 0, y: 0, sx: -9999, sy: -9999, in: false };
  var nodes = [], edges = [], adj = [], paths = [], rings = [];
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function build() {
    var r = seeded(11), n = innerWidth < 700 ? 64 : 120;
    nodes = []; edges = []; adj = [];
    while (nodes.length < n) {
      var x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1;
      if (x * x + y * y + z * z > 1) continue;
      nodes.push({ x: x * 1.15, y: y * .82, z: z, sx: 0, sy: 0, d: 0, lit: 0 });
    }
    nodes.forEach(function (a, i) {
      adj[i] = adj[i] || [];
      var ds = nodes.map(function (b, j) { return [j, Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)]; })
        .filter(function (o) { return o[0] !== i && o[1] < .34; }).sort(function (p, q) { return p[1] - q[1]; }).slice(0, 3);
      ds.forEach(function (o) {
        adj[o[0]] = adj[o[0]] || [];
        if (adj[i].indexOf(o[0]) < 0) { adj[i].push(o[0]); adj[o[0]].push(i); edges.push([i, o[0]]); }
      });
    });
  }
  function resize() {
    var b = hero.getBoundingClientRect();
    W = canvas.width = Math.round(b.width * dpr); H = canvas.height = Math.round(b.height * dpr);
    canvas.style.width = b.width + 'px'; canvas.style.height = b.height + 'px';
  }
  function bfs(a, b) {
    var prev = {}, q = [a]; prev[a] = -1;
    while (q.length) { var c = q.shift(); if (c === b) break; (adj[c] || []).forEach(function (n) { if (!(n in prev)) { prev[n] = c; q.push(n); } }); }
    if (!(b in prev)) return null;
    var p = [], c2 = b; while (c2 !== -1) { p.unshift(c2); c2 = prev[c2]; } return p;
  }
  function spawnPath(from) {
    for (var t = 0; t < 12; t++) {
      var a = from != null ? from : Math.floor(Math.random() * nodes.length);
      var b = Math.floor(Math.random() * nodes.length), p = bfs(a, b);
      if (p && p.length > 5) { paths.push({ n: p, t: 0, v: from != null ? 5.5 : 2.2 }); return; }
    }
  }
  var last = 0, spawnT = 0, spin = 0;
  function draw(ts, still) {
    var dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
    if (!still) { spin += dt * .07; spawnT -= dt; if (spawnT <= 0 && paths.length < 3) { spawnPath(); spawnT = 2.4; } }
    ptr.x += (ptr.tx - ptr.x) * .05; ptr.y += (ptr.ty - ptr.y) * .05;
    var ang = spin + ptr.x * .55, pit = .22 + ptr.y * .3, ca = Math.cos(ang), sa = Math.sin(ang), cp = Math.cos(pit), sp = Math.sin(pit);
    var narrow = innerWidth < 1100, S = Math.min(W, H) * (narrow ? .42 : .52), cx = W * (narrow ? .5 : .7), cy = H * (narrow ? .62 : .44);
    ctx.clearRect(0, 0, W, H);
    var col = nodeRGB, i, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var X = n.x * ca + n.z * sa, Z = -n.x * sa + n.z * ca, Y = n.y * cp - Z * sp; Z = n.y * sp + Z * cp;
      var f = 1 / (1.9 - Z * .5);
      n.sx = cx + X * S * f * 1.1; n.sy = cy + Y * S * f * 1.1; n.d = (Z + 1) / 2; n.f = f;
      var dx = n.sx - ptr.sx * dpr, dy = n.sy - ptr.sy * dpr, d = Math.sqrt(dx * dx + dy * dy), R = 150 * dpr;
      if (d < R && d > 0) { var k = (1 - d / R); n.sx += dx / d * k * 34 * dpr; n.sy += dy / d * k * 34 * dpr; }
      n.lit *= .94;
    }
    ctx.lineWidth = dpr * .8;
    edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]], dd = (a.d + b.d) / 2;
      ctx.strokeStyle = 'rgba(' + col + ',' + (.05 + .2 * dd) + ')';
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    });
    for (var pi = paths.length - 1; pi >= 0; pi--) {
      var p = paths[pi]; if (!still) p.t += dt * p.v; var seg = p.n.length - 1;
      for (var s = 0; s < seg; s++) {
        var k2 = 1 - Math.min(1, Math.abs(s + .5 - p.t) / 3.2); if (k2 <= 0) continue;
        var A = nodes[p.n[s]], B = nodes[p.n[s + 1]];
        ctx.strokeStyle = 'rgba(' + col + ',' + (.25 + .7 * k2) + ')'; ctx.lineWidth = dpr * (1 + 2.2 * k2);
        ctx.shadowColor = 'rgba(' + col + ',.9)'; ctx.shadowBlur = 16 * dpr * k2;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke(); ctx.shadowBlur = 0;
        A.lit = Math.max(A.lit, k2); B.lit = Math.max(B.lit, k2);
      }
      if (p.t > seg + 3.2) paths.splice(pi, 1);
    }
    nodes.forEach(function (nd) {
      var r = (1.4 + 2.2 * nd.d) * dpr * (1 + nd.lit * 1.8);
      ctx.fillStyle = 'rgba(' + col + ',' + Math.min(1, .3 + .45 * nd.d + nd.lit) + ')';
      ctx.beginPath(); ctx.arc(nd.sx, nd.sy, r, 0, 6.2832); ctx.fill();
    });
    for (var ri = rings.length - 1; ri >= 0; ri--) {
      var rg = rings[ri]; rg.t += dt; var u = rg.t / 1.1;
      if (u >= 1) { rings.splice(ri, 1); continue; }
      ctx.strokeStyle = 'rgba(' + col + ',' + (.6 * (1 - u)) + ')'; ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.arc(rg.x * dpr, rg.y * dpr, (10 + u * 90) * dpr, 0, 6.2832); ctx.stroke();
    }
  }
  ptr.tx = 0; ptr.ty = 0;
  build(); resize(); readNode();
  window.addEventListener('resize', function () { resize(); build(); if (reduce) draw(0, true); });
  hero.addEventListener('pointermove', function (e) {
    var b = hero.getBoundingClientRect(); ptr.sx = e.clientX - b.left; ptr.sy = e.clientY - b.top;
    ptr.tx = (e.clientX / innerWidth - .5) * 2; ptr.ty = (e.clientY / innerHeight - .5) * 2;
  });
  hero.addEventListener('pointerleave', function () { ptr.sx = ptr.sy = -9999; ptr.tx = ptr.ty = 0; });
  canvas.addEventListener('click', function (e) {
    var b = canvas.getBoundingClientRect(), mx = (e.clientX - b.left) * dpr, my = (e.clientY - b.top) * dpr, best = -1, bd = 1e12;
    nodes.forEach(function (n, i) { var d = Math.pow(n.sx - mx, 2) + Math.pow(n.sy - my, 2); if (d < bd) { bd = d; best = i; } });
    rings.push({ x: e.clientX - b.left, y: e.clientY - b.top, t: 0 });
    if (best >= 0) spawnPath(best);
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(hero);
  if (reduce) { spawnPath(); paths.forEach(function (p) { p.t = 3; }); draw(0, true); }
  else { spawnPath(); (function loop(ts) { if (heroVisible && !document.hidden) draw(ts, false); requestAnimationFrame(loop); })(0); }

  /* ---------- search palette ---------- */
  var dlg = $('#palette'), input = $('#palette-input'), list = $('#palette-list'), index = null, shown = [], sel = 0;
  function buildIndex() {
    var map = [['main section h2', 'Section'], ['.publication h3', 'Publication'], ['.note-title', 'Patent or book'], ['.course-name', 'Course'], ['.timeline-content h3', 'Experience'], ['.education-entry h3', 'Education'], ['.project h3', 'Project'], ['.mou-list li span', 'MoU'], ['.event h4', 'Event'], ['.credential-list li', 'Development'], ['.skill-list li', 'Skill']];
    index = [];
    map.forEach(function (m) { $$(m[0]).forEach(function (el) { var t = (el.getAttribute('aria-label') || el.textContent).replace(/\s+/g, ' ').trim(); var box = el.closest('article, li') || el; if (t) index.push({ t: t, k: m[1], el: el, s: (m[1] === 'Section' ? t : box.textContent.replace(/\s+/g, ' ')) }); }); });
  }
  function render() {
    var q = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    shown = index.filter(function (it) { var s = (it.t + ' ' + it.k + ' ' + it.s).toLowerCase(); return q.every(function (w) { return s.indexOf(w) > -1; }); }).slice(0, 40);
    sel = 0; list.innerHTML = '';
    if (!shown.length) { list.innerHTML = '<li class="palette-empty" role="presentation">Nothing matches. Try a course, project or event name.</li>'; return; }
    shown.forEach(function (it, i) {
      var li = document.createElement('li'); li.id = 'pal-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === 0));
      var s = document.createElement('span'); s.textContent = it.t.length > 90 ? it.t.slice(0, 88) + '…' : it.t;
      var k = document.createElement('small'); k.textContent = it.k; li.appendChild(s); li.appendChild(k);
      li.addEventListener('click', function () { go(i); }); list.appendChild(li);
    });
    input.setAttribute('aria-activedescendant', 'pal-0');
  }
  function mark(i) {
    var items = $$('li[role="option"]', list); if (!items.length) return;
    sel = (i + items.length) % items.length;
    items.forEach(function (li, j) { li.setAttribute('aria-selected', String(j === sel)); });
    items[sel].scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', items[sel].id);
  }
  function go(i) {
    var it = shown[i]; if (!it) return; dlg.close();
    var target = it.el.closest('#projects') ? $('#projects') : it.el;
    setTimeout(function () { if (lenis) lenis.scrollTo(target, { offset: -120, duration: 1.4 }); else target.scrollIntoView({ block: 'center' }); }, 60);
  }
  function openPalette() { if (!index) buildIndex(); input.value = ''; render(); dlg.showModal(); input.focus(); if (lenis) lenis.stop(); }
  dlg.addEventListener('close', function () { if (lenis) lenis.start(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(sel - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
  });
  $('.search-btn').addEventListener('click', openPalette);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPalette(); }
    else if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });

  if (reduce || !hasLibs) { root.classList.add('loaded'); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = $(id); if (!t) return;
        e.preventDefault(); setMenu(false);
        lenis.scrollTo(id === '#home' ? 0 : t, { offset: id === '#home' ? 0 : -70, duration: 1.5 });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---------- text helpers ---------- */
  function splitWords(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label); el.textContent = '';
    var out = [];
    label.split(' ').forEach(function (word, i, arr) {
      var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span'); s.textContent = word; w.appendChild(s); out.push(s); el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return out;
  }
  function wrapWords(el, cls) {
    var nodes2 = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { var s = document.createElement('span'); s.className = cls; s.textContent = part; nodes2.push(s); frag.appendChild(s); }
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    return nodes2;
  }

  var heroWords = splitWords($('.hero h1'));
  gsap.set(heroWords, { yPercent: 118 });
  var headings = $$('.section-heading h2');
  var headingWords = headings.map(function (h) { var w = splitWords(h); gsap.set(w, { yPercent: 118 }); return w; });
  var blurWords = $$('[data-blur]').map(function (el) { var w = wrapWords(el, 'bw'); w.forEach(function (s) { s.style.display = 'inline-block'; }); gsap.set(w, { opacity: 0, filter: 'blur(12px)', y: 16 }); return w; });
  var statements = $$('[data-scrollreveal]').map(function (el) { return { el: el, w: wrapWords(el, 'sr-word') }; });
  statements.forEach(function (o) { gsap.set(o.w, { opacity: .3 }); });

  /* ---------- the one orchestrated load sequence ---------- */
  var count = $('.preloader-count'), bar = $('.preloader-bar i'), pre = $('.preloader');
  if (lenis) lenis.stop();
  var counter = { v: 0 };
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(counter, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: function () { count.textContent = Math.round(counter.v); } })
    .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
    .to(pre, { yPercent: -100, duration: 1.2, ease: 'expo.inOut', delay: .15, onComplete: function () { root.classList.add('loaded'); if (lenis) lenis.start(); } })
    .to(heroWords, { yPercent: 0, duration: 1.6, stagger: .14 }, '-=.6')
    .from('.hero-role, .hero-institution, .hero-actions > *', { y: 24, opacity: 0, duration: 1.1, stagger: .09 }, '-=1.2')
    .to(blurWords[0] || [], { opacity: 1, filter: 'blur(0px)', y: 0, duration: .9, stagger: .03 }, '-=1.2')
    .from('.hero-figure', { xPercent: -14, rotation: -3, opacity: 0, transformOrigin: '100% 100%', duration: 2.2, ease: 'power3.out' }, '-=1.7')
    .from('.contact-card', { x: 50, opacity: 0, duration: 1.3 }, '-=1.1')
    .from('.site-header', { yPercent: -100, duration: 1, clearProps: 'transform' }, '-=1.1');

  /* ---------- scroll ---------- */
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });
  gsap.to('.hero-copy', { yPercent: -10, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  headings.forEach(function (h, i) {
    gsap.to(headingWords[i], { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  statements.forEach(function (o) {
    gsap.to(o.w, { opacity: 1, stagger: .5, ease: 'none', scrollTrigger: { trigger: o.el, start: 'top 82%', end: 'bottom 55%', scrub: true } });
  });
  var tl = $('.timeline-line');
  if (tl) gsap.to(tl, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });

  $$('[data-media]').forEach(function (m) {
    var img = $('img', m), isGif = m.classList.contains('gif-frame');
    gsap.to(m, { clipPath: 'inset(0 0 0% 0 round 1.4rem)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 88%' } });
    if (!isGif) gsap.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-count]').forEach(function (el) {
    var n = parseInt(el.dataset.count, 10), o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { gsap.to(o, { v: n, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); } });
  });
  ['.publication', '.research-note', '.timeline-entry', '.education-entry', '.activity-group', '.event', '.course', '.credential-list li', '.personal-details > div', '.chips li', '.skill-list li', '.glance > div', '.mini-title', '.footer-row > *'].forEach(function (sel) {
    ScrollTrigger.batch(sel, { start: 'top 93%', once: true, onEnter: function (els) { gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .07, clearProps: 'transform' }); } });
  });
  gsap.from('.footer-big', { yPercent: 30, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer-big', start: 'top 95%' } });

  /* ---------- velocity marquees ---------- */
  var marquees = $$('.marquee').map(function (m) {
    var track = $('.marquee-track', m); track.innerHTML += track.innerHTML + track.innerHTML + track.innerHTML;
    return { track: track, dir: parseFloat(m.dataset.velocity) || 1, x: 0 };
  });
  var vel = 0, lastScroll = window.scrollY;
  gsap.ticker.add(function (t, dt) {
    var y = window.scrollY, v = (y - lastScroll) / Math.max(dt, 1); lastScroll = y; vel += (v - vel) * .08;
    marquees.forEach(function (m) {
      var w = m.track.scrollWidth / 4;
      m.x -= m.dir * (.05 + Math.min(Math.abs(vel), 4) * .35) * dt * (vel * m.dir < 0 ? -1 : 1);
      if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
      m.track.style.transform = 'translate3d(' + m.x + 'px,0,0)';
    });
  });

  /* ---------- projects: pinned horizontal run ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px) and (min-height: 600px)', function () {
    var sec = $('#projects'), grid = $('.project-grid', sec);
    var wrap = document.createElement('div'); wrap.className = 'projects-wrap';
    grid.parentNode.insertBefore(wrap, grid); wrap.appendChild(grid);
    var meter = document.createElement('div'); meter.className = 'proj-meter'; meter.setAttribute('aria-hidden', 'true');
    meter.innerHTML = '<span>1</span><i></i><span>5</span>'; sec.appendChild(meter);
    sec.classList.add('hscroll'); sec.classList.remove('container'); $('.section-heading', sec).classList.add('container');
    var dist = function () { return Math.max(0, grid.scrollWidth - innerWidth); };
    var tween = gsap.to(grid, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { meter.style.setProperty('--p', s.progress); } } });
    return function () {
      tween.kill(); gsap.set(grid, { clearProps: 'all' });
      wrap.parentNode.insertBefore(grid, wrap); wrap.remove(); meter.remove();
      sec.classList.remove('hscroll'); sec.classList.add('container'); $('.section-heading', sec).classList.remove('container');
    };
  });

  /* ---------- dock ---------- */
  ScrollTrigger.create({ start: 300, end: 'max', onToggle: function (self) { dock.classList.toggle('show', self.isActive); } });
  if (fine) {
    var dl = $$('a', dock);
    dock.addEventListener('pointermove', function (e) {
      dl.forEach(function (a) { var r = a.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); a.style.setProperty('--s', (1 + Math.max(0, 1 - d / 130) * .28).toFixed(3)); });
    });
    dock.addEventListener('pointerleave', function () { dl.forEach(function (a) { a.style.setProperty('--s', 1); }); });
  }

  /* ---------- cursor, magnet, tilt, spark ---------- */
  if (fine) {
    var cursor = $('.cursor'), cl = $('span', cursor);
    var cx = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cursor.classList.add('on'); cx(e.clientX); cy(e.clientY); });
    function hover(sel, text) {
      $$(sel).forEach(function (el) {
        el.addEventListener('pointerenter', function () { cursor.classList.add('big'); if (text) { cl.textContent = text; cursor.classList.add('label'); } });
        el.addEventListener('pointerleave', function () { cursor.classList.remove('big', 'label'); });
      });
    }
    hover('a, button, .skill-list li, .chips li, .course, .contact-card');
    hover('.project', 'Drag');

    $$('.button, .download-link, .header-cta, .to-top, .search-btn').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .25); my((e.clientY - r.top - r.height / 2) * .35); });
      el.addEventListener('pointerleave', function () { mx(0); my(0); });
    });
    $$('.tilt').forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 9); rx(-((e.clientY - r.top) / r.height - .5) * 9); });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('input,dialog')) return;
      for (var i = 0; i < 8; i++) {
        var s = document.createElement('i'); s.className = 'spark'; document.body.appendChild(s);
        var a = (i / 8) * 6.283 + Math.random() * .5, d = 26 + Math.random() * 30;
        gsap.fromTo(s, { x: e.clientX, y: e.clientY, opacity: 1, scale: 1 }, { x: e.clientX + Math.cos(a) * d, y: e.clientY + Math.sin(a) * d, opacity: 0, scale: 0, duration: .6, ease: 'power3.out', onComplete: function () { this.targets()[0].remove(); } });
      }
    });
    /* drag the project run */
    var runGrid = $('.project-grid'), dragging = false, sx = 0, sy0 = 0;
    runGrid.addEventListener('pointerdown', function (e) { if (!$('#projects').classList.contains('hscroll')) return; dragging = true; sx = e.clientX; sy0 = window.scrollY; });
    window.addEventListener('pointermove', function (e) { if (dragging) { var d = (sx - e.clientX) * 1.1; if (lenis) lenis.scrollTo(sy0 + d, { immediate: true }); else window.scrollTo(0, sy0 + d); } });
    window.addEventListener('pointerup', function () { dragging = false; });
  }

  /* ---------- header ---------- */
  var lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) {
    var y = self.scroll();
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > 400 && toggle.getAttribute('aria-expanded') !== 'true');
    lastY = y;
  } });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
