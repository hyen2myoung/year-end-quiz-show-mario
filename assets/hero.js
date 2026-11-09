/* 구름이·노을이 — 손으로 찍은 픽셀 인형 (도트 테마에서 확정한 그림을 그대로 쓴다) (둥근 찹쌀떡 몸, 웃는 실눈, 점 코, 큰 볼터치).
   구름이와 노을이의 차이는 캐릭터 시트대로 속눈썹과 목도리 색이다.
   서 있을 때는 정면, 걸을 때는 옆모습을 쓴다. 동작마다 그림 몇 장을 번갈아 보여 준다.
   그림 지도: 한 글자 = 한 픽셀. 반쪽만 적은 지도는 가운데 줄(마지막 글자)을 기준으로 뒤집어 붙인다. */
(function () {
  const NAMES = { gureum: '구름', noeul: '노을' };
  /* 격자 한 칸 = 캐릭터 좌표 20. 발끝 가운데가 (230, 471)에 온다 */
  const U = 20, W = 32, H = 36, X0 = 9, TOP = 10;
  const FOOT_X = X0 + 7.5, FOOT_Y = TOP + 20;

  const mirror1 = (rows) => rows.map((r) => r + [...r.slice(0, -1)].reverse().join(''));
  const flip = (rows) => rows.map((r) => [...r].reverse().join(''));

  const PAL = { o: '#5b5570', W: '#ffffff', w: '#e4e9f4', g: '#e2d9e6', k: '#3a3048', r: '#e8798b', b: '#a9dcf7', B: '#6fb6dd' };
  const LOOK = {
    gureum: { L: '#a9d6f8', S: '#6db1e8', s: '#4383c6', p: '#ffadc0', p2: '#ffd3dc', lash: false },
    noeul: { L: '#ffc0b2', S: '#f58c7c', s: '#d0604f', p: '#ff9d92', p2: '#ffcbc4', lash: true }
  };

  /* ---------- 그림 지도 ---------- */
  const HEAD = mirror1(['.o......', 'ogo.....', 'oggo..oo', 'oggWooWW', 'oWWWWWWW', 'oWWWWWWW', 'oWWWWWWW', 'oWWWWWWW', 'oWWWWWWW', '.owWWWWW', '..oowwww']);
  /* 귀 쫑긋: 왼쪽 귀 끝이 한 칸 접힌다 */
  const HEAD_TWITCH = HEAD.map((r, i) => (i === 0 ? '.'.repeat(r.length) : i === 1 ? '.o' + r.slice(2) : i === 2 ? 'ogo' + r.slice(3) : r));
  const TORSO = mirror1(['..oLLLLL', '..oSSSSS', '..oWWWWW', '.oWWWWWW', '.oWWWWWW', '.owWWWWW', '.oWWWWWW', '.owWWWWW', '..oWWWWo', '...oooo.']);
  const LOAF = mirror1(['.oLLLLLL', 'oSSSSSSS', 'oWWWWWWW', 'oWWWWWWW', 'owWWWWWW', '.ooooooo']);
  const KNOT = ['oSo', 'oso', '.s.'];
  const TAIL = ['.......oo...', '......oWWo..', '.....oWWWo..', '....oWWWWWo.', '...oWWWWWWWo', '..oWWWWWWWWo', '.oWWWWWWWWWo', 'oWWWWWWWWWwo', 'oWWWWWWWWwwo', 'oWWWWWWWwwo.', '.owwwwwwwo..', '..ooooooo...'];
  const TAIL_SWISH = ['........oo..', '.......oWWo.', '......oWWWo.', '.....oWWWWWo', '...ooWWWWWWo', '..oWWWWWWWWo', '.oWWWWWWWWWo', 'oWWWWWWWWWwo', 'oWWWWWWWWwwo', 'oWWWWWWWwwo.', '.owwwwwwwo..', '..ooooooo...'];
  const TAIL_WRAP = ['..........oooo..', '.......oooWWWWo.', '...oooWWWWWWWWWo', '.oWWWWWWWWWWWWwo', 'oWWWWWWWWWWWwwo.', '.oowwwwwwwwoo...', '...oooooooo.....'];
  /* 팔 (왼쪽 기준, 오른쪽은 뒤집는다). 내린 팔은 몸 기준, 든 팔·볼 손은 머리 기준 */
  const ARM = {
    down: { rows: ['oo.', 'oWo', 'oWo', 'owo', '.o.'], x: 0 },
    up: { rows: ['.oo.', 'oWWo', 'oWo.', 'oWo.', '.oWo', '..oo'], x: -3 },
    cheek: { rows: ['.oo.', 'oWWo', 'oWWo', '.oo.'], x: 1 },
    tight: { rows: ['.o.', 'oWo', 'oWo', '.o.'], x: 1 },
    hold: { rows: ['.oo.', 'oWWo', 'oWWo', '.oo.'], x: 2 }
  };
  const SIDE_HEAD = ['.....o..o......', '....ogoowo.....', '..oooggowwoo...', '.oWWWgWWwWWWo..', 'oWWWWWWWWWWWWo.', 'oWWWWWWWWWWWWo.', 'kWWWWWWWWWWWWWo', 'kWWWWWWWWWWWWWo', 'oWWWWWWWWWWWWwo', '.owWWWWWWWWWwo.', '..oowwwwwwwoo..'];
  const SIDE_BODY = [
    ['..oLLLLLLLLo...', '..oSSSSSSSSo...', '..osoWWWWWWWo..', '.oWsoWWWWWWWo..', '.oWWowWWWWWWo..', '.oWWWWWWWWWWo..', '..owWWWWWWWwo..', '..oWWWoWWWWo...', '...ooo.oooo....'],
    ['..oLLLLLLLLo...', '..oSSSSSSSSo...', '..osoWWWWWWWo..', '.oWsoWWWWWWWo..', '.oWWowWWWWWWo..', '.oWWWWWWWWWWo..', '..owWWWWWWWwo..', '...oWWoWWWo....', '....oo.ooo.....']
  ];
  /* ---------- 새 옷: 목도리를 빼고 원래 목도리 색으로 모자 + 멜빵 반바지 ----------
     settings.js 의 heroOutfit: true 일 때만 쓴다 (시안 확인용으로 window.HERO_OUTFIT 도 받음) */
  const OUTFIT = () => {
    if (window.HERO_OUTFIT != null) return !!window.HERO_OUTFIT;
    const set = window.QUIZ_SETTINGS;
    return !(set && set.heroOutfit === false); /* 기본은 새 옷. settings 에서 false 로 하면 예전 목도리 */
  };
  const TORSO_O = mirror1(['..oWWWWW', '..oWWWWW', '..oWWWWW', '.oWWWWWW', '.oWWWWWW', '.owWWWWW', '.oWWWWWW', '.owWWWWW', '..oWWWWo', '...oooo.']);
  /* 멜빵 바지: 어깨끈 → 가슴판(금단추 2개) → 반바지 */
  const OVERALL = ['....S.....S....', '....S.....S....', '....SSSSSSS....', '....ySSSSSy....', '...SSSSSSSSS...', '..SSSSSSSSSSS..', '..SSSSSSSSSSS..', '..sSSSSSSSSSs..', '...ssss.ssss...'];
  const LOAF_O = mirror1(['.oWWWWWW', 'oWWWWWWW', 'oSSSSSSS', 'oSSSSSSS', 'osSSSSSS', '.ooooooo']);
  /* 앞모습 모자: 둥근 정수리, 가운데 흰 동그라미 마크, 앞으로 넓게 나온 챙. 머리보다 한 칸 위에서 시작 */
  const HAT_FRONT = ['.....ooooo.....', '...ooSSSSSoo...', '..oSSSWWWSSSo..', '..oSSWWiWWSSo..', '.oSSSSWWWSSSSo.', 'ossssssssssssso'];
  /* 옆모습 모자: 챙이 얼굴 앞(왼쪽)으로 쭉 튀어나온다. 머리보다 두 칸 왼쪽에서 시작 */
  const SIDE_HAT = ['.......oooooo....', '.....ooSSLLSSo...', '....oSSSSSSSSSo..', '...oSSWWWSSSSSo..', 'osssssWiWSSSSSSo.', '.oooo............'];
  const SIDE_BODY_O = [
    ['..oWWWWWWWWo...', '..oWWWWWWWWo...', '..oWWWWWWWWWo..', '.oWWWWWWWWWWo..', '.oWWWWWWWWWWo..', '.oWWWWWWWWWWo..', '..owWWWWWWWwo..', '..oWWWoWWWWo...', '...ooo.oooo....'],
    ['..oWWWWWWWWo...', '..oWWWWWWWWo...', '..oWWWWWWWWWo..', '.oWWWWWWWWWWo..', '.oWWWWWWWWWWo..', '.oWWWWWWWWWWo..', '..owWWWWWWWwo..', '...oWWoWWWo....', '....oo.ooo.....']
  ];
  const SIDE_OVERALL = [
    ['......S........', '......S........', '.....SSSS......', '.....ySSS......', '..SSSSSSSSSS...', '..SSSSSSSSSS...', '...SSSSSSSSS...', '...sss.ssss....'],
    ['......S........', '......S........', '.....SSSS......', '.....ySSS......', '..SSSSSSSSSS...', '..SSSSSSSSSS...', '...SSSSSSSSS...', '....ss.sss.....']
  ];
  /* 점프 자세 (옆모습): 앞다리는 무릎을 앞으로 접어 올리고 뒷다리는 아래로 쭉, 뒷팔은 뒤로 뻗는다 */
  const SIDE_JUMP_BODY = ['..oWWWWWWWWo...', '..oWWWWWWWWo...', '..oWWWWWWWWWo..', '.oWWWWWWWWWWo..', 'ooWWWWWWWWWWo..', 'oWWWWWWWWWWWo..', '.oooWWWWWWWwo..', '....oWWWWWWo...', '.......oWWWo...', '........ooo....'];
  const SIDE_JUMP_OVERALL = ['......S........', '......S........', '.....SSSS......', '.....ySSS......', '.SSSSSSSSSSS...', 'SSSSSSSSSSSS...', '....SSSSSSS....', '.....SSSSSS....', '........sss....'];
  const BACK_ARM = ['.oo..', 'oWWo.', '.oWWo', '..oWo', '...o.'];
  /* 앞팔은 똑바로 위로: 주먹이 모자 위로 불쑥 (팔 아랫부분은 머리 뒤에 가려진다) */
  const JUMP_ARM = ['.oooo.', 'oWWWWo', 'oWWWwo', '.oWWo.', '.oWWo.'];
  const JUMP_V2 = { ms: 1e9, side: true, frames: [{ jump: true, mouth: 'open' }] };
  const motionOf = (pose) => (pose === 'jump' && OUTFIT() ? JUMP_V2 : MOTIONS[pose] || MOTIONS.idle);

  const FX = {
    z: { rows: ['###', '..#', '.#.', '#..', '###'], color: '#c9d3ff' },
    bang: { rows: ['#', '#', '#', '.', '#'], color: '#ffd04a' },
    note: { rows: ['..##', '..#.', '..#.', '###.', '##..'], color: '#ffe48f' }
  };
  /* 소품 */
  const BALL = {
    ruby: { F: '#d23048', d: '#8c1428', h: '#ff7d8c' },
    gold: { F: '#f2bf4a', d: '#b47d1c', h: '#ffe48f' },
    emerald: { F: '#2fb47c', d: '#147049', h: '#7ae6b2' }
  };
  /* 의뢰 쪽지: 위에 압정, 줄 쳐진 종이 */
  const NOTE = ['....p....', '...pPp...', 'ooooooooo', 'oCCCCCCCo', 'oClllllCo', 'oCCCCCCCo', 'oClllllCo', 'oCCCCCCCo', 'oCllllCdo', 'oCCCCCCdo', 'ooooooooo'];
  const BAUBLE = ['...ooo...', '...oyo...', '..ooooo..', '.ohhFFFo.', 'ohWhFFFFo', 'ohhFFFFdo', 'oFFFFFFdo', 'oFFFFFddo', '.oFFdddo.', '..ooooo..'];
  const GIFT_BOX = ['ooooooooooooo', 'oRRRRRyRRRRRo', 'oRRRRRyRRRRro', 'oRRRRRyRRRRro', 'oRRRRRyRRRRro', 'orrrrryrrrrro', 'ooooooooooooo'];
  const GIFT_LID = ['...oo...oo....', '..oyyo.oyyo...', '...oyyoyyo....', 'ooooooyooooooo', 'oQQQQQyQQQQQQo', 'ooooooooooooo.'];
  const BUTTON = ['..ooooo..', '.oGGGGGo.', 'oGGWGGGGo', 'oGGWWGGGo', 'oGGWGGGgo', '.ogggggo.', '..ooooo..'];
  const PROP_PAL = { C: '#f6dfa6', l: '#c9a26a', d: '#e2c07a', o: '#5b5570', y: '#f2c45a', W: '#ffffff', R: '#d23048', r: '#9c1a30', Q: '#ec4a60', G: '#3ec46d', g: '#1d8a45' };

  function grid() { return { c: new Array(W * H).fill(null) }; }
  function stamp(g, rows, x0, y0, pal) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const v = pal[ch]; const x = x0 + i, y = y0 + j;
      if (v && x >= 0 && y >= 0 && x < W && y < H) g.c[y * W + x] = v;
    }));
  }
  const dot = (g, x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) g.c[y * W + x] = v; };
  function paint(g, canvas) {
    const x = canvas.getContext('2d');
    x.clearRect(0, 0, W, H);
    g.c.forEach((v, i) => { if (v) { x.fillStyle = v; x.fillRect(i % W, Math.floor(i / W), 1, 1); } });
  }

  /* ---------- 얼굴 ---------- */
  function face(g, kind, X, Y, f) {
    const L = LOOK[kind], K = PAL.k;
    const p = (x, y, v) => dot(g, X + x, Y + y, v);
    const eyes = f.eyes || 'arc';
    [[2, false], [9, true]].forEach(([ex, right]) => {
      if (eyes === 'arc') { p(ex + 1, 5, K); p(ex + 2, 5, K); p(ex, 6, K); p(ex + 3, 6, K); }
      if (eyes === 'flat') for (let i = 0; i < 4; i++) p(ex + i, 6, K);
      if (eyes === 'sleep') { p(ex, 6, K); p(ex + 1, 7, K); p(ex + 2, 7, K); p(ex + 3, 6, K); }
      if (eyes === 'squeeze') {
        if (right) { p(ex + 2, 5, K); p(ex + 1, 6, K); p(ex + 2, 7, K); } else { p(ex + 1, 5, K); p(ex + 2, 6, K); p(ex + 1, 7, K); }
      }
      if (eyes === 'dot') { p(ex + 1, 5, K); p(ex + 2, 5, K); p(ex + 1, 6, K); p(ex + 2, 6, K); }
    });
    if (L.lash && (eyes === 'arc' || eyes === 'dot')) { p(1, 5, K); p(13, 5, K); }
    [[1, 7], [2, 7], [3, 7], [11, 7], [12, 7], [13, 7], [2, 8], [12, 8]].forEach(([x, y]) => p(x, y, L.p));
    [[1, 8], [3, 8], [11, 8], [13, 8]].forEach(([x, y]) => p(x, y, L.p2));
    const mouth = f.mouth || 'none';
    if (mouth === 'none') p(7, 8, K);
    if (mouth === 'open') { p(7, 7, K); p(6, 8, K); p(8, 8, K); p(7, 9, K); p(7, 8, PAL.r); }
    if (mouth === 'o') { p(7, 7, K); p(6, 8, K); p(8, 8, K); p(7, 9, K); }
    if (mouth === 'yawn') { p(7, 7, K); p(6, 8, K); p(8, 8, K); p(6, 9, K); p(8, 9, K); p(7, 10, K); p(7, 8, PAL.r); p(7, 9, PAL.r); }
    if (f.sweat) stamp(g, ['.b.', 'bBb', '.B.'], X + 13, Y + 2, PAL);
  }
  function sideFace(g, kind, X, Y, f) {
    const L = LOOK[kind], K = PAL.k;
    const p = (x, y, v) => dot(g, X + x, Y + y, v);
    if ((f.eyes || 'arc') === 'squeeze') { p(3, 5, K); p(4, 6, K); p(3, 7, K); } else { p(3, 5, K); p(4, 5, K); p(2, 6, K); p(5, 6, K); }
    if (L.lash) p(1, 5, K);
    p(4, 8, L.p); p(5, 8, L.p); p(6, 8, L.p);
    if (f.mouth === 'open' || f.mouth === 'o') { p(2, 9, K); p(2, 10, PAL.r); } else p(2, 9, K);
  }

  /* ---------- 동작 ---------- */
  const MOTIONS = {
    idle: { ms: 600, frames: [{}, { tail: 1 }, {}, { tail: 1, twitch: true }] },
    walk: { ms: 170, side: true, frames: [{ step: 0 }, { step: 1, by: -1 }] },
    run: { ms: 90, side: true, frames: [{ step: 0 }, { step: 1, by: -1 }] },
    jump: { ms: 1e9, frames: [{ arms: ['up', 'up'] }] },
    cheer: { ms: 220, frames: [{ arms: ['cheek', 'cheek'], eyes: 'squeeze', mouth: 'open', hy: -2, by: -2 }, { arms: ['cheek', 'cheek'], eyes: 'squeeze', mouth: 'open' }] },
    surprised: { ms: 300, frames: [{ arms: ['up', 'up'], eyes: 'dot', mouth: 'o', hy: -1, by: -1, fx: [['bang', 21, 4], ['bang', 24, 5]] }, { arms: ['up', 'up'], eyes: 'dot', mouth: 'o', fx: [['bang', 21, 5], ['bang', 24, 4]] }] },
    nervous: { ms: 120, frames: [{ arms: ['tight', 'tight'], eyes: 'squeeze', sweat: true, dx: -1 }, { arms: ['tight', 'tight'], eyes: 'squeeze', sweat: true, dx: 1 }] },
    groove: { ms: 260, frames: [{ arms: ['up', 'down'], dx: -1 }, { by: 1, hy: 1, tail: 1 }, { arms: ['down', 'up'], dx: 1 }, { by: 1, hy: 1 }] },
    sleepy: { ms: 520, frames: [{ eyes: 'flat' }, { eyes: 'flat', hy: 1 }, { eyes: 'squeeze', mouth: 'yawn', arms: ['cheek', 'down'] }, { eyes: 'flat', hy: 1, fx: [['z', 25, 6]] }] },
    sleep: { ms: 700, loaf: true, frames: [{ eyes: 'sleep', fx: [['z', 25, 9]] }, { eyes: 'sleep', hy: 1, fx: [['z', 27, 6]] }] }
  };
  /* 동작마다 기본 표정. fox.mood()로 잠깐 바꿀 수 있다 */
  const MOOD = {
    smile: {},
    joy: { eyes: 'squeeze', mouth: 'open' },
    wow: { eyes: 'dot', mouth: 'o' },
    worry: { eyes: 'squeeze', sweat: true }
  };
  const POSE_MOOD = { idle: 'smile', walk: 'smile', run: 'smile', jump: 'smile', cheer: 'joy', nervous: 'worry', groove: 'smile', surprised: 'wow', sleepy: 'smile', sleep: 'smile' };

  function drawFrame(g, kind, pose, f, st) {
    const L = LOOK[kind];
    const pal = { ...PAL, L: L.L, S: L.S, s: L.s, y: '#ffd23f', i: L.s };
    const m = motionOf(pose);
    const fit = OUTFIT();
    const carry = st.prop ? st.prop.slot : '';
    /* 표정: 동작 그림의 눈·입이 먼저, 없으면 기분 */
    const fm = { ...(MOOD[st.mood] || {}), ...pickFace(f) };
    if (st.talk) fm.mouth = 'open';
    const X = X0 + (f.dx || 0), hy = TOP + (f.hy || 0), by = TOP + 10 + (f.by || 0);
    if (m.loaf) {
      for (let x = X0 - 1; x < X0 + 18; x++) dot(g, x, FOOT_Y, 'rgba(16,28,56,.3)');
      stamp(g, fit ? LOAF_O : LOAF, X, TOP + 14, pal);
      stamp(g, HEAD, X, TOP + 5 + (f.hy || 0), pal);
      if (fit) stamp(g, HAT_FRONT, X, TOP + 4 + (f.hy || 0), pal);
      stamp(g, TAIL_WRAP, X + 5, TOP + 16, pal);
      face(g, kind, X, TOP + 5 + (f.hy || 0), fm);
    } else if (m.side) {
      for (let x = X0 - 1; x < X0 + 13; x++) dot(g, x, FOOT_Y, 'rgba(16,28,56,.3)');
      stamp(g, TAIL, X + 10, TOP + 7 + (f.by || 0), pal);
      if (f.jump) {
        stamp(g, BACK_ARM, X + 10, TOP + 11, pal);
        stamp(g, SIDE_JUMP_BODY, X, TOP + 10, pal);
        if (fit) stamp(g, SIDE_JUMP_OVERALL, X, TOP + 10, pal);
        stamp(g, JUMP_ARM, X + 1, hy - (fit ? 3 : 2), pal);
      } else {
        stamp(g, (fit ? SIDE_BODY_O : SIDE_BODY)[f.step || 0], X, TOP + 10, pal);
        if (fit) stamp(g, SIDE_OVERALL[f.step || 0], X, TOP + 10, pal);
      }
      stamp(g, SIDE_HEAD, X, hy + (f.by || 0), pal);
      if (fit) stamp(g, SIDE_HAT, X - 2, hy + (f.by || 0), pal);
      sideFace(g, kind, X, hy + (f.by || 0), fm);
    } else {
      for (let x = X0 + 1; x < X0 + 14; x++) dot(g, x, FOOT_Y, 'rgba(16,28,56,.3)');
      stamp(g, f.tail ? TAIL_SWISH : TAIL, X + 10, TOP + 7 + (f.by || 0), pal);
      if (fit) { stamp(g, TORSO_O, X, by, pal); stamp(g, OVERALL, X, by, pal); }
      else { stamp(g, TORSO, X, by, pal); stamp(g, KNOT, X + 9, by + 1, pal); }
      let arms = f.arms || ['down', 'down'];
      if (carry === 'top') arms = ['up', 'up'];
      if (carry === 'front') arms = ['none', 'none'];
      const armY = { down: by + 2, tight: by + 2, up: by - 5, cheek: hy + 6, hold: by + 3 };
      const armAt = (name, right) => {
        const a = ARM[name]; if (!a) return;
        const w = a.rows[0].length;
        const x = right ? X + 14 - a.x - (w - 1) : X + a.x;
        stamp(g, right ? flip(a.rows) : a.rows, x, armY[name], pal);
      };
      if (arms[0] !== 'cheek') armAt(arms[0], false);
      if (arms[1] !== 'cheek') armAt(arms[1], true);
      stamp(g, f.twitch ? HEAD_TWITCH : HEAD, X, hy, pal);
      if (fit) stamp(g, HAT_FRONT, X, hy - 1, pal);
      face(g, kind, X + (st.look || 0), hy, fm);
      if (arms[0] === 'cheek') armAt('cheek', false);
      if (arms[1] === 'cheek') armAt('cheek', true);
    }
    /* 소품 */
    if (st.prop && st.prop.sprite !== 'none') {
      const side = !!m.side;
      if (st.prop.sprite === 'note') {
        stamp(g, NOTE, X + 3, hy - 10, { ...PROP_PAL, o: '#6e4a28', p: st.prop.color || '#e23a3a', P: '#ffffff' });
      } else if (st.prop.sprite === 'bauble') {
        const c = BALL[st.prop.color] || BALL.ruby;
        stamp(g, BAUBLE, X + (side ? 3 : 3), hy - 9, { ...PROP_PAL, ...c });
      } else {
        const px = side ? X - 3 : X + 1, py = by + 2;
        if (st.prop.sprite === 'gift') {
          stamp(g, GIFT_BOX, px, py + 4, PROP_PAL);
          if (!st.opened) stamp(g, GIFT_LID, px - 1, py - 1, PROP_PAL);
          else if (st.lid < 1) stamp(g, GIFT_LID, px - 1 + Math.round(st.lid * 5), py - 1 - Math.round(st.lid * 12), PROP_PAL);
        } else {
          stamp(g, BUTTON, px + 2, py + 3, PROP_PAL);
        }
        if (!side) { armAt2(g, 'hold', false, X, by, pal); armAt2(g, 'hold', true, X, by, pal); }
      }
    }
    (f.fx || []).forEach(([what, x, y]) => stamp(g, FX[what].rows, x, y, { '#': FX[what].color }));
  }
  function armAt2(g, name, right, X, by, pal) {
    const a = ARM[name], w = a.rows[0].length;
    const x = right ? X + 14 - a.x - (w - 1) : X + a.x;
    stamp(g, right ? flip(a.rows) : a.rows, x, by + 3, pal);
  }
  const pickFace = (f) => {
    const o = {};
    ['eyes', 'mouth', 'sweat'].forEach((k) => { if (f[k] !== undefined) o[k] = f[k]; });
    return o;
  };

  /* ---------- 공통 ---------- */
  const NEVER = new Promise(() => {});
  const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function tween(ms, fn, isAlive) {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        if (isAlive && !isAlive()) return resolve(false);
        const p = Math.min(1, (now - start) / ms);
        fn(p);
        if (p < 1) requestAnimationFrame(step); else resolve(true);
      };
      requestAnimationFrame(step);
    });
  }

  const PROPS = { button: { slot: 'front', sprite: 'button' }, gift: { slot: 'front', sprite: 'gift' } };
  const baubleProp = (color) => ({ slot: 'top', sprite: 'bauble', color });
  const noteProp = (color) => ({ slot: 'top', sprite: 'note', color });

  const all = [];
  function tick(now) {
    all.forEach((f) => f.render(now));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  class Fox {
    constructor(kind, parent) {
      this.kind = kind;
      this.name = NAMES[kind];
      this.x = -300; this.y = 1050; this.s = .42; this.dir = 1; this.moveId = 0;
      this.parked = false;
      this.lookV = 0; this.prop = null; this.talkUntil = 0; this.key = '';
      this.el = document.createElement('div');
      this.el.className = `fox fox-${kind}`;
      this.el.innerHTML = `<div class="fox-scale"><div class="fox-flip"><canvas class="fox-px" width="${W}" height="${H}"></canvas></div></div><div class="fox-bubble"></div>`;
      parent.appendChild(this.el);
      this.scaleEl = this.el.querySelector('.fox-scale');
      this.flipEl = this.el.querySelector('.fox-flip');
      this.canvas = this.el.querySelector('.fox-px');
      this.bubble = this.el.querySelector('.fox-bubble');
      this.pose('idle');
      this.scale(this.s);
      this.sync();
      all.push(this);
    }
    render(now) {
      const pose = this.poseName;
      const m = motionOf(pose);
      /* 두 캐릭터가 똑같이 움직이지 않도록 노을이는 박자를 조금 늦춘다 */
      const fi = Math.floor((now + (this.kind === 'noeul' ? 333 : 0)) / m.ms) % m.frames.length;
      const talk = now < this.talkUntil && Math.floor(now / 120) % 2 === 0;
      const opened = this.el.classList.contains('open-gift');
      if (!opened) this.giftT = 0; else if (!this.giftT) this.giftT = now;
      const lid = opened ? Math.min(1, (now - this.giftT) / 600) : 0;
      const look = m.side ? 0 : Math.round(this.lookV);
      const prop = this.prop ? `${this.prop.sprite}${this.prop.color || ''}` : '';
      const key = `${pose}|${fi}|${this.mood_}|${talk}|${look}|${prop}|${opened ? Math.round(lid * 10) : -1}`;
      if (key === this.key) return;
      this.key = key;
      const g = grid();
      drawFrame(g, this.kind, pose, m.frames[fi], { mood: this.mood_, talk, look, prop: this.prop, opened, lid });
      paint(g, this.canvas);
    }
    sync() { this.el.style.transform = `translate(${Math.round(this.x)}px,${Math.round(this.y)}px)`; }
    place(x, y, s) {
      this.stop();
      this.x = x;
      if (y != null) this.y = y;
      if (s != null) this.scale(s);
      this.sync();
      return this;
    }
    scale(s) { this.s = s; this.scaleEl.style.setProperty('--s', s); }
    pose(name) {
      this.poseName = MOTIONS[name] ? name : 'idle';
      this.el.dataset.pose = this.poseName;
      return this.mood(POSE_MOOD[this.poseName] || 'smile');
    }
    mood(name) { this.mood_ = name; this.el.dataset.mood = name; return this; }
    /* 기본 그림은 왼쪽을 향하고 꼬리가 오른쪽에 있다 */
    facing(dir) { this.dir = dir; this.flipEl.style.setProperty('--dir', dir); }
    look(v) { this.lookV = Math.max(-1, Math.min(1, v)) * this.dir; }
    carry(prop) {
      this.prop = !prop ? null : typeof prop === 'string' ? PROPS[prop] || null : prop;
      this.el.dataset.carry = this.prop ? this.prop.slot : '';
      return this;
    }
    stop() { this.moveId += 1; }
    async go(x, { speed = 250, pose = 'walk', after = 'idle', ease = (t) => t } = {}) {
      const id = ++this.moveId;
      const from = this.x;
      const dist = Math.abs(x - from);
      if (dist < 2) { this.pose(after); return true; }
      this.facing(x > from ? -1 : 1);
      this.look(x > from ? 1 : -1);
      this.pose(pose);
      const done = await tween(dist / speed * 1000, (p) => {
        this.x = from + (x - from) * ease(p);
        this.sync();
      }, () => id === this.moveId);
      if (!done) return NEVER;
      this.pose(after);
      return true;
    }
    run(x, opts = {}) { return this.go(x, { speed: 900, pose: 'run', ...opts }); }
    async hop(h = 70, ms = 420, after) {
      const id = ++this.moveId;
      const y0 = this.y;
      this.pose('jump');
      const done = await tween(ms, (p) => {
        this.y = y0 - Math.sin(p * Math.PI) * h;
        this.sync();
      }, () => id === this.moveId);
      if (!done) return NEVER;
      this.y = y0; this.sync();
      this.pose(after || 'idle');
      return true;
    }
    /* 포물선 이동 */
    async arc(x, y, h, ms, after) {
      const id = ++this.moveId;
      const x0 = this.x, y0 = this.y;
      this.facing(x > x0 ? -1 : 1);
      this.pose('jump');
      const done = await tween(ms, (p) => {
        this.x = x0 + (x - x0) * p;
        this.y = y0 + (y - y0) * p - Math.sin(p * Math.PI) * h;
        this.sync();
      }, () => id === this.moveId);
      if (!done) return NEVER;
      if (after) this.pose(after);
      return true;
    }
    say(text, ms = 2200) {
      clearTimeout(this.sayTimer);
      this.bubble.textContent = text;
      /* 머리 위에 시계를 들고 있으면 말풍선은 시계 위로 */
      const held = this.el.querySelector('.clock');
      const lift = held ? -parseFloat(held.style.top || '-312') + 12 : (this.prop && this.prop.slot === 'top' ? 600 : 420) * this.s + 18;
      this.bubble.style.setProperty('--lift', `${lift}px`);
      this.bubble.classList.add('show');
      this.talkUntil = performance.now() + Math.min(ms, 1000);
      this.sayTimer = setTimeout(() => this.bubble.classList.remove('show'), ms);
    }
  }

  window.Fox = Fox;
  window.foxTween = tween;
  window.foxEase = easeInOut;
  window.foxProp = { bauble: baubleProp, note: noteProp };
  window.foxSprite = { U, W, H, FOOT_X, FOOT_Y };
  /* 시안 그림용: 동작 이름과 몇 번째 장인지로 한 장을 그린다 */
  window.foxFrame = (kind, pose, i, canvas, mood) => {
    const g = grid();
    const m = motionOf(pose);
    drawFrame(g, kind, pose, m.frames[i % m.frames.length], { mood: mood || POSE_MOOD[pose] || 'smile', look: 0 });
    paint(g, canvas);
  };
  /* 퀘스트 창에 넣는 얼굴 초상화 */
  window.foxPortrait = (kind) => {
    const g = grid();
    drawFrame(g, kind, 'idle', MOTIONS.idle.frames[0], { mood: 'smile', look: 0 });
    const full = document.createElement('canvas');
    full.width = W; full.height = H;
    paint(g, full);
    const c = document.createElement('canvas');
    c.width = 19; c.height = 14;
    c.getContext('2d').drawImage(full, X0 - 2, TOP - 1, 19, 14, 0, 0, 19, 14);
    return c.toDataURL();
  };
})();
