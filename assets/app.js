/* 퀴즈쇼 진행: 표지 → 월드 지도 → (검은 입장 카드) → 스테이지(문제) → 선물 블록 → 클리어(정답) → 지도
   화면 크기는 1920×1080 하나로 만들고 창 크기에 맞춰 통째로 키우고 줄인다. 남는 곳은 검은 띠(옛날 TV 느낌). */
(function () {
  const SET = window.QUIZ_SETTINGS, QS = window.QUIZ_QUESTIONS;

  /* 문제 파일에 오타가 있으면 파일을 읽지 못한다. 빈 화면 대신 원인을 알려 준다. */
  const brokenFile = !QS ? 'data/questions.js' : !SET ? 'data/settings.js' : null;
  if (brokenFile) {
    const box = document.createElement('div');
    box.className = 'fatal';
    box.innerHTML = `<div><b>${brokenFile}</b> 파일을 읽지 못했습니다.<br>방금 고친 곳의 쉼표(,)와 따옴표(")를 확인한 뒤 다시 열어 주세요.</div>`;
    document.body.appendChild(box);
    return;
  }

  const { sprites: SP } = window.Pixel;
  const World = window.World, Fx = window.Fx, Fox = window.Fox, tween = window.foxTween;
  const Sound = window.Sound, Bgm = window.Bgm;
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const key = (k) => `<kbd>${k}</kbd>`;
  const pad2 = (n) => String(n).padStart(2, '0');
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const U = 6; /* 화면 한 칸 */
  const FLOOR = 828; /* 땅 윗면(px). 그 아래 96px 은 땅, 맨 아래 156px 은 검은 상태 막대 */

  /* ---------- 문제 데이터 ---------- */
  const SLOTS = Math.max(1, Math.min(4, SET.slotsPerCell || 4));
  const CATS = SET.categories, LEVELS = SET.levels;
  const STAGES = ['day', 'water', 'sky', 'cave'];
  const STAGE_NAME = { day: '평원', water: '물속', sky: '하늘', cave: '지하', night: '밤 마을', sunset: '노을 언덕', ice: '얼음 동굴' };
  const idOf = (cat, level, n) => `${cat}_${level}_${n}`;
  const parseId = (id) => { const [cat, level, no] = id.split('_'); return { cat, level, no: Number(no) }; };
  const hasContent = (q) => !!(q && (q.q || q.q_img || q.q_audio));
  const allIds = [];
  CATS.forEach((c) => LEVELS.forEach((l) => { for (let n = 1; n <= SLOTS; n++) allIds.push(idOf(c.name, l.name, n)); }));
  const readyIds = allIds.filter((id) => hasContent(QS[id]));
  const catOf = (name) => CATS.find((c) => c.name === name) || CATS[0];
  const catIndex = (name) => Math.max(0, CATS.indexOf(catOf(name)));
  const levelIndex = (name) => Math.max(0, LEVELS.findIndex((l) => l.name === name));
  const stageOf = (name) => { const c = catOf(name); return c.stage || STAGES[catIndex(name) % STAGES.length]; };
  /* 문제 하나의 스테이지: 분야 = 월드 풍경, 난이도 = 그 월드의 시간대 (하 낮 · 중 노을 · 상 밤) */
  const TODS = ['day', 'dusk', 'night'];
  const TOD_NAME = { day: '낮', dusk: '노을', night: '밤' };
  const todOfLevel = (li) => { const l = LEVELS[li] || {}; return TOD_NAME[l.time] ? l.time : TODS[Math.min(li, TODS.length - 1)]; };
  /* 입장 카드에 나오는 스테이지 이름 (월드 × 시간대) */
  const TOD_STAGE = {
    day: { day: '낮의 평원', dusk: '노을 평원', night: '밤의 평원' },
    water: { day: '맑은 바다', dusk: '노을 바다', night: '깊은 밤바다' },
    sky: { day: '맑은 하늘', dusk: '노을 하늘', night: '별빛 밤하늘' },
    cave: { day: '얼음 동굴', dusk: '붉은 동굴', night: '깊은 동굴' }
  };
  const stageName = (id) => { const st = stageOf(parseId(id).cat), td = todOf(id); return (TOD_STAGE[st] || {})[td] || `${TOD_NAME[td]} ${STAGE_NAME[st] || ''}`; };
  const todOf = (id) => todOfLevel(levelIndex(parseId(id).level));
  const sideStage = (id) => World.side(stageOf(parseId(id).cat), { tint: catHex(catOf(parseId(id).cat)), tod: todOf(id) });
  /* 문제 화면 배경음: 분야의 bgm 에서 난이도 순서대로 */
  const trackOf = (id) => { const p = parseId(id), list = catOf(p.cat).bgm || []; return list[levelIndex(p.level)] || ''; };
  const stageBgm = (id, restart) => { const t = trackOf(id); if (t) Bgm.scene(`stage:${t}`, [t], { restart }); else Bgm.scene(null); };
  const starsOf = (level) => '★'.repeat(levelIndex(level) + 1);
  const label = (id) => { const p = parseId(id); return `${p.cat} ${p.level}-${p.no}`; };

  /* ---------- 저장: 새로고침해도 그대로 돌아오게 ---------- */
  const STORE_KEY = `quizshow:${SET.storageKey || 'default'}`;
  const blank = () => ({ screen: 'title', current: null, cursor: null, used: {}, timer: null, audioPos: {}, saved: 0 });
  let storageOk = true;
  function loadState() {
    const found = [];
    [window.localStorage, window.sessionStorage].forEach((box) => {
      try { const raw = box.getItem(STORE_KEY); if (raw) found.push(JSON.parse(raw)); } catch (e) { /* 저장소를 쓸 수 없는 환경 */ }
    });
    if (!found.length) return blank();
    found.sort((a, b) => (b.saved || 0) - (a.saved || 0));
    return { ...blank(), ...found[0] };
  }
  const state = loadState();
  function save() {
    document.body.dataset.screen = state.screen;
    state.saved = Date.now();
    const raw = JSON.stringify(state);
    let wrote = false;
    [window.localStorage, window.sessionStorage].forEach((box) => { try { box.setItem(STORE_KEY, raw); wrote = true; } catch (e) { /* 다른 저장소에 맡긴다 */ } });
    storageOk = wrote;
  }
  const usedCount = () => readyIds.filter((id) => state.used[id]).length;
  const PRESETS = (SET.timerPresets || [5, 10, 15]).map(Number).filter((n) => n > 0).slice(0, 5);

  /* ---------- 화면 크기 맞추기 ---------- */
  const stage = $('#stage'), screens = $('#screens'), actors = $('#actors');
  let view = { s: 1, x: 0, y: 0 };
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.min(w / 1920, h / 1080);
    view = { s, x: (w - 1920 * s) / 2, y: (h - 1080 * s) / 2 };
    stage.style.transform = `translate(${view.x}px,${view.y}px) scale(${s})`;
  }
  const toStage = (cx, cy) => ({ x: (cx - view.x) / view.s, y: (cy - view.y) / view.s });
  const rectOf = (node) => {
    const r = node.getBoundingClientRect();
    const a = toStage(r.left, r.top), b = toStage(r.right, r.bottom);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };

  /* ---------- 연출 단위: 화면이 바뀌면 진행 중인 연기를 모두 끊는다 ---------- */
  let scene = { id: 0, timers: [] };
  const heroes = {};
  let busy = false;
  function newScene() {
    scene.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    scene = { id: scene.id + 1, timers: [] };
    Object.values(heroes).forEach((f) => { f.stop(); f.carry(null); f.pose('idle'); f.el.style.clipPath = ''; clearTimeout(f.sayTimer); f.bubble.classList.remove('show'); });
    actors.querySelectorAll('.temp').forEach((n) => n.remove());
    $('#vignette').classList.remove('on');
    $('#dim').classList.remove('on', 'instant');
    return scene;
  }
  const alive = (s) => s.id === scene.id;
  const later = (s, ms) => new Promise((res) => { if (alive(s)) s.timers.push(setTimeout(res, ms)); });
  const every = (s, ms, fn) => s.timers.push(setInterval(fn, ms));

  /* ---------- 화면 전환: 네모 점으로 된 동그라미가 오므라들었다가 다시 열린다 ---------- */
  const wipeEl = $('#wipe');
  wipeEl.width = 320; wipeEl.height = 180;
  const wg = wipeEl.getContext('2d');
  function irisPaint(cx, cy, r) {
    const img = wg.createImageData(320, 180), d = img.data;
    const x0 = cx / U, y0 = cy / U, rr = (r / U) ** 2;
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
      if ((x + .5 - x0) ** 2 + (y + .5 - y0) ** 2 > rr) d[(y * 320 + x) * 4 + 3] = 255;
    }
    wg.putImageData(img, 0, 0);
  }
  /* 네모 블록이 왼쪽 위부터 대각선으로 차올랐다가 같은 순서로 걷힌다 */
  function checkerPaint(p, opening) {
    wg.clearRect(0, 0, 320, 180);
    wg.fillStyle = '#000';
    const T = 20, cols = 16, rows = 9, span = cols + rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = (c + r) / span;
      let f = Math.max(0, Math.min(1, (p - k * .6) / .4));
      if (opening) f = 1 - f;
      const sz = Math.round(T * f);
      if (sz > 0) wg.fillRect(c * T + (T - sz) / 2, r * T + (T - sz) / 2, sz, sz);
    }
  }
  function checker(mid, hold = 200) {
    wipeEl.classList.add('on');
    Sound.play('iris');
    return tween(620, (p) => checkerPaint(p, false)).then(async () => {
      checkerPaint(1, false);
      const extra = await mid();
      await new Promise((r) => setTimeout(r, typeof extra === 'number' ? extra : hold));
      return tween(620, (p) => checkerPaint(p, true));
    }).then(() => { wg.clearRect(0, 0, 320, 180); wipeEl.classList.remove('on'); });
  }
  /* 보스 얼굴 모양 화면 전환 (난이도 '상' = 밤 스테이지 입장).
     뿔·가시 갈기가 달린 성난 괴물 얼굴 모양 구멍으로 화면이 오므라들고, 눈·콧구멍·입은 검게 뚫린다.
     u, v 는 얼굴 크기로 나눈 좌표 (가운데 0, 가로 반폭 ≈ 1) */
  const triIn = (x, y, ax, ay, bx, by, cx, cy) => {
    const d = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    const a = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / d, b = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / d;
    return a >= 0 && b >= 0 && a + b <= 1;
  };
  function bossInside(u, v) {
    const x = Math.abs(u); /* 좌우 대칭 */
    const shape = (x / .62) ** 2 + ((v - .08) / .6) ** 2 <= 1 /* 머리 */
      || (x / .56) ** 2 + ((v - .42) / .32) ** 2 <= 1 /* 턱 */
      || triIn(x, v, .2, -.36, .52, -.22, .68, -1) /* 뿔 */
      || triIn(x, v, .52, -.24, .62, .06, .92, -.2) /* 갈기 가시 */
      || triIn(x, v, .6, .1, .6, .4, .94, .3)
      || triIn(x, v, .5, .44, .38, .68, .8, .72)
      || triIn(x, v, 0, -.48, .2, -.48, 0, -.86) /* 정수리 털 */
      || triIn(x, v, .06, -.46, .34, -.36, .3, -.76);
    if (!shape) return false;
    const eye = ((x - .24) / .12) ** 2 + ((v + .04) / .16) ** 2 <= 1 && v > -.24 + (.36 - x) * .7;
    const nose = ((x - .09) ** 2 + (v - .27) ** 2) <= .04 ** 2;
    const mouth = v > .44 && (x / .36) ** 2 + ((v - .44) / .16) ** 2 <= 1;
    const fang = triIn(x, v, .1, .44, .24, .44, .17, .58);
    return !(eye || nose || (mouth && !fang));
  }
  function bossPaint(cx, cy, size) {
    const img = wg.createImageData(320, 180), d = img.data;
    const x0 = cx / U, y0 = cy / U, k = U / Math.max(1, size);
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
      if (size <= 0 || !bossInside((x + .5 - x0) * k, (y + .5 - y0) * k)) d[(y * 320 + x) * 4 + 3] = 255;
    }
    wg.putImageData(img, 0, 0);
  }
  const BOSS_HOLD = 240; /* 잠깐 멈추는 얼굴 크기(px, 반폭) */
  const bossFar = (p) => Math.max(...[[0, 0], [1920, 0], [0, 1080], [1920, 1080]].map(([a, b]) => Math.hypot(a - p.x, b - p.y))) / .5;
  /* 닫기: 화면 가득 → 얼굴 크기에서 잠깐 멈춤 → 깜깜 */
  function bossClose(at) {
    wipeEl.classList.add('on');
    const S0 = bossFar(at), ease = (t) => 1 - (1 - t) ** 3;
    return tween(650, (p) => bossPaint(at.x, at.y, S0 + (BOSS_HOLD - S0) * ease(p)))
      .then(() => new Promise((r) => setTimeout(r, 420)))
      .then(() => tween(220, (p) => bossPaint(at.x, at.y, BOSS_HOLD * (1 - p * p))))
      .then(() => bossPaint(0, 0, 0));
  }
  /* 열기: 깜깜 → 얼굴이 쑥 → 잠깐 멈춤 → 화면 가득 */
  function bossOpen(at) {
    const S1 = bossFar(at), ease = (t) => t * t * t;
    return tween(220, (p) => bossPaint(at.x, at.y, BOSS_HOLD * (1 - (1 - p) ** 2)))
      .then(() => new Promise((r) => setTimeout(r, 380)))
      .then(() => tween(600, (p) => bossPaint(at.x, at.y, BOSS_HOLD + (S1 - BOSS_HOLD) * ease(p))))
      .then(() => { wg.clearRect(0, 0, 320, 180); wipeEl.classList.remove('on'); });
  }

  /* mid: 완전히 닫혔을 때 할 일. hold: 검은 화면 유지 시간. 열리는 자리 to */
  function wipe(from, mid, { hold = 120, to = { x: 960, y: 560 } } = {}) {
    const far = (p) => Math.max(...[[0, 0], [1920, 0], [0, 1080], [1920, 1080]].map(([a, b]) => Math.hypot(a - p.x, b - p.y))) + 12;
    const easeIn = (t) => t * t, easeOut = (t) => 1 - (1 - t) * (1 - t);
    wipeEl.classList.add('on');
    Sound.play('iris');
    const R0 = far(from);
    return tween(520, (p) => irisPaint(from.x, from.y, R0 * (1 - easeIn(p)))).then(async () => {
      irisPaint(0, 0, 0);
      const extra = await mid();
      await new Promise((r) => setTimeout(r, typeof extra === 'number' ? extra : hold));
      const R1 = far(to);
      return tween(560, (p) => irisPaint(to.x, to.y, R1 * easeOut(p)));
    }).then(() => { wg.clearRect(0, 0, 320, 180); wipeEl.classList.remove('on'); });
  }

  /* ---------- 검은 입장 카드 ---------- */
  const cardEl = $('#card');
  function showCard(id) {
    const p = parseId(id), c = catOf(p.cat);
    const left = readyIds.filter((x) => !state.used[x] && x !== id).length;
    cardEl.innerHTML = `
      <div class="card-world"><img src="${SP.icon(c.icon || 'book', '#ffffff')}" alt=""><span>WORLD ${catIndex(p.cat) + 1}-${levelIndex(p.level) + 1}</span></div>
      <div class="card-stage ${todOf(id)}"><img src="${SP.icon('flag', { day: '#ffd23f', dusk: '#ff8a5a', night: '#9ab4ff' }[todOf(id)])}" alt="">${esc(stageName(id))}</div>
      <div class="card-name" style="--c:${c.color || '#2f7ae8'}">${esc(p.cat)}</div>
      <div class="card-level">${esc(p.level)} - ${p.no} <em>${starsOf(p.level)}</em></div>
      <div class="card-lives"><img src="${portrait('gureum')}" alt=""><img src="${portrait('noeul')}" alt=""><b>× ${pad2(left)}</b><small>남은 문제</small></div>`;
    cardEl.classList.add('on');
  }
  const hideCard = () => cardEl.classList.remove('on');
  const portraits = {};
  const portrait = (kind) => portraits[kind] || (portraits[kind] = window.foxPortrait(kind));

  /* ---------- 알림 ---------- */
  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }
  /* 화면 가운데 큰 글자 (TIME UP!, 정답! 등) */
  function shout(text, cls = '', ms = 2200) {
    const n = el('div', `shout temp ${cls}`, [...text].map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join(''));
    actors.appendChild(n);
    setTimeout(() => n.classList.add('out'), ms);
    setTimeout(() => n.remove(), ms + 400);
    return n;
  }

  /* ---------- 대화창: 글자가 한 자씩 찍히고, 다 찍히면 ▶ 고르기 목록이 뜬다 ---------- */
  function typeOut(node, text, done) {
    const chars = [...text];
    let i = 0;
    const step = () => {
      if (!node.isConnected) return;
      i += 1;
      node.textContent = chars.slice(0, i).join('');
      if (i % 2) Sound.play('blip');
      if (i < chars.length) node._t = setTimeout(step, /[.,!?]/.test(chars[i - 1]) ? 110 : 30);
      else done();
    };
    node._finish = () => { clearTimeout(node._t); node.textContent = text; done(); };
    step();
  }
  function dialog(title, body, actions, who = 'noeul') {
    return new Promise((resolve) => {
      const back = el('div', 'modal-back');
      const box = el('div', 'dlg pwin', `<img class="dlg-face" src="${portrait(who)}" alt=""><div class="dlg-main"><div class="dlg-name">${who === 'noeul' ? '노을이' : '구름이'}</div><div class="dlg-title">${esc(title)}</div><div class="dlg-text"></div></div>`);
      const list = el('div', 'dlg-menu pwin');
      const text = $('.dlg-text', box);
      Sound.play('open');
      const btns = [];
      let sel = 0;
      const mark = (i) => { sel = i; btns.forEach((b, j) => b.classList.toggle('sel', j === i)); };
      actions.forEach((a, i) => {
        const b = el('button', 'dlg-opt', `<i class="ptr">▶</i><span>${esc(a.label)}</span>${key(i + 1)}`);
        b.onclick = () => { back.remove(); Sound.play('select'); resolve(a.value); };
        b.onmouseenter = () => { if (sel !== i) { mark(i); Sound.play('move'); } };
        btns.push(b);
        list.appendChild(b);
      });
      mark(0);
      back.move = (d) => { if (!list.classList.contains('show')) return; mark((sel + d + btns.length) % btns.length); Sound.play('move'); };
      back.pick = () => { if (list.classList.contains('show')) btns[sel].click(); else if (text._finish) text._finish(); };
      back.pickN = (n) => { if (btns[n]) btns[n].click(); };
      back.closeModal = () => { back.remove(); resolve(null); };
      back.append(box, list);
      stage.appendChild(back);
      let shown = false;
      const showList = () => { if (shown) return; shown = true; list.classList.add('show'); };
      box.onclick = () => text._finish && text._finish();
      setTimeout(() => typeOut(text, body, showList), 200);
    });
  }

  /* ---------- 미디어: 맥에서 압축한 파일을 윈도우에서 열면 한글 파일명 형식이 달라질 수 있어 둘 다 시도 ---------- */
  const mediaUrls = (name) => {
    const base = (SET.mediaFolder || 'resources').replace(/\/$/, '');
    return [...new Set([name.normalize('NFC'), name.normalize('NFD')])].map((f) => `${base}/${encodeURIComponent(f)}`);
  };
  function setMediaSrc(node, name, onFail) {
    const urls = mediaUrls(name);
    let i = 0;
    node.onerror = () => { i += 1; if (i < urls.length) node.src = urls[i]; else if (onFail) onFail(); };
    node.src = urls[0];
  }
  const missingMedia = {};
  function preflight() {
    allIds.forEach((id) => {
      const q = QS[id];
      if (!q) return;
      [['q_img', 'img'], ['a_img', 'img'], ['q_audio', 'audio'], ['a_audio', 'audio']].forEach(([k, kind]) => {
        if (!q[k]) return;
        const node = kind === 'img' ? new Image() : new Audio();
        if (kind === 'audio') node.preload = 'metadata';
        setMediaSrc(node, q[k], () => { (missingMedia[id] = missingMedia[id] || []).push(q[k]); });
      });
    });
  }
  /* 글자가 칸을 넘지 않을 때까지 줄인다. 도트 글꼴(11칸 격자)이 뭉개지지 않게 11의 배수로만 */
  function fitText(node, max, min) {
    let size = max;
    node.style.fontSize = `${size}px`;
    while (size > min && (node.scrollHeight > node.clientHeight + Math.max(2, size * .12) || node.scrollWidth > node.clientWidth + 1)) {
      size -= 11;
      node.style.fontSize = `${size}px`;
    }
  }
  /* 사진을 남는 공간에 꽉 차게 */
  function layoutMedia(body) {
    const box = $('.q-media', body);
    const img = box && $('img', box);
    if (!img || !img.naturalWidth) return;
    const others = [...body.children].filter((n) => n !== box);
    const taken = others.reduce((sum, n) => sum + n.offsetHeight + 20, 0);
    const k = Math.min((body.clientWidth - 24) / img.naturalWidth, (body.clientHeight - taken - 12) / img.naturalHeight);
    img.style.width = `${Math.round(img.naturalWidth * k)}px`;
    img.style.height = `${Math.round(img.naturalHeight * k)}px`;
    box.style.flex = `0 0 ${Math.round(img.naturalHeight * k) + 12}px`;
  }
  function zoomImage(src) {
    const z = el('div', 'zoom');
    const img = el('img');
    img.src = src;
    z.appendChild(img);
    z.onclick = () => z.remove();
    stage.appendChild(z);
  }
  function mediaImage(name) {
    const box = el('div', 'q-media');
    const img = el('img');
    img.alt = '';
    setMediaSrc(img, name, () => { box.innerHTML = `<div class="media-missing">사진을 찾지 못했습니다<br>resources/${esc(name)}</div>`; });
    img.onload = () => { if (box.parentElement) layoutMedia(box.parentElement); };
    img.onclick = () => zoomImage(img.src);
    box.appendChild(img);
    return box;
  }

  /* ---------- 음악 플레이어 ---------- */
  let currentAudio = null;
  const fmt = (sec) => { const s = Math.max(0, Math.floor(sec || 0)); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
  function stopAudio() {
    Bgm.hold(false);
    Sound.timer.stop();
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }
  function buildPlayer(name, posKey, s) {
    const bars = Array.from({ length: 20 }, (_, i) => `<i style="--d:${(-(i * 37 % 10) / 10).toFixed(1)}s;--h:${2 + (i * 7) % 8}"></i>`).join('');
    const box = el('div', 'player', `<button class="play">▶</button><div class="eq">${bars}</div><div class="seek-row"><span class="t-now">0:00</span><div class="seek"><b></b></div><span class="t-end">0:00</span></div>`);
    const audio = new Audio();
    audio.preload = 'auto';
    currentAudio = audio;
    setMediaSrc(audio, name, () => { box.innerHTML = `<div class="media-missing">음악을 찾지 못했습니다<br>resources/${esc(name)}</div>`; });
    const btn = $('.play', box), bar = $('.seek b', box);
    const paint = () => {
      btn.textContent = audio.paused ? '▶' : 'II';
      box.classList.toggle('playing', !audio.paused);
      heroMood();
    };
    audio.addEventListener('loadedmetadata', () => {
      $('.t-end', box).textContent = fmt(audio.duration);
      const pos = state.audioPos[posKey];
      if (pos && pos < audio.duration - 1) audio.currentTime = pos;
    });
    let lastSave = 0;
    audio.addEventListener('timeupdate', () => {
      $('.t-now', box).textContent = fmt(audio.currentTime);
      bar.style.width = `${(audio.currentTime / (audio.duration || 1)) * 100}%`;
      if (Date.now() - lastSave > 1000 && audio.currentTime > 0) { lastSave = Date.now(); state.audioPos[posKey] = audio.currentTime; save(); }
    });
    audio.addEventListener('play', () => { Bgm.hold(true); paint(); });
    audio.addEventListener('pause', () => { Bgm.hold(false); paint(); });
    audio.addEventListener('ended', () => { state.audioPos[posKey] = 0; save(); paint(); });
    btn.onclick = () => {
      if (audio.paused) audio.play().catch(() => toast('음악을 재생하지 못했습니다'));
      else audio.pause();
      btn.blur();
    };
    $('.seek', box).onclick = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    };
    /* 재생 중에는 음표가 떠오른다 */
    every(s, 560, () => {
      if (currentAudio !== audio || audio.paused) return;
      const f = pick(Object.values(heroes));
      const n = el('div', 'note-float temp', pick(['♪', '♫']));
      n.style.left = `${f.x + (Math.random() - .5) * 60}px`;
      n.style.top = `${f.y - 170}px`;
      n.style.setProperty('--dx', `${(Math.random() - .5) * 100}px`);
      actors.appendChild(n);
      setTimeout(() => n.remove(), 2400);
    });
    return box;
  }

  /* ---------- HUD ---------- */
  function hud(world) {
    if (world != null) $('#hudWorld').textContent = world;
    $('#hudClear').textContent = `×${pad2(usedCount())}`;
    $('#hudTotal').textContent = `/${pad2(readyIds.length)}`;
  }
  function barMsg(html) { $('#hudMsg').innerHTML = html; }
  /* 아래 막대 TIME: 파이프 판에서는 게임 시작부터의 총 진행 시간, 문제·정답 화면에서는 이 문제에 들어온 뒤 걸린 시간 */
  const clockText = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60;
    return h ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
  };
  function tickTime() {
    const now = Date.now();
    let txt = '--:--';
    if (state.screen === 'board' && state.startedAt) txt = clockText(now - state.startedAt);
    else if (state.screen === 'question' && state.qStartedAt) txt = clockText(now - state.qStartedAt);
    else if (state.screen === 'answer' && state.qStartedAt) txt = clockText((state.qEndedAt || now) - state.qStartedAt);
    const el2 = $('#hudTime');
    if (el2.textContent !== txt) el2.textContent = txt;
  }
  setInterval(tickTime, 250);
  function hudTime(text, cls = '') {
    const t = $('#hudTime');
    t.textContent = text;
    t.className = cls;
  }
  function hudBump() {
    const c = $('.bar-panel');
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }

  /* ---------- 캐릭터 ---------- */
  const SIDE_S = .3, MAP_S = .2; /* 스테이지에서는 6px, 지도에서는 4px 점 */
  let urgentNow = false;
  /* 서 있는 캐릭터 표정: 긴박 > 음악 > 기본 */
  function heroMood() {
    const playing = currentAudio && !currentAudio.paused;
    Object.values(heroes).forEach((f) => {
      if (!f.parked) return;
      f.pose(urgentNow && f === heroes.gureum ? 'nervous' : playing ? 'groove' : 'idle');
    });
  }
  function park(...list) { list.forEach((f) => { f.parked = true; f.pose('idle'); }); heroMood(); }
  const unpark = (...list) => list.forEach((f) => { f.parked = false; });

  /* ---------- 몸놀림: 착지하면 찌그러지고 먼지, 달리면 발밑 먼지 ---------- */
  function landFx(f) {
    if (f.s < .29) return;
    Fx.dust(f.x, f.y);
    f.el.classList.remove('land'); void f.el.offsetWidth; f.el.classList.add('land');
  }
  (() => {
    const P0 = Fox.prototype;
    const _hop = P0.hop, _arc = P0.arc, _go = P0.go;
    P0.hop = function (...a) { return _hop.apply(this, a).then((ok) => { if (ok) landFx(this); return ok; }); };
    P0.arc = function (...a) { return _arc.apply(this, a).then((ok) => { if (ok) landFx(this); return ok; }); };
    P0.go = function (x, opts = {}) {
      const f = this, id0 = f.moveId + 1;
      /* 방향을 확 바꾸면 미끄러지듯 먼지 */
      if (f.s >= .29 && Math.abs(x - f.x) > 40 && Math.sign(x - f.x) === f.dir) Fx.dust(f.x, f.y);
      const t = setInterval(() => {
        if (f.moveId !== id0) return clearInterval(t);
        if (f.poseName === 'run' && f.s >= .29) Fx.dust(f.x + f.dir * 24, f.y, true);
      }, 110);
      return _go.call(this, x, opts).then((ok) => { clearInterval(t); return ok; });
    };
  })();

  /* ---------- 점수 ---------- */
  if (typeof state.score !== 'number') state.score = 0;
  let shownScore = state.score;
  function paintScore() { $('#hudScore').textContent = String(Math.round(shownScore)).padStart(7, '0'); }
  function addScore(n, at) {
    state.score += n;
    save();
    if (at) popScore(at.x, at.y, n);
    const from = shownScore, to = state.score;
    tween(Math.min(900, 200 + n), (p) => { shownScore = from + (to - from) * p; paintScore(); });
  }
  function popScore(x, y, n) {
    const p = el('div', 'pop-score temp', String(n));
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    actors.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
  function shakeStage(ms = 400) {
    stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
    setTimeout(() => stage.classList.remove('shake'), ms);
  }

  /* ---------- 꼬마 펭귄: 땅 위를 뒤뚱뒤뚱 걷다가 밟히면 납작 ---------- */
  class Penguin {
    constructor(x, dir, speed) {
      this.x = x; this.dir = dir; this.speed = speed; this.dead = false; this.extra = 0;
      this.el = el('div', 'penguin temp');
      this.el.style.backgroundImage = `url(${SP.penguin()})`;
      actors.appendChild(this.el);
      this.last = performance.now();
      const step = (now) => {
        if (!this.el.isConnected) return;
        const dt = Math.min(.05, (now - this.last) / 1000);
        this.last = now;
        if (!this.dead) this.x += this.dir * (this.speed + this.extra) * dt;
        this.el.style.transform = `translate(${Math.round(this.x - 48)}px, ${FLOOR - 96}px) scaleX(${-this.dir})`;
        if (this.x < -200 || this.x > 2120) { this.el.remove(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    stomp() {
      if (this.dead) return;
      this.dead = true;
      this.el.classList.add('flat');
      Fx.sparks(this.x, FLOOR - 44, 8, '#ffffff');
      setTimeout(() => this.el.remove(), 700);
    }
  }
  /* ---------- 하늘에 떠 있는 동전 줄: 땅과 같이 흘러가고, 뛰어오른 캐릭터가 지나가면 먹힌다 ---------- */
  let coinStrip = null;
  const coinStripUrl = () => {
    if (coinStrip) return coinStrip;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 12;
    SP.coin().forEach((fr, i) => c.getContext('2d').drawImage(fr, i * 8, 0));
    return (coinStrip = c.toDataURL());
  };
  function coinRow(s, n, y, speed, hero) {
    const row = el('div', 'coinrow temp');
    const coins = [];
    for (let i = 0; i < n; i++) {
      const c = el('i');
      c.style.cssText = `left:${i * 72}px;background-image:url(${coinStripUrl()})`;
      row.appendChild(c);
      coins.push({ el: c, dx: i * 72 + 24, got: false });
    }
    actors.appendChild(row);
    let x = 1960, last = performance.now(), jumped = false;
    const step = (now) => {
      if (!alive(s) || !row.isConnected) return;
      x -= speed * Math.min(.05, (now - last) / 1000);
      last = now;
      row.style.transform = `translate(${Math.round(x)}px, ${y}px)`;
      /* 줄 앞머리가 다가오면 폴짝 */
      if (!jumped && x + coins[0].dx - hero.x < speed * .24) {
        jumped = true;
        unpark(hero);
        Sound.play('jump');
        hero.hop(140, 640, hero.poseName === 'run' ? 'run' : 'idle');
      }
      coins.forEach((c) => {
        if (c.got) return;
        const cx = x + c.dx;
        if (Math.abs(cx - hero.x) < 56 && hero.y < FLOOR - 70) {
          c.got = true;
          c.el.classList.add('got');
          Sound.play('coin');
          Fx.sparks(cx, y + 36, 6, '#ffd23f');
        }
      });
      if (x < -n * 72 - 100) { row.remove(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* 캐릭터가 제자리에서 뛰어 다가오는 펭귄을 밟는다. 펭귄의 다가오는 속도(px/s)를 알아야 착지 시점을 맞춘다 */
  function stompWhenNear(s, f, pg, closing, onStomp) {
    const HOP = 520;
    const tick = setInterval(() => {
      if (!alive(s) || pg.dead || !pg.el.isConnected) return clearInterval(tick);
      const d = (pg.x - f.x) * -pg.dir;
      if (d > 0 && d <= closing * HOP / 1000 + 6) {
        clearInterval(tick);
        unpark(f);
        Sound.play('jump');
        f.hop(130, HOP, f.poseName === 'run' ? 'run' : 'idle').then((ok) => {
          if (!ok || !alive(s)) return;
          if (Math.abs(pg.x - f.x) < 80) {
            pg.stomp();
            Sound.play('stomp');
            f.hop(60, 300, f.poseName === 'run' ? 'run' : 'idle').then(() => onStomp && onStomp());
          }
        });
      }
    }, 16);
    s.timers.push(tick);
  }

  /* =========================================================
     표지
     ========================================================= */
  function showTitle() {
    const s = newScene();
    state.screen = 'title';
    save();
    Bgm.scene('title');
    World.side('day', { vel: 26 });
    hud('---'); tickTime();
    barMsg(`<span class="blink">PRESS ${key('Enter')}</span><br>© ${esc(SET.year || '')} ${esc(SET.credit || '')}`);
    document.body.dataset.screen = 'title';
    screens.innerHTML = '';
    const top = SET.titleTop || SET.title, main = SET.titleMain || '';
    const scr = el('div', 'screen title-screen', `
      <div class="logo">
        <div class="logo-eyebrow">${esc(SET.eyebrow || '')}</div>
        <div class="logo-top">${esc(top)}</div>
        <div class="logo-main">${[...main].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join('')}</div>
        <div class="logo-sub"><span class="year">${esc(SET.year || '')}</span>${esc(SET.subtitle || '')}</div>
      </div>
      <button class="press"><i class="ptr">▶</i>게임 시작 ${key('Enter')}</button>`);
    screens.appendChild(scr);
    const { gureum, noeul } = heroes;
    gureum.place(820, FLOOR, SIDE_S); noeul.place(1060, FLOOR, SIDE_S);
    gureum.facing(-1); noeul.facing(-1);
    unpark(gureum, noeul);
    gureum.pose('run'); noeul.pose('run');
    /* 달리는 발밑 먼지 */
    every(s, 120, () => [gureum, noeul].forEach((f) => { if (f.poseName === 'run') Fx.dust(f.x + 24, f.y, true); }));
    /* 오른쪽에서 펭귄이 걸어오면 밟고, 가끔은 그냥 폴짝 뛰어 동전 */
    const GROUND = 26 * U; /* 땅이 흘러가는 속도 px/s */
    (async () => {
      await later(s, 1500);
      for (;;) {
        const roll = Math.random();
        if (roll < .4) {
          coinRow(s, 4 + Math.floor(Math.random() * 3), FLOOR - 270, GROUND, noeul);
          await later(s, 3400 + Math.random() * 1200);
        } else if (roll < .8) {
          const pg = new Penguin(2000, -1, 60);
          pg.extra = GROUND;
          const f = noeul; /* 앞에서 달리는 노을이가 밟는다 */
          stompWhenNear(s, f, pg, 60 + GROUND, () => popScore(f.x, f.y - 200, 100));
          await later(s, 3600 + Math.random() * 1600);
        } else {
          const f = pick([gureum, noeul]);
          Sound.play('jump');
          f.hop(110, 520, 'run');
          setTimeout(() => { if (alive(s)) Fx.coin(f.x, f.y - 260); }, 250);
          await later(s, 2200 + Math.random() * 1200);
        }
      }
    })();
    $('.press', scr).onclick = () => startGame();
  }
  function startGame() {
    if (busy) return;
    busy = true;
    state.startedAt = Date.now(); /* 총 진행 시간은 게임 시작을 누른 순간부터 */
    save();
    Sound.play('start');
    const b = $('.title-screen .press');
    if (b) b.classList.add('go');
    setTimeout(() => {
      checker(() => { showBoard({ drop: true }); }, 250).then(() => { busy = false; });
    }, 500);
  }

  /* =========================================================
     파이프 판 (문제 고르기) — 48개를 한 화면에
     분야 하나 = 탑 하나. 탑 네 개가 나란히 서 있고, 탑마다 아래층(하) · 가운데층(중) · 꼭대기층(상)에
     문제 번호 파이프가 4개씩. 구름이가 파이프 위를 폴짝폴짝 옮겨 다니다가 고른 파이프로 쑥 내려간다.
     ========================================================= */
  const PIPE_W = 80, PIPE_H = 64, PIPE_GAP = 96;   /* 판 위의 파이프 (점 하나 4px) */
  const BIG_W = 120, BIG_H = 96;                   /* 스테이지 파이프 (점 하나 6px) */
  const FLOOR_GAP = 200;
  const BOARD_LIFT = 104; /* 맨 아래층 벽돌 판도 땅에서 띄워 공중에 둔다 */
  const catHex = (c) => c.color || '#2f7ae8';
  function towerX(ci) {
    const n = CATS.length, span = Math.min(470, 1800 / n);
    return 960 + (ci - (n - 1) / 2) * span;
  }
  function tierLayout(ci) {
    const tierW = (SLOTS - 1) * PIPE_GAP + PIPE_W;
    const left = towerX(ci) - tierW / 2;
    return LEVELS.map((lv, r) => {
      const surface = FLOOR - BOARD_LIFT - r * FLOOR_GAP;
      return { lv, r, left, w: tierW, surface, top: surface - PIPE_H, cols: Array.from({ length: SLOTS }, (_, k) => left + PIPE_W / 2 + k * PIPE_GAP) };
    });
  }
  /* ←→ 순서: 같은 층을 왼쪽 탑부터 오른쪽 탑까지 */
  const pipeOrder = [];
  LEVELS.forEach((l) => CATS.forEach((c) => { for (let k = 1; k <= SLOTS; k++) pipeOrder.push(idOf(c.name, l.name, k)); }));
  const pipeAt = (id) => {
    const p = parseId(id), t = tierLayout(catIndex(p.cat))[levelIndex(p.level)];
    return { x: t.cols[p.no - 1], top: t.top, tier: t };
  };

  let mapCursor = null, walking = false, noeulAt = null;
  let pipeEls = {};

  function renderBoard() {
    /* 파이프 판 배경은 단순하게: 나무·상자 없이, 언덕은 옅게 (CSS 에서 채도를 낮춘다) */
    World.side('day', { props: false, trees: false });
    screens.innerHTML = '';
    const scr = el('div', 'screen board-screen pipe-room');
    pipeEls = {};
    /* 탑마다 뒤에 그 월드의 풍경 판. 층마다 시간대가 바뀐다: 아래(하) 낮 → 중 노을 → 위(상) 밤 */
    CATS.forEach((c, ci) => {
      const tiers = tierLayout(ci);
      const cw = Math.round((tiers[0].w + 56) / U), x0 = towerX(ci) - cw * U / 2;
      const top = Math.floor((tiers[tiers.length - 1].top - 234) / U) * U;
      const H = Math.round((FLOOR - top) / U);
      /* 층 경계: 각 층 발판 40px 위. 경계에서 위아래 FADE px 동안 다음 시간대로 서서히 물든다 */
      const cut = tiers.map((t, i) => (i === 0 ? FLOOR : Math.floor((tiers[i - 1].top - 40) / U) * U));
      const FADE = 70;
      const b = el('div', 'tower-bg world');
      b.style.cssText = `left:${x0}px;top:${top}px;width:${cw * U}px;height:${H * U}px`;
      /* 시간대마다 판 전체 그림을 한 장씩 겹친다. 위 시간대일수록 위쪽만 보이게 그러데이션 가림막 */
      tiers.forEach((t, i) => {
        const url = World.snapshot(stageOf(c.name), { tint: catHex(c), tod: todOfLevel(i), cam: 40 + ci * 137, x: 0, y: Math.max(0, World.GY - H), w: cw, h: H });
        const layer = el('div', `tod tod-${todOfLevel(i)}`);
        layer.style.backgroundImage = `url(${url})`;
        if (i > 0) {
          const d = FLOOR - cut[i]; /* 판 아래에서 경계까지 */
          const m = `linear-gradient(to top, transparent ${d - FADE}px, #000 ${d + FADE}px)`;
          layer.style.maskImage = m; layer.style.webkitMaskImage = m;
        }
        b.appendChild(layer);
      });
      scr.appendChild(b);
    });
    CATS.forEach((c, ci) => {
      const tiers = tierLayout(ci);
      const ids = readyIds.filter((id) => parseId(id).cat === c.name);
      const done = ids.filter((id) => state.used[id]).length;
      /* 탑 꼭대기 간판 */
      const sign = el('div', 'tower-sign', `<img src="${SP.icon(c.icon || 'book', '#ffffff')}" alt=""><span>${esc(c.name)}</span><small>${done}/${ids.length}</small>`);
      sign.style.cssText = `left:${towerX(ci)}px;top:${tiers[tiers.length - 1].top - 210}px;--c:${catHex(c)}`;
      sign.dataset.cat = c.name;
      scr.appendChild(sign);
      tiers.forEach((t) => {
        if (t.r > 0) {
          /* 층 발판 벽돌 색 = 난이도 색 (settings.js levels 의 color) */
          const pf = el('div', 'platform', `<b>${esc(t.lv.name)} <em>${starsOf(t.lv.name)}</em></b>`);
          pf.style.cssText = `left:${t.left - 12}px;top:${t.surface}px;width:${t.w + 24}px;background-image:url(${SP.brick(t.lv.color)})`;
          scr.appendChild(pf);
        } else {
          /* 맨 아래층도 같은 색 벽돌 판 (공중에 떠 있다) */
          const slab = el('div', 'platform ground-slab', `<b>${esc(t.lv.name)} <em>${starsOf(t.lv.name)}</em></b>`);
          slab.style.cssText = `left:${t.left - 12}px;top:${t.surface}px;width:${t.w + 24}px;background-image:url(${SP.brick(t.lv.color)})`;
          scr.appendChild(slab);
        }
        t.cols.forEach((x, k) => {
          const id = idOf(c.name, t.lv.name, k + 1);
          const ready = readyIds.includes(id), used = !!state.used[id];
          const b = el('button', `pipe small${ready ? '' : ' empty'}${used ? ' used' : ''}`, `<span>${k + 1}</span>`);
          b.style.cssText = `left:${x - PIPE_W / 2}px;top:${t.top}px;--img:url(${SP.pipe(catHex(c), used ? 'used' : ready ? 'ready' : 'empty')})`;
          b.title = label(id);
          /* 처음 누르면 그 파이프로 폴짝 이동만, 이미 서 있는 파이프를 한 번 더 누르면 쑥 들어간다 */
          b.onclick = () => { if (!ready || busy || walking) return; if (id === mapCursor) onPick(id); else goTo(id); };
          b.onmouseenter = () => { if (ready && !busy && !walking) { hud(label(id)); } };
          b.onmouseleave = () => { if (mapCursor) hud(label(mapCursor)); };
          pipeEls[id] = b;
          scr.appendChild(b);
        });
      });
    });
    screens.appendChild(scr);
    return scr;
  }
  function paintCursor() {
    Object.entries(pipeEls).forEach(([id, b]) => b.classList.toggle('cursor', id === mapCursor));
  }
  /* 노을이가 설 자리: 같은 탑 같은 층에서 구름이 바로 옆 칸 */
  function neighborOf(id) {
    const p = parseId(id);
    const row = [1, 2, 3, 4].slice(0, SLOTS).map((k) => idOf(p.cat, p.level, k)).filter((x) => readyIds.includes(x) && x !== id);
    return row.sort((a, b) => Math.abs(parseId(a).no - p.no) - Math.abs(parseId(b).no - p.no))[0] || null;
  }
  const PARK_N = (id) => (id ? pipeAt(id) : { x: 60, top: FLOOR });

  function showBoard({ drop = false, cleared = null, instant = false } = {}) {
    const s = newScene();
    state.screen = 'board';
    state.current = null;
    state.timer = null;
    save();
    stopAudio();
    Bgm.scene('map');
    urgentNow = false;
    walking = false;
    hud('PIPE'); tickTime();
    barMsg('');
    if (!state.startedAt) { state.startedAt = Date.now(); save(); }
    renderBoard();
    const fallback = readyIds.find((id) => !state.used[id]) || readyIds[0];
    const start = [cleared, state.cursor, fallback].find((id) => id && readyIds.includes(id));
    if (!start) return;
    mapCursor = start; state.cursor = start;
    hud(label(start));
    paintCursor();
    const { gureum, noeul } = heroes;
    unpark(gureum, noeul);
    gureum.scale(MAP_S); noeul.scale(MAP_S);
    noeulAt = neighborOf(start);
    const np = PARK_N(noeulAt), gp = pipeAt(start);
    gureum.facing(-1); noeul.facing(-1);
    if (cleared && !instant) {
      noeul.place(-300, FLOOR);
      /* 들어갔던 파이프에서 쑥 올라와 깃발 */
      pipeRise(s, gureum, start).then(async (ok) => {
        if (!ok) return;
        park(gureum);
        plantFlag(s, start);
        await later(s, 350);
        if (!(await pipeRise(s, noeul, start))) return;
        Sound.play('jump');
        await noeul.arc(np.x, np.top, 70, 420, 'idle');
        if (alive(s)) park(noeul);
      });
    } else if (drop && !instant) {
      gureum.place(gp.x, -160); noeul.place(np.x, -160);
      (async () => {
        await later(s, 500);
        gureum.arc(gp.x, gp.top, 0, 620, 'idle').then((ok) => ok && park(gureum));
        await later(s, 180);
        await noeul.arc(np.x, np.top, 0, 620, 'idle');
        if (!alive(s)) return;
        park(noeul);
        noeul.say('어느 파이프로 갈까?', 1800);
      })();
    } else {
      gureum.place(gp.x, gp.top); noeul.place(np.x, np.top);
      park(gureum, noeul);
    }
    if (!cleared && readyIds.length && usedCount() >= readyIds.length && !instant) finale(s);
  }

  /* 파이프 입구(top) 아래로 내려간 부분은 통째로 잘라 낸다. 꼬리·발이 파이프 옆이나 아래로 삐져나오지 않는다 */
  function clipAt(f, top) {
    if (top == null) { f.el.style.clipPath = ''; return; }
    const h = top - f.y;
    f.el.style.clipPath = `polygon(-600px -2000px, 600px -2000px, 600px ${h}px, -600px ${h}px)`;
  }
  function slidePipe(f, from, to, ms, top) {
    const id = ++f.moveId;
    const step = f.s >= .29 ? 6 : 4;
    f.pose('idle');
    f.mood('smile');
    return tween(ms, (p) => {
      f.y = from + Math.round((to - from) * p / step) * step;
      f.sync();
      clipAt(f, top);
    }, () => id === f.moveId);
  }
  const depthOf = (f) => (f.s >= .29 ? 150 : 100);
  async function pipeRise(s, f, id, front, x, top) {
    const p = id ? pipeAt(id) : { x, top };
    const d = depthOf(f);
    f.place(p.x, p.top + d);
    clipAt(f, p.top);
    Sound.play('pipe');
    const ok = await slidePipe(f, p.top + d, p.top, f.s >= .29 ? 650 : 850, p.top);
    clipAt(f, null);
    return ok && alive(s);
  }
  async function pipeSink(s, f, x, top) {
    f.facing(-1);
    Sound.play('pipe');
    const ok = await slidePipe(f, top, top + depthOf(f), 950, top);
    f.place(f.x, 2400);
    clipAt(f, null);
    return ok && alive(s);
  }

  function setCursor(id) {
    mapCursor = id;
    state.cursor = id;
    hud(label(id));
    paintCursor();
    save();
  }
  /* 다른 파이프로 폴짝. 노을이는 그 파이프 바로 옆 칸으로 따라온다 */
  async function goTo(id) {
    if (walking) return false;
    const s = scene;
    walking = true;
    setCursor(id);
    Sound.play('move');
    const { gureum, noeul } = heroes;
    unpark(gureum, noeul);
    const p = pipeAt(id);
    const rise = Math.max(0, gureum.y - p.top);
    const far = Math.abs(gureum.x - p.x) > 300;
    Sound.play('jump');
    gureum.facing(p.x > gureum.x ? -1 : 1);
    const g = gureum.arc(p.x, p.top, 60 + rise + (far ? 80 : 0), 380 + Math.min(300, rise) + (far ? 160 : 0), 'idle');
    await later(s, 140);
    const nTarget = neighborOf(id);
    let n = Promise.resolve(true);
    if (nTarget) {
      const q = pipeAt(nTarget);
      noeulAt = nTarget;
      noeul.facing(q.x > noeul.x ? -1 : 1);
      const nr = Math.max(0, noeul.y - q.top);
      n = noeul.arc(q.x, q.top, 60 + nr + (far ? 80 : 0), 380 + Math.min(300, nr) + (far ? 160 : 0), 'idle');
    }
    const [a] = await Promise.all([g, n]);
    if (!alive(s)) return false;
    walking = false;
    gureum.facing(-1); noeul.facing(-1);
    park(gureum, noeul);
    return a;
  }
  /* 방향키: ←→ 는 같은 층을 따라 옆 파이프(탑 끝에서는 옆 탑으로), ↑↓ 는 같은 탑의 위·아래 층 */
  function moveCursor(dx, dy) {
    if (!mapCursor || walking || busy) return;
    const ready = pipeOrder.filter((id) => readyIds.includes(id));
    let next = null;
    const p = parseId(mapCursor);
    if (dx) {
      const row = ready.filter((id) => parseId(id).level === p.level);
      next = row[row.indexOf(mapCursor) + dx] || null;
    }
    if (dy) {
      const r = levelIndex(p.level) - dy;
      if (LEVELS[r]) {
        const same = ready.filter((id) => { const q = parseId(id); return q.cat === p.cat && levelIndex(q.level) === r; });
        next = same.sort((a, b) => Math.abs(parseId(a).no - p.no) - Math.abs(parseId(b).no - p.no))[0] || null;
      }
    }
    if (next) goTo(next);
    else Sound.play('deny');
  }

  function plantFlag(s, id) {
    const b = pipeEls[id];
    const p = pipeAt(id);
    if (b) {
      b.classList.add('used', 'planting');
      b.style.setProperty('--img', `url(${SP.pipe(catHex(catOf(parseId(id).cat)), 'used')})`);
    }
    Sound.play('flag');
    Fx.coin(p.x, p.top - 110);
    addScore(1000, { x: p.x, y: p.top - 190 });
    Fx.sparks(p.x, p.top - 40, 16);
    hudBump();
    const cat = parseId(id).cat;
    const sign = [...document.querySelectorAll('.tower-sign')].find((n) => n.dataset.cat === cat);
    if (sign) {
      const ids = readyIds.filter((x) => parseId(x).cat === cat);
      $('small', sign).textContent = `${ids.filter((x) => state.used[x]).length}/${ids.length}`;
    }
    if (readyIds.length && usedCount() >= readyIds.length) setTimeout(() => alive(s) && finale(s), 1200);
    else setTimeout(() => alive(s) && heroes.noeul.say(pick(['클리어!', '다음 파이프는?', '깃발 꽂았다!']), 1600), 1600);
  }
  function finale(s) {
    Sound.play('allClear');
    shout('ALL CLEAR!', 'gold center', 4200);
    const msg = el('div', 'finale temp pwin', `모든 문제를 풀었어요!<br><small>${esc(SET.eyebrow || '')}</small>`);
    actors.appendChild(msg);
    setTimeout(() => msg.classList.add('out'), 6000);
    Fx.confetti(140);
    for (let i = 0; i < 10; i++) s.timers.push(setTimeout(() => Fx.firework(200 + Math.random() * 1520, 160 + Math.random() * 300), i * 450));
    const { gureum, noeul } = heroes;
    unpark(gureum, noeul);
    gureum.pose('cheer'); noeul.pose('cheer');
    s.timers.push(setTimeout(() => park(gureum, noeul), 4000));
  }

  async function onPick(id) {
    if (busy || walking) return;
    if (state.used[id]) {
      const again = await dialog('이미 푼 문제예요', '다시 들어가면 타이머도 처음부터 시작해요.', [
        { label: '다시 들어가기', value: 'open' }, { label: '그만두기', value: null }
      ]);
      if (again !== 'open') return;
    }
    busy = true;
    const s = scene;
    Sound.play('select');
    if (mapCursor !== id) { const ok = await goTo(id); if (!ok) { busy = false; return; } }
    const { gureum, noeul } = heroes;
    const p = pipeAt(id), hex = catHex(catOf(parseId(id).cat));
    unpark(gureum, noeul);
    /* 구름이 먼저 쑥 → 노을이가 같은 파이프로 폴짝 올라와 따라 쑥 */
    const sunk = pipeSink(s, gureum, p.x, p.top, hex);
    await later(s, 450);
    Sound.play('jump');
    noeul.facing(noeul.x < p.x ? -1 : 1);
    await noeul.arc(p.x, p.top, 90 + Math.max(0, noeul.y - p.top), 480, 'idle');
    await sunk;
    if (!alive(s)) { busy = false; return; }
    await pipeSink(s, noeul, p.x, p.top, hex);
    if (!alive(s)) { busy = false; return; }
    state.used[id] = Date.now();
    state.current = id;
    state.screen = 'question';
    state.qStartedAt = Date.now(); state.qEndedAt = 0; /* 이 문제에 걸린 시간 */
    state.timer = { status: 'idle', duration: 0, endsAt: 0, remaining: 0 };
    state.audioPos[`${id}:q`] = 0;
    state.audioPos[`${id}:a`] = 0;
    save();
    Bgm.scene(null);
    Sound.play('enter');
    /* 밤(상) 스테이지는 보스 얼굴 모양으로 닫혔다가 열린다. 나머지는 옛날 게임처럼 바로 깜깜해진다 */
    const boss = todOf(id) === 'night';
    if (boss) await bossClose({ x: p.x, y: p.top - 60 });
    showCard(id);
    await new Promise((r) => setTimeout(r, boss ? 2400 : 2700));
    showQuestion(false);
    hideCard();
    if (boss) await bossOpen({ x: 960, y: 520 });
    busy = false;
  }

  /* =========================================================
     스테이지 (문제)
     ========================================================= */
  const Q_PANEL = { x: 60, y: 48, w: 1800, h: 492 };
  const HOME = { gureum: 330, noeul: 1590 };
  const EXIT_X = 110; /* 스테이지 왼쪽, 캐릭터가 올라오는 파이프 */
  let clockEl = null;
  let instantPanel = false;

  function panelHTML(id, kind) {
    const p = parseId(id), c = catOf(p.cat);
    const head = kind === 'answer'
      ? `<div class="tab tab-answer"><img src="${SP.icon('bulb', '#ffffff')}" alt="">정답!</div><div class="tab-meta">${esc(p.cat)} ${esc(p.level)}-${p.no}</div>`
      : `<div class="tab" style="--c:${c.color || '#2f7ae8'}"><img src="${SP.icon(c.icon || 'book', '#ffffff')}" alt="">${esc(p.cat)}<span class="tab-lv">${esc(p.level)}-${p.no}</span></div><div class="tab-meta">${starsOf(p.level)}</div>`;
    return `<div class="qpanel pwin ${kind}${instantPanel ? '' : ' opening'}" style="left:${Q_PANEL.x}px;top:${Q_PANEL.y}px;width:${Q_PANEL.w}px;height:${Q_PANEL.h}px">${head}<div class="q-body"></div></div>`;
  }
  function fillBody(body, text, img, audio, posKey, s, hasMediaSize) {
    let textNode = null;
    if (text) {
      textNode = el('div', `q-text${img ? ' has-media' : ''}`);
      textNode.textContent = text;
      body.appendChild(textNode);
    }
    if (img) body.appendChild(mediaImage(img));
    if (audio) body.appendChild(buildPlayer(audio, posKey, s));
    if (textNode) {
      const refit = () => { fitText(textNode, img ? 66 : hasMediaSize, 33); layoutMedia(body); };
      refit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive(s)) refit(); });
    }
  }

  function showQuestion(instant) {
    const s = newScene();
    const id = state.current;
    const q = QS[id];
    const p = parseId(id);
    state.screen = 'question';
    stageBgm(id, true);
    if (!instant || !state.qStartedAt) { state.qStartedAt = Date.now(); state.qEndedAt = 0; } /* 문제 화면이 뜬 순간부터 */
    save();
    stopAudio();
    urgentNow = false;
    sideStage(id);
    if (!instant) World.pan(160, 1400);
    hud(label(id));
    barMsg('');
    screens.innerHTML = '';
    const scr = el('div', 'screen q-screen');
    instantPanel = instant;
    scr.innerHTML = panelHTML(id, 'question');
    fillBody($('.q-body', scr), q.q, q.q_img, q.q_audio, `${id}:q`, s, q.q_audio ? 77 : 88);

    /* 타이머 블록 */
    const tb = el('div', 'tblocks');
    tb.innerHTML = `<div class="tcap">TIMER</div>` +
      PRESETS.map((n, i) => `<button class="blk tblock" data-sec="${n}" style="--img:url(${SP.timeBlock()})"><span>${n}</span></button>`).join('') +
      `<button class="blk tstop" id="timerStop" style="--img:url(${SP.stopBlock()})" title="멈춤 / 다시 시작 (Space)"><span>II</span></button>`;
    tb.querySelectorAll('[data-sec]').forEach((b) => { b.onclick = () => { b.blur(); if (!busy) startTimer(s, Number(b.dataset.sec), b); }; });
    $('#timerStop', tb).onclick = (e) => { e.currentTarget.blur(); pauseToggle(e.currentTarget); };
    scr.appendChild(tb);

    /* 벽돌 줄 가운데 정답 선물 블록. 벽돌을 누르면 구름이가 쳐서 동전이 한 번 나온다 */
    [[720, 832], [816, 880], [1008, 992], [1104, 1040]].forEach(([x, fx]) => {
      const b = el('button', 'blk brick', '');
      b.style.cssText = `--x:${x}px;--fx:${fx}px;--img:url(${SP.brick()})`;
      b.onclick = () => { b.blur(); if (!busy) hitBrick(s, b); };
      scr.appendChild(b);
    });
    const gift = el('button', 'blk gift', '');
    gift.style.setProperty('--img', `url(${SP.giftStrip()})`);
    gift.title = '정답 보기 (Enter)';
    gift.onclick = () => onReveal(id);
    scr.appendChild(gift);

    const exitPipe = el('div', 'pipe deco-pipe');
    exitPipe.style.cssText = `left:${EXIT_X - BIG_W / 2}px;top:${FLOOR - BIG_H}px;--img:url(${SP.pipe(catHex(catOf(p.cat)), 'ready')})`;
    scr.appendChild(exitPipe);
    /* 땅 위 버튼 */
    const back = el('button', 'gbtn left', `◀ 지도로 ${key('Esc')}`);
    back.onclick = () => onBackFromQuestion(id);
    const ans = el('button', 'gbtn right', `정답 보기 ▶ ${key('Enter')}`);
    ans.id = 'answerBtn';
    ans.onclick = () => onReveal(id);
    scr.append(back, ans);
    screens.appendChild(scr);

    const { gureum, noeul } = heroes;
    gureum.scale(SIDE_S); noeul.scale(SIDE_S);
    Clock.attach(s, tb);
    if (instant) {
      gureum.place(HOME.gureum, FLOOR); noeul.place(HOME.noeul, FLOOR);
      gureum.facing(-1); noeul.facing(1);
      park(gureum, noeul);
      focusMode(s, scr, true);
    } else {
      /* 왼쪽 끝에서 달려 들어온다 */
      /* 왼쪽 파이프에서 하나씩 쑥 올라와 폴짝 뛰어내린다 */
      const hex = catHex(catOf(p.cat)), top = FLOOR - BIG_H;
      const cover = null;
      gureum.place(EXIT_X, 2400); noeul.place(EXIT_X, 2400);
      /* 화면 전환이 끝나면 문제에만 집중 */
      s.timers.push(setTimeout(() => alive(s) && focusMode(s, scr), 2300));
      (async () => {
        await later(s, 250);
        if (!(await pipeRise(s, gureum, null, cover, EXIT_X, top))) return;
        Sound.play('jump');
        gureum.facing(-1);
        gureum.arc(HOME.gureum, FLOOR, 90, 460, 'idle').then((ok) => {
          if (ok && alive(s)) { park(gureum); gureum.say(pick(['문제 나왔다!', '다들 준비됐죠?', '잘 읽어 봐요!']), 1800); }
        });
        await later(s, 120);
        if (!(await pipeRise(s, noeul, null, cover, EXIT_X, top))) return;
        Sound.play('jump');
        noeul.facing(-1);
        await noeul.arc(EXIT_X + 160, FLOOR, 90, 460, 'run');
        if (!alive(s)) return;
        await noeul.run(HOME.noeul, { speed: 1500 });
        if (!alive(s)) return;
        noeul.facing(1);
        park(noeul);
      })();
    }
    paintTimerButtons();
  }

  /* ---------- 타이머 ---------- */
  /* 집중 모드: 배경을 어둡게 가라앉히고 캐릭터·블록·버튼을 작게 줄여 문제 창만 또렷하게.
     시계는 크기 그대로 두고, 작아진 노을이 머리 위에 맞춰 높이만 옮긴다 */
  const FOCUS_S = .2;
  function clockTop(f) { return -(400 * f.s + 12 + 180); }
  function focusMode(s, scr, instant) {
    if (!alive(s) || scr.classList.contains('focus')) return;
    $('#dim').classList.add('on');
    if (instant) $('#dim').classList.add('instant');
    scr.classList.add('focus');
    if (instant) scr.classList.add('instant');
    const panel = $('.qpanel', scr);
    if (panel && !instant) { panel.classList.remove('opening'); void panel.offsetWidth; panel.classList.add('spot'); }
    Object.values(heroes).forEach((f) => {
      if (!instant) { f.el.classList.add('resizing'); setTimeout(() => f.el.classList.remove('resizing'), 600); }
      f.scale(FOCUS_S);
    });
    if (clockEl) clockEl.style.top = `${clockTop(heroes.noeul)}px`;
  }

  function ensureClock() {
    if (clockEl && clockEl.isConnected) return clockEl;
    clockEl = el('div', 'clock temp', `<canvas width="30" height="30"></canvas><b class="digits"></b><small class="clock-label"></small>`);
    heroes.noeul.el.appendChild(clockEl);
    clockEl.style.top = `${clockTop(heroes.noeul)}px`;
    paintClockSprite(false);
    return clockEl;
  }
  function paintClockSprite(urgent) {
    const c = $('canvas', clockEl);
    const g = c.getContext('2d');
    g.clearRect(0, 0, 30, 30);
    g.drawImage(SP.clock(urgent), 0, 0);
  }
  const Clock = {
    s: null, lastSec: null, urgent: null,
    attach(s) {
      this.s = s; this.lastSec = null; this.urgent = null;
      clockEl = null;
      const t = state.timer;
      if (t && t.status === 'running' && t.endsAt <= Date.now()) { t.status = 'done'; t.remaining = 0; save(); }
      if (t && t.status !== 'idle') { ensureClock(); heroes.noeul.carry({ slot: 'top', sprite: 'none' }); }
      this.loop();
    },
    remaining() {
      const t = state.timer;
      if (!t) return 0;
      return t.status === 'running' ? Math.max(0, t.endsAt - Date.now()) : t.remaining;
    },
    paint() {
      const t = state.timer;
      if (!t || t.status === 'idle') return;
      const rem = this.remaining();
      const sec = Math.ceil(rem / 1000);
      const urgent = t.status === 'running' && rem <= (SET.urgentSeconds || 5) * 1000;
      if (clockEl) {
        const d = $('.digits', clockEl);
        if (d.textContent !== String(sec)) d.textContent = sec;
        $('.clock-label', clockEl).textContent = { running: '', stopped: '멈춤', done: '끝!' }[t.status] || '';
        clockEl.classList.toggle('urgent', urgent);
        clockEl.classList.toggle('stopped', t.status === 'stopped');
        clockEl.classList.toggle('ended', t.status === 'done');
        if (this.urgent !== urgent) { this.urgent = urgent; paintClockSprite(urgent); }
      }
      $('#vignette').classList.toggle('on', urgent);
      if (urgent !== urgentNow) { urgentNow = urgent; heroMood(); }
    },
    loop() {
      const s = this.s;
      const frame = () => {
        if (!alive(s)) return;
        const t = state.timer;
        /* 5·10·15초 타이머는 길이가 꼭 맞는 P Switch 곡을 남은 시간에 맞춰 튼다 */
        if (t) Sound.timer.sync(t.status, t.duration, t.status === 'running' ? t.endsAt - Date.now() : t.remaining);
        if (t && t.status === 'running') {
          const sec = Math.ceil((t.endsAt - Date.now()) / 1000);
          if (sec !== this.lastSec && sec > 0) { this.lastSec = sec; if (!Sound.timer.has(t.duration)) Sound.play('tick', { urgent: sec <= (SET.urgentSeconds || 5) }); }
          if (t.endsAt <= Date.now()) timeUp(s);
        }
        this.paint();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  };
  function paintTimerButtons() {
    const t = state.timer, st = t ? t.status : 'idle';
    document.querySelectorAll('.tblock').forEach((b) => {
      const on = st !== 'idle' && Number(b.dataset.sec) === t.duration;
      b.classList.toggle('on', on);
      b.style.setProperty('--img', `url(${on ? SP.timeBlockOn() : SP.timeBlock()})`);
    });
    /* 멈춤 블록: 도는 중이면 II(멈춤), 멈춰 있으면 ▶(이어서) */
    const stop = $('#timerStop');
    if (stop) {
      stop.disabled = st !== 'running' && st !== 'stopped';
      $('span', stop).textContent = st === 'stopped' ? '▶' : 'II';
      stop.classList.toggle('resume', st === 'stopped');
      stop.title = st === 'stopped' ? '이어서 (Space)' : '멈춤 (Space)';
    }
  }
  function bump(block) {
    if (!block) return;
    block.classList.remove('bump'); void block.offsetWidth; block.classList.add('bump');
  }
  /* 벽돌 치기: 구름이가 밑으로 달려가 머리로 친다 */
  function headbutt(s, b, then) {
    const r = rectOf(b);
    const { gureum } = heroes;
    unpark(gureum);
    return gureum.run(r.cx, { speed: 1600, after: 'idle' }).then(async (ok) => {
      if (!ok || !alive(s)) return false;
      Sound.play('jump');
      const hop = gureum.hop(84, 420);
      await later(s, 170);
      bump(b); Sound.play('bump');
      if (then) then(r);
      await hop;
      if (!alive(s)) return false;
      gureum.facing(-1);
      park(gureum);
      return true;
    });
  }
  function hitBrick(s, b) {
    headbutt(s, b, (r) => {
      if (b.classList.contains('spent')) return;
      b.classList.add('spent');
      b.style.setProperty('--img', `url(${SP.usedBlock()})`);
      Sound.play('coin');
      Fx.coin(r.cx, r.y - 20);
      setTimeout(() => addScore(200, { x: r.cx, y: r.y - 120 }), 500);
    });
  }
  let bonusSec = 0;
  /* 누른 블록의 시간으로 처음부터 시작. 구름이가 블록 밑으로 달려가 머리로 친다 */
  function startTimer(s, sec, block) {
    const t = state.timer;
    if (!t || !(sec > 0)) return;
    Object.assign(t, { status: 'running', duration: sec, endsAt: Date.now() + sec * 1000, remaining: sec * 1000 });
    Clock.lastSec = null;
    save();
    paintTimerButtons();
    Sound.timer.stop(); /* 다시 누르면 곡도 처음부터 */
    Sound.play('timerStart', { sec });
    const b = block || document.querySelector(`.tblock[data-sec="${sec}"]`);
    const { gureum, noeul } = heroes;
    /* 노을이가 시계를 번쩍 든다 */
    const fresh = !clockEl || !clockEl.isConnected;
    ensureClock();
    clockEl.classList.remove('pop'); void clockEl.offsetWidth; clockEl.classList.add('pop');
    noeul.carry({ slot: 'top', sprite: 'none' });
    unpark(noeul);
    noeul.hop(fresh ? 60 : 30, 380).then((ok) => { if (ok && alive(s)) { park(noeul); noeul.say(`${sec}초 시작!`, 1200); } });
    if (b) {
      const r = rectOf(b);
      unpark(gureum);
      gureum.run(r.cx, { speed: 1600, after: 'idle' }).then(async (ok) => {
        if (!ok || !alive(s)) return;
        Sound.play('jump');
        const hop = gureum.hop(84, 420);
        await later(s, 170);
        bump(b); Sound.play('bump'); Fx.coin(r.cx, r.y - 20);
        await hop;
        if (!alive(s)) return;
        gureum.facing(-1);
        park(gureum);
      });
    }
  }
  function stopTimer(block) {
    const t = state.timer;
    if (!t || t.status !== 'running') return;
    t.remaining = Math.max(0, t.endsAt - Date.now());
    t.status = 'stopped';
    Sound.play('pause');
    bump(block || $('#timerStop'));
    heroes.noeul.say('멈춤!', 1200);
    urgentNow = false;
    heroMood();
    save();
    paintTimerButtons();
  }
  /* 멈춘 자리에서 남은 시간 그대로 이어서 */
  function resumeTimer(block) {
    const t = state.timer;
    if (!t || t.status !== 'stopped' || !(t.remaining > 0)) return;
    t.status = 'running';
    t.endsAt = Date.now() + t.remaining;
    Clock.lastSec = null;
    Sound.play('timerStart', { sec: t.duration });
    bump(block || $('#timerStop'));
    heroes.gureum.say('다시 시작!', 1200);
    save();
    paintTimerButtons();
  }
  function pauseToggle(block) {
    const t = state.timer;
    if (!t) return;
    if (t.status === 'running') stopTimer(block);
    else if (t.status === 'stopped') resumeTimer(block);
  }
  /* Space: 도는 중이면 멈춤, 멈춰 있으면 이어서, 아직 안 돌렸거나 끝났으면 가운데 버튼 시간으로 시작 */
  function timerKey(s) {
    const t = state.timer;
    if (!t) return;
    if (t.status === 'running' || t.status === 'stopped') pauseToggle();
    else startTimer(s, t.duration || PRESETS[Math.floor(PRESETS.length / 2)]);
  }
  function timeUp(s) {
    const t = state.timer;
    t.status = 'done';
    t.remaining = 0;
    save();
    paintTimerButtons();
    Sound.play('timeUp');
    urgentNow = false;
    shout('TIME UP!', 'red', 2400);
    shakeStage(500);
    const { gureum, noeul } = heroes;
    unpark(gureum);
    gureum.pose('surprised');
    gureum.say('땡!', 1800);
    noeul.say('시간 끝!', 1800);
    if (clockEl) { clockEl.classList.add('ring'); }
    s.timers.push(setTimeout(() => { if (clockEl) clockEl.classList.remove('ring'); park(gureum); }, 2600));
  }

  async function onBackFromQuestion(id) {
    if (busy) return;
    const choice = await dialog('지도로 돌아갈까요?', '잘못 고른 문제라면 안 푼 문제로 되돌릴 수 있어요.', [
      { label: '푼 문제로 표시하고 돌아가기', value: 'used' },
      { label: '안 푼 문제로 되돌리기', value: 'free' },
      { label: '계속 보기', value: null }
    ]);
    if (!choice || state.current !== id) return;
    if (choice === 'free') delete state.used[id];
    save();
    busy = true;
    await wipe({ x: heroes.gureum.x, y: heroes.gureum.y - 80 }, () => showBoard({ cleared: choice === 'used' ? id : null }));
    busy = false;
  }

  /* =========================================================
     정답: 구름이가 선물 블록을 머리로 치면 선물이 튀어나오고 클리어 화면으로
     ========================================================= */
  async function onReveal(id) {
    if (busy || state.screen !== 'question') return;
    busy = true;
    const t = state.timer;
    if (t && t.status === 'running') { t.remaining = Math.max(0, t.endsAt - Date.now()); t.status = 'stopped'; save(); }
    stopAudio();
    const s = scene;
    urgentNow = false;
    $('#vignette').classList.remove('on');
    const gift = $('.q-screen .gift');
    const r = rectOf(gift);
    const { gureum, noeul } = heroes;
    unpark(gureum, noeul);
    noeul.look(-1);
    await gureum.run(r.cx, { speed: 1800, after: 'idle' });
    if (!alive(s)) return;
    Sound.play('jump');
    const hop = gureum.hop(84, 440);
    await later(s, 180);
    bump(gift);
    gift.style.setProperty('--img', `url(${SP.usedBlock()})`);
    gift.classList.add('spent');
    Sound.play('bump');
    Sound.play('reveal');
    Fx.item(SP.present(), r.cx, r.y - 50);
    Fx.sparks(r.cx, r.y, 24);
    noeul.pose('cheer');
    await hop;
    if (!alive(s)) return;
    gureum.pose('cheer');
    /* 남은 시간은 클리어 화면에서 점수로 바꿔 준다 */
    bonusSec = t && t.status !== 'idle' ? Math.ceil(t.remaining / 1000) : 0;
    shout('정답 공개!', 'gold', 1500);
    await later(s, 700);
    if (!alive(s)) return;
    /* 둘이 오른쪽으로 달려 나가고 화면이 따라 흘러간다 */
    $('.q-screen').classList.add('leave');
    World.pan(220, 1300);
    gureum.facing(-1); noeul.facing(-1);
    gureum.run(2150, { speed: 1300 });
    await later(s, 200);
    noeul.run(2150, { speed: 1300 });
    await later(s, 900);
    if (!alive(s)) return;
    state.screen = 'answer';
    state.qEndedAt = Date.now();
    save();
    await checker(() => showAnswer(false), 150);
    busy = false;
  }

  function showAnswer(instant) {
    const s = newScene();
    const id = state.current;
    const q = QS[id];
    const p = parseId(id);
    state.screen = 'answer';
    stageBgm(id, false);
    save();
    stopAudio();
    urgentNow = false;
    sideStage(id);
    if (!instant) World.pan(120, 1600);
    hud(label(id)); tickTime();
    barMsg(`COURSE CLEAR<br>${key('Enter')} 지도로`);
    screens.innerHTML = '';
    const scr = el('div', 'screen a-screen');
    instantPanel = instant;
    scr.innerHTML = panelHTML(id, 'answer');
    fillBody($('.q-body', scr), q.a, q.a_img, q.a_audio, `${id}:a`, s, q.a_audio ? 77 : 88);
    const next = el('button', 'gbtn right', `지도로 ▶ ${key('Enter')}`);
    next.id = 'nextBtn';
    next.onclick = () => {
      if (busy) return;
      busy = true;
      Sound.play('select');
      wipe({ x: heroes.gureum.x, y: heroes.gureum.y - 80 }, () => showBoard({ cleared: id })).then(() => { busy = false; });
    };
    scr.appendChild(next);
    screens.appendChild(scr);

    const { gureum, noeul } = heroes;
    gureum.scale(SIDE_S); noeul.scale(SIDE_S);
    gureum.place(HOME.gureum, FLOOR); noeul.place(HOME.noeul, FLOOR);
    gureum.facing(-1); noeul.facing(1);
    if (instant) { park(gureum, noeul); focusMode(s, scr, true); return; }
    /* 왼쪽에서 달려 들어와 자리에서 만세 */
    gureum.place(-120, FLOOR); noeul.place(-300, FLOOR);
    gureum.run(HOME.gureum, { speed: 900, after: 'cheer' }).then((ok) => ok && gureum.facing(-1));
    noeul.run(HOME.noeul, { speed: 1700, after: 'cheer' }).then((ok) => ok && noeul.facing(1));
    Sound.play('clear');
    unpark(gureum, noeul);
    /* 화면 전환이 끝나면 정답에만 집중 */
    s.timers.push(setTimeout(() => alive(s) && focusMode(s, scr), 1500));
    /* 남은 시간 → 점수 (1초 = 50점) */
    const bonus = bonusSec;
    bonusSec = 0;
    if (bonus > 0) {
      (async () => {
        await later(s, 500);
        const tag = el('div', 'tally temp', `TIME BONUS <b>${bonus}</b> × 50`);
        actors.appendChild(tag);
        for (let k = bonus; k >= 0; k--) {
          $('b', tag).textContent = k;
          if (k < bonus) { state.score += 50; shownScore = state.score; paintScore(); Sound.play('tick'); }
          await later(s, 70);
        }
        save();
        await later(s, 900);
        tag.classList.add('out');
      })();
    }
    [[200, 300, 700], [600, 1620, 700], [1000, 960, 680]].forEach(([at, x, y]) => {
      s.timers.push(setTimeout(() => Fx.firework(x, y), at));
    });
    s.timers.push(setTimeout(() => { if (alive(s)) park(gureum, noeul); }, 1400));
  }

  /* =========================================================
     운영 패널
     ========================================================= */
  let panelEl = null;
  function closePanel() { if (panelEl) { panelEl.remove(); panelEl = null; } }
  function openPanel() {
    if (panelEl) return closePanel();
    panelEl = el('div', 'panel pwin');
    panelEl.innerHTML = `
      <div class="panel-head"><h2>운영 패널</h2><button class="pbtn" id="panelClose">닫기 ${key('Esc')}</button></div>
      <div class="panel-stats">
        <div class="stat"><b>${readyIds.length}</b>입력된 문제 (전체 ${allIds.length}칸)</div>
        <div class="stat"><b id="panelUsed">${usedCount()}</b>푼 문제</div>
        <div class="stat ${Object.keys(missingMedia).length ? 'warn' : ''}"><b>${Object.keys(missingMedia).length}</b>파일 없는 문제</div>
        <div class="stat ${storageOk ? '' : 'warn'}"><b>${storageOk ? '정상' : '저장 불가'}</b>진행 상황 저장</div>
      </div>
      <div class="panel-list"></div>
      <div class="panel-foot">
        <div class="keys">${key('Space')} 타이머 멈춤/시작 ${PRESETS.map((n, i) => `${key(i + 1)} ${n}초`).join(' ')} ${key('Enter')} 정답·다음<br>${key('Esc')} 지도로 ${key('F')} 전체화면 ${key('O')} 이 패널</div>
        <button class="hold-reset"><i></i><span>2초 눌러 전체 초기화</span></button>
      </div>`;
    const list = $('.panel-list', panelEl);
    const order = [...readyIds, ...allIds.filter((id) => !readyIds.includes(id))];
    order.forEach((id) => {
      const q = QS[id];
      const ready = readyIds.includes(id);
      const bad = missingMedia[id];
      const row = el('div', `panel-row${ready ? '' : ' is-empty'}`);
      const preview = bad ? `<span class="bad">없는 파일: ${esc(bad.join(', '))}</span>` : esc(ready ? (q.q || q.q_img || q.q_audio).replace(/\n/g, ' ') : '문제 미입력');
      row.innerHTML = `<span>${esc(id.replace(/_/g, ' · '))}</span><span class="preview">${preview}</span><button class="row-btn"></button>`;
      const rb = $('.row-btn', row);
      const paintRow = () => {
        const used = !!state.used[id];
        rb.textContent = used ? '되돌리기' : ready ? '안 씀' : '-';
        rb.classList.toggle('free', !used);
      };
      rb.onclick = () => {
        if (!state.used[id]) return;
        delete state.used[id];
        save();
        paintRow();
        $('#panelUsed', panelEl).textContent = usedCount();
        hud();
        if (state.screen === 'board') showBoard({ instant: true });
      };
      paintRow();
      list.appendChild(row);
    });
    $('#panelClose', panelEl).onclick = closePanel;
    /* 초기화 인터락: 2초 동안 계속 눌러야 동작 */
    const hold = $('.hold-reset', panelEl), fill = $('i', hold);
    let holdId = 0;
    hold.onpointerdown = () => {
      const me = ++holdId;
      tween(2000, (p) => { fill.style.width = `${p * 100}%`; }, () => me === holdId).then((done) => {
        if (!done) return;
        Object.assign(state, { used: {}, current: null, cursor: null, timer: null, audioPos: {}, score: 0, startedAt: 0, qStartedAt: 0, qEndedAt: 0 });
        shownScore = 0; paintScore();
        save();
        closePanel();
        toast('진행 상황을 초기화했어요');
        newScene();
        busy = true;
        wipe({ x: 960, y: 540 }, showTitle).then(() => { busy = false; });
      });
    };
    const cancelHold = () => { holdId += 1; fill.style.width = 0; };
    hold.onpointerup = cancelHold;
    hold.onpointerleave = cancelHold;
    stage.appendChild(panelEl);
  }

  /* =========================================================
     새로고침 인터락
     ========================================================= */
  function isReloadKey(e) {
    const k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === 'f5' || e.keyCode === 116) return true;
    if (mod && k === 'r') return true;
    if (e.altKey && (k === 'arrowleft' || k === 'arrowright')) return true;
    if (e.metaKey && (k === '[' || k === ']')) return true;
    if (k === 'browserrefresh' || k === 'browserback' || k === 'browserforward') return true;
    return false;
  }
  function denyReload(msg) {
    toast(msg);
    Sound.play('deny');
    const f = heroes.noeul;
    if (f && f.parked) {
      f.say('잠겨 있어요!', 1400);
      unpark(f);
      f.hop(40, 320).then(() => park(f));
    }
  }
  window.addEventListener('keydown', (e) => {
    if (isReloadKey(e)) { e.preventDefault(); e.stopPropagation(); denyReload('새로고침과 뒤로 가기는 잠겨 있어요'); }
  }, true);
  window.addEventListener('beforeunload', (e) => { save(); e.preventDefault(); e.returnValue = ''; });
  window.addEventListener('pagehide', save);
  try {
    history.pushState({ guard: 1 }, '');
    window.addEventListener('popstate', () => { history.pushState({ guard: 1 }, ''); denyReload('뒤로 가기는 잠겨 있어요'); });
  } catch (e) { /* 일부 브라우저의 file:// 제한. beforeunload 가 대신 막는다 */ }
  ['contextmenu', 'dragstart', 'dragover', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));

  /* =========================================================
     입력
     ========================================================= */
  function closeTopLayer() {
    const zoom = $('.zoom');
    if (zoom) { zoom.remove(); return true; }
    const modal = $('.modal-back');
    if (modal) { modal.closeModal(); return true; }
    if (panelEl) { closePanel(); return true; }
    return false;
  }
  function enterFull() {
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req) return;
    const out = req.call(root);
    if (out && out.catch) out.catch(() => {});
  }
  function toggleFull() {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else enterFull();
  }

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const modal = $('.modal-back');
    const free = () => !panelEl && !modal && !$('.zoom') && !busy;
    if (modal) {
      if (/^[1-9]$/.test(k)) modal.pickN(Number(k) - 1);
      else if (k === 'arrowup' || k === 'arrowleft') { e.preventDefault(); modal.move(-1); }
      else if (k === 'arrowdown' || k === 'arrowright') { e.preventDefault(); modal.move(1); }
      else if (k === 'enter' || k === ' ') { e.preventDefault(); modal.pick(); }
      else if (k === 'escape') modal.closeModal();
      return;
    }
    if (k === 'enter') {
      e.preventDefault();
      if (!free()) return;
      if (state.screen === 'title') startGame();
      else if (state.screen === 'board' && mapCursor && !walking) onPick(mapCursor);
      else if (state.screen === 'question') onReveal(state.current);
      else if (state.screen === 'answer') { const b = $('#nextBtn'); if (b) b.click(); }
    } else if (k.startsWith('arrow')) {
      if (state.screen !== 'board' || !free()) return;
      e.preventDefault();
      moveCursor(k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0, k === 'arrowup' ? -1 : k === 'arrowdown' ? 1 : 0);
    } else if (k === ' ') {
      e.preventDefault();
      if (state.screen === 'question' && free()) timerKey(scene);
    } else if (/^[1-9]$/.test(k) && PRESETS[k - 1]) {
      if (state.screen === 'question' && free()) startTimer(scene, PRESETS[k - 1]);
    } else if (k === 'escape') {
      if (closeTopLayer()) return;
      if (state.screen === 'question' && free()) onBackFromQuestion(state.current);
    } else if (k === 'f') toggleFull();
    else if (k === 'o') openPanel();
  });
  $('#hudFull').onclick = (e) => { e.currentTarget.blur(); toggleFull(); };
  $('#hudPanel').onclick = (e) => { e.currentTarget.blur(); openPanel(); };

  /* 전체화면과 소리는 브라우저 정책상 첫 입력 뒤에만 가능하다 */
  let firstGesture = true;
  const onGesture = (e) => {
    Sound.unlock();
    Bgm.start();
    if (firstGesture) {
      firstGesture = false;
      const onHud = e.target && e.target.closest && e.target.closest('#hudFull');
      if (SET.autoFullscreen && !onHud) enterFull();
    }
  };
  document.addEventListener('pointerdown', onGesture, true);
  document.addEventListener('keydown', onGesture, true);

  /* 서 있는 캐릭터가 마우스 쪽을 본다 */
  window.addEventListener('pointermove', (e) => {
    const p = toStage(e.clientX, e.clientY);
    Object.values(heroes).forEach((f) => { if (f.parked) f.look((p.x - f.x) / 400); });
  });

  /* =========================================================
     시작
     ========================================================= */
  function boot() {
    fit();
    window.addEventListener('resize', fit);
    World.init($('#world'), SET.snowAmount);
    Fx.init($('#fx'));
    $('#slotG').src = portrait('gureum');
    $('#slotN').src = portrait('noeul');
    $('.coin-ico').style.backgroundImage = `url(${SP.coin()[0].toDataURL()})`;
    paintScore();
    heroes.gureum = new Fox('gureum', actors);
    heroes.noeul = new Fox('noeul', actors);
    preflight();
    const restorable = state.current && hasContent(QS[state.current]);
    const hadProgress = Object.keys(state.used).length > 0 || state.screen !== 'title';
    if (state.screen === 'question' && restorable && state.timer) showQuestion(true);
    else if (state.screen === 'answer' && restorable) showAnswer(true);
    else if (state.screen === 'title' && !hadProgress) showTitle();
    else showBoard({ instant: true });
    save();
    if (hadProgress) setTimeout(() => toast('이전 진행 상황을 그대로 복원했어요'), 500);
  }

  /* 동작 확인용 */
  window.QuizDebug = { state, heroes, scene: () => scene, showTitle, showBoard, showQuestion, showAnswer,
    /* 파이프 위치 점검: 캐릭터가 서고 잘리는 선(pipeAt)과 화면에 그린 파이프가 맞는지 */
    pipeCheck: () => Object.entries(pipeEls).map(([id, b]) => {
      const p = pipeAt(id), r = b.getBoundingClientRect(), a = toStage(r.left, r.top), z = toStage(r.right, r.bottom);
      return { id, dx: Math.round((a.x + z.x) / 2 - p.x), dTop: Math.round(a.y - p.top), w: Math.round(z.x - a.x) };
    }) };

  boot();
})();
