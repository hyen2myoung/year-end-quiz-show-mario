/* 게임 화면 배경: 옆으로 흘러가는 스테이지들과 위에서 내려다본 월드 지도.
   가로 320 × 세로 180 칸에 그린 뒤 6배로 키운다. 겹겹이 다른 속도로 흘러 멀고 가까운 느낌을 낸다.
   테마  day    눈 덮인 평원 (지상)
         water  물속 — 햇살, 물고기 떼, 산호·해초, 물방울
         sky    하늘 — 구름 바다, 떠 있는 눈섬, 큰 버섯 발판, 구름 땅
         cave   지하 — 파란 벽돌 기둥, 고드름 천장, 얼음 결정
         castle 성 — 돌벽·아치 창문, 용암, 횃불 기둥, 불티 (tint 로 깃발·창문 색을 바꾼다)
         night · sunset · ice  예전 겨울 테마 (그대로 쓸 수 있다) */
(function () {
  const { Grid, ellipse, rect, rrect, tri, any, INK } = window.Pixel;
  const VW = 320, VH = 180, GY = 138; /* 땅 윗면 = 138칸 = 828px. 154칸(924px) 아래는 검은 상태 막대 */

  /* ---------- 테마 색 ---------- */
  const THEMES = {
    day: {
      sky: [['#9ce0ff', 0]],
      far: { fill: '#b8dcff', snow: '#ffffff', line: '#86b4e8' },
      hill: { fill: '#3fae4a', light: '#7fd86a', dark: '#23823a', line: '#0f3a1a', snow: '#ffffff', snowShade: '#cfe6ff' },
      cloud: { fill: '#ffffff', shade: '#ffffff', line: '#1a1020' },
      tree: { fill: '#22924a', light: '#4cc068', dark: '#0f5a2e', line: '#082a14' },
      ground: { fill: '#d0702e', light: '#f6a464', dark: '#86400f', line: '#3a1606', snow: '#ffffff', snowShade: '#bcdcff' },
      island: { fill: '#56c25a', light: '#8eea80', dark: '#2e8a3a', cliff: '#7a4a24', cliffDark: '#4a2a10' }
    },
    night: {
      sky: [['#12124a', 0]],
      far: { fill: '#2a2e70', snow: '#8e9ad8', line: '#20245a' },
      hill: { fill: '#3a3f96', light: '#5a62c0', dark: '#262a6a', line: '#0a0a24', snow: '#dfe6ff', snowShade: '#9aa6e0' },
      cloud: { fill: '#3a3f80', shade: '#2a2e66', line: '#14163e' },
      tree: { fill: '#1a5a5a', light: '#2a8080', dark: '#0e3434', line: '#04141a' },
      ground: { fill: '#4a5ac0', light: '#7a8aee', dark: '#2a3480', line: '#0a0c2a', snow: '#e8eeff', snowShade: '#9aa8e8' },
      island: { fill: '#6a5ad0', light: '#a296f0', dark: '#463a9a', cliff: '#3a2a6a', cliffDark: '#22183e' }
    },
    sunset: {
      sky: [['#ff9a6a', 0]],
      far: { fill: '#b84a7a', snow: '#ffc8d8', line: '#8a2e62' },
      hill: { fill: '#8a2e5e', light: '#b84a7a', dark: '#5e1a40', line: '#2a0818', snow: '#ffe0e8', snowShade: '#ffa8be' },
      cloud: { fill: '#ffd0a0', shade: '#ff9a7a', line: '#a83a5a' },
      tree: { fill: '#4a1a3a', light: '#6a2a52', dark: '#2a0c22', line: '#14040e' },
      ground: { fill: '#c0522e', light: '#f08a5a', dark: '#7a2a14', line: '#2a0a04', snow: '#fff0e8', snowShade: '#ffb8a0' },
      island: { fill: '#f08a3a', light: '#ffc07a', dark: '#b8581a', cliff: '#7a3a14', cliffDark: '#4a200a' }
    },
    ice: {
      sky: [['#0a2232', 0]],
      far: { fill: '#16405a', snow: '#3a7a9a', line: '#0e2c40' },
      hill: { fill: '#1e6a8a', light: '#3a9ac0', dark: '#124a62', line: '#04141e', snow: '#9ae8ff', snowShade: '#5ac0e0' },
      cloud: { fill: '#9ae8ff', shade: '#5ac0e0', line: '#0e3a52' },
      tree: { fill: '#5ad0f0', light: '#c8f6ff', dark: '#2a8ab0', line: '#0a2c40' },
      ground: { fill: '#7ad8f6', light: '#d0f6ff', dark: '#3a98c0', line: '#0a2c40', snow: '#ffffff', snowShade: '#b8eeff' },
      island: { fill: '#4ab8d8', light: '#a0eaff', dark: '#2a82a8', cliff: '#1a5a7a', cliffDark: '#0e3448' }
    }
  };
  const ORN = ['#ff3a4a', '#ffd23f', '#4ab0ff', '#ff8ad0', '#ffffff'];

  /* 가로로 이어 붙여도 이음새가 없게: 도형을 좌우로 한 번씩 더 찍는다 */
  const wrap = (W, f) => (x, y) => f(x, y) || f(x + W, y) || f(x - W, y);
  /* 간단한 고정 난수 */
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- 층별 그림 ---------- */
  function buildSky(th, name) {
    const g = new Grid(VW, VH);
    const bands = th.sky;
    for (let y = 0; y < VH; y++) {
      let i = 0;
      while (i < bands.length - 1 && y >= bands[i + 1][1]) i++;
      for (let x = 0; x < VW; x++) {
        let v = bands[i][0];
        /* 띠 경계는 바둑판 무늬로 섞는다 (옛날 게임기 그러데이션) */
        const nx = bands[i + 1];
        if (nx && y >= nx[1] - 4 && (x + y) % 2 === 0 && y >= nx[1] - 2) v = nx[0];
        else if (nx && y >= nx[1] - 4 && y < nx[1] - 2 && (x % 2 === 0 && y % 2 === 0)) v = nx[0];
        g.set(x, y, v);
      }
    }
    if (name === 'night') {
      /* 달 */
      g.part(ellipse(262, 34, 13, 13), { fill: '#fff6c8', line: '#c8b878', shade: '#e8d890' });
      g.part(ellipse(268, 30, 10, 10), { fill: bands[0][0] });
      g.part(ellipse(258, 40, 2, 2), { fill: '#e8d890' });
    }
    if (name === 'sunset') {
      g.part(ellipse(232, 132, 26, 26), { fill: '#ffe08a', light: '#fff4c0' });
      for (let y = 112; y < 140; y += 5) for (let x = 200; x < 266; x++) if (y % 10 === 2) g.set(x, y, '#ffb86a');
    }
    if (name === 'ice') {
      /* 멀리 보이는 얼음 기둥 */
      const r = rng(7);
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(r() * VW), w = 8 + Math.floor(r() * 10);
        g.part(rect(x, 0, x + w, VH), { fill: '#0e2a3c', light: '#163c52' });
      }
    }
    return g.toCanvas();
  }

  function buildFar(th, W) {
    const g = new Grid(W, 80);
    const peaks = [[30, 40, 34], [100, 28, 40], [170, 46, 30], [240, 32, 44], [300, 50, 26]].map(([x, h, w]) => [x * W / 320, h, w]);
    const inMtn = wrap(W, (x, y) => peaks.some(([cx, top, hw]) => y >= top + Math.abs(x - cx) * (80 - top) / hw / 1.4));
    g.part(inMtn, { fill: th.far.fill, line: th.far.line });
    /* 봉우리 눈 */
    g.part(wrap(W, (x, y) => peaks.some(([cx, top, hw]) => y >= top + Math.abs(x - cx) * (80 - top) / hw / 1.4 && y < top + 8 + ((x * 7) % 3))), { fill: th.far.snow });
    return g.toCanvas();
  }

  function buildHills(th, W, seed) {
    const g = new Grid(W, 70);
    const r = rng(seed);
    const hills = [];
    for (let x = 10; x < W; x += 60 + r() * 50) hills.push([x, 24 + r() * 34, 26 + r() * 22]);
    const inHill = wrap(W, (x, y) => hills.some(([cx, h, rx]) => ((x - cx) / rx) ** 2 + ((y - 70) / h) ** 2 <= 1));
    const h = th.hill;
    g.part(inHill, { fill: h.fill, line: h.line });
    if (!h.snow) {
      for (let y = 0; y < 70; y++) for (let x = 0; x < W; x++) {
        if (y % 4 === 1 && (x + (y % 8 === 1 ? 0 : 2)) % 4 === 0 && g.get(x, y) === h.fill) g.set(x, y, h.dark);
      }
      return g.toCanvas();
    }
    /* 언덕 무늬: 바둑판처럼 엇갈린 점 */
    for (let y = 0; y < 70; y++) for (let x = 0; x < W; x++) {
      if (y % 4 === 1 && (x + (y % 8 === 1 ? 0 : 2)) % 4 === 0 && g.get(x, y) === h.fill) g.set(x, y, h.dark);
    }
    /* 눈 모자: 꼭대기에서 몇 칸 아래까지, 끝이 물결처럼 */
    hills.forEach(([cx, hh, rx]) => {
      const top = 70 - hh;
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const xx = ((x % W) + W) % W;
        for (let y = top; y < top + 9; y++) {
          if (((x - cx) / rx) ** 2 + ((y - 70) / hh) ** 2 > .98) continue;
          const lim = top + 5 + Math.round(Math.sin(x * .7) * 1.5 + 1);
          if (y < lim) g.set(xx, y, y >= lim - 1 ? h.snowShade : h.snow);
        }
      }
      /* 반짝이는 눈 점 */
      for (let k = 0; k < 4; k++) g.set(((Math.round(cx - rx / 2 + k * rx / 3) % W) + W) % W, top + 14 + k * 5, h.snow);
    });
    return g.toCanvas();
  }

  function buildClouds(th, W, name) {
    const H = name === 'ice' ? 30 : 40;
    const g = new Grid(W, H);
    if (name === 'ice') {
      /* 천장에 매달린 고드름 */
      const r = rng(3);
      g.part(rect(0, 0, W, 5), { fill: th.cloud.shade, line: th.cloud.line });
      for (let x = 0; x < W; x += 6 + Math.floor(r() * 8)) {
        const len = 8 + r() * 20, w = 2 + r() * 3;
        g.part(tri(x - w, 4, x + w, 4, x, 4 + len), { fill: th.cloud.fill, line: th.cloud.line, light: '#ffffff' });
      }
      return g.toCanvas();
    }
    const r = rng(11);
    for (let x = 30; x < W - 30; x += 90 + r() * 70) {
      const y = 10 + r() * 14, s = .8 + r() * .5;
      const puff = any(ellipse(x, y + 4, 16 * s, 7 * s), ellipse(x - 9 * s, y + 3, 8 * s, 6 * s), ellipse(x + 2 * s, y - 1, 9 * s, 8 * s), ellipse(x + 11 * s, y + 3, 8 * s, 6 * s));
      g.part(puff, { fill: th.cloud.fill, line: th.cloud.line, shade: th.cloud.shade, shadeW: 2 });
    }
    return g.toCanvas();
  }

  /* 장식 전구가 달린 전나무 */
  function pine(g, cx, base, h, th, r, star) {
    const t = th.tree;
    g.part(rect(cx - 1, base - 4, cx + 1, base), { fill: '#6a3a1a', line: INK });
    const tiers = 3, tierH = (h - 4) / tiers;
    for (let i = 0; i < tiers; i++) {
      const top = base - h + i * tierH * .85, bot = base - 3 - (tiers - 1 - i) * tierH * .55;
      const hw = 5 + i * 3.4 + h * .06;
      g.part(tri(cx, top, cx - hw, bot, cx + hw, bot), { fill: t.fill, line: t.line, light: t.light, shade: t.dark });
      /* 가지 끝 눈 */
      for (let x = Math.round(cx - hw + 1); x < cx + hw - 1; x += 2) g.set(x, Math.round(bot) - 1, '#ffffff');
      g.set(Math.round(cx), Math.round(top) + 1, '#ffffff');
    }
    for (let k = 0; k < 5 + h / 6; k++) {
      const yy = base - 5 - r() * (h - 9), spread = (base - yy) * .32;
      g.set(Math.round(cx + (r() * 2 - 1) * spread), Math.round(yy), ORN[Math.floor(r() * ORN.length)]);
    }
    if (star) g.stamp(['.#.', '###', '.#.'], Math.round(cx) - 1, Math.round(base - h) - 3, { '#': '#ffd23f' });
  }
  function snowman(g, cx, base) {
    g.part(ellipse(cx, base - 6, 7, 6), { fill: '#ffffff', line: INK, shade: '#bcd4f0' });
    g.part(ellipse(cx, base - 15, 5, 5), { fill: '#ffffff', line: INK, shade: '#bcd4f0' });
    g.rect(cx - 4, base - 22, 9, 1, INK); g.rect(cx - 3, base - 26, 7, 4, INK); g.rect(cx - 3, base - 23, 7, 1, '#e2383f');
    g.set(cx - 2, base - 16, INK); g.set(cx + 2, base - 16, INK);
    g.set(cx + 1, base - 14, '#ff8a1a'); g.set(cx + 2, base - 14, '#ff8a1a'); g.set(cx + 3, base - 14, '#ff8a1a');
    g.rect(cx - 5, base - 11, 11, 2, '#e2383f'); g.rect(cx + 3, base - 10, 2, 4, '#e2383f');
    g.set(cx, base - 7, INK); g.set(cx, base - 4, INK);
  }
  function house(g, x, base, th) {
    g.part(rect(x, base - 16, x + 22, base), { fill: '#8a4a2a', line: INK, shade: '#5a2a14', light: '#aa6a3a' });
    g.part(tri(x - 4, base - 15, x + 26, base - 15, x + 11, base - 28), { fill: '#c83a3a', line: INK, shade: '#8a1a2a' });
    g.part(tri(x - 3, base - 16, x + 25, base - 16, x + 11, base - 27.5), { fill: '#ffffff', shade: '#c8d8f0' });
    g.part(rect(x + 4, base - 11, x + 9, base - 6), { fill: '#ffd86a', line: INK, light: '#fff4b0' });
    g.part(rect(x + 14, base - 9, x + 18, base), { fill: '#5a2a14', line: INK });
    g.part(ellipse(x + 16, base - 13, 2.2, 2.2), { fill: '#2a9a4a', line: INK });
    /* 처마 전구 */
    for (let i = 0; i < 24; i += 3) g.set(x - 1 + i, base - 15 + ((i / 3) % 2), ORN[(i / 3) % 4]);
  }
  function crystal(g, cx, base, h, th) {
    const t = th.tree;
    g.part(tri(cx - 4, base, cx + 4, base, cx, base - h), { fill: t.fill, line: t.line, light: t.light, shade: t.dark });
    g.part(tri(cx + 2, base, cx + 9, base, cx + 6, base - h * .6), { fill: t.fill, line: t.line, light: t.light, shade: t.dark });
    g.part(tri(cx - 8, base, cx - 2, base, cx - 5, base - h * .45), { fill: t.fill, line: t.line, light: t.light, shade: t.dark });
  }

  function buildNear(th, W, name) {
    const H = 60, base = 59;
    const g = new Grid(W, H);
    const r = rng(name.length * 97 + 5);
    let x = 20;
    while (x < W - 20) {
      const k = r();
      if (name === 'ice') crystal(g, x, base, 14 + r() * 24, th);
      else if (name === 'night' && k < .3) { house(g, x - 10, base, th); x += 16; }
      else if (k < .16 && name !== 'ice') snowman(g, Math.round(x), base);
      else pine(g, x, base, 26 + r() * 26, th, r, r() < .4);
      x += 34 + r() * 46;
    }
    /* 수풀 같은 눈 더미 */
    const hump = wrap(W, (xx, yy) => yy > base - 3 && Math.sin(xx * .21) + Math.sin(xx * .07) > .9 - (yy - base + 3) * .4);
    g.part(hump, { fill: '#ffffff', line: th.hill.line, shade: th.ground.snowShade });
    return g.toCanvas();
  }

  /* 땅 위에 놓인 큰 선물 상자 발판들. 옛날 게임처럼 오른쪽·아래로 새까만 그림자가 진다 */
  const BOXES = [['#ffb8c8', '#e2383f'], ['#f4f4f4', '#3cb85a'], ['#a8f0b8', '#e2383f'], ['#a8d8ff', '#ffd23f'], ['#ffe08a', '#3a7ae8']];
  function buildProps(th, W, name) {
    const H = 60, base = 60;
    const g = new Grid(W, H);
    const r = rng(name.length * 53 + 9);
    const box = (x, y, w, h, [fill, rib]) => {
      g.rect(x + 3, y + 3, w, h, '#000');
      g.part(rect(x, y, x + w - 1, y + h - 1), { fill, line: INK });
      g.rect(x + 1, y + 1, w - 2, 1, '#ffffff');
      g.rect(x + Math.floor(w / 2) - 1, y, 3, h, rib); g.rect(x, y + Math.floor(h / 2) - 1, w, 3, rib);
      g.stamp(['##.##', '#.#.#', '.###.'], x + Math.floor(w / 2) - 2, y - 3, { '#': rib });
      [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].forEach(([dx, dy]) => g.set(x + dx, y + dy, INK));
    };
    let x = 30;
    while (x < W - 80) {
      const w1 = 28 + Math.floor(r() * 14), h1 = 22 + Math.floor(r() * 16);
      const c1 = BOXES[Math.floor(r() * BOXES.length)];
      box(x, base - h1, w1, h1, c1);
      if (r() < .55) {
        const w2 = 22 + Math.floor(r() * 10), h2 = 14 + Math.floor(r() * 10);
        box(x + w1 - 8, base - h2 - 6 - (r() < .5 ? 14 : 0), w2, h2, BOXES[Math.floor(r() * BOXES.length)]);
      }
      x += w1 + 90 + r() * 110;
    }
    return g.toCanvas();
  }

  function buildGround(th) {
    const W = 32, H = VH - GY;
    const g = new Grid(W, H);
    const c = th.ground;
    /* 벽돌 두 줄 (8칸씩), 엇갈려 쌓기 */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const row = Math.floor(y / 8), bx = (x + (row % 2) * 8) % 16, by = y % 8;
      let v = c.fill;
      if (by === 7 || bx === 15) v = c.line;
      else if (by === 0 || bx === 0) v = c.light;
      else if (by === 6 || bx === 14) v = c.dark;
      g.set(x, y, v);
    }
    /* 윗면 눈 */
    for (let x = 0; x < W; x++) {
      const d = 3 + ((x * 5) % 7 === 0 ? 2 : (x % 5 === 2 ? 1 : 0));
      for (let y = 0; y < d; y++) g.set(x, y, y === d - 1 ? c.snowShade : c.snow);
    }
    return g.toCanvas();
  }

  /* ---------- 월드 지도 ---------- */
  function buildMap(layout) {
    const g = new Grid(VW, VH);
    /* 바탕: 두 가지 눈색 바둑판 */
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
      g.set(x, y, x % 8 === 4 && y % 8 === 4 ? '#c8daf6' : '#e6f0ff');
    }
    const r = rng(19);
    (layout.islands || []).forEach((isl) => {
      const th = THEMES[isl.theme] || THEMES.day, c = th.island;
      const { x, y, w, h } = isl;
      /* 절벽(아랫면) */
      g.part(rrect(x, y + 4, x + w, y + h + 4, 3), { fill: c.cliff, line: INK, shade: c.cliffDark });
      for (let xx = x + 3; xx < x + w; xx += 4) g.rect(xx, y + h + 1, 1, 3, c.cliffDark);
      /* 윗면 */
      g.part(rrect(x, y, x + w, y + h, 3), { fill: c.fill, line: INK, light: c.light, shade: c.dark });
      /* 무늬 점 */
      const rr = rng(isl.x + 3);
      for (let i = 0; i < w * h / 26; i++) {
        const px = x + 3 + Math.floor(rr() * (w - 6)), py = y + 3 + Math.floor(rr() * (h - 6));
        g.set(px, py, c.light); g.set(px + 1, py, c.light);
      }
      /* 눈 더미 */
      for (let i = 0; i < 6; i++) {
        const sx = x + 6 + rr() * (w - 12), sy = y + 30 + rr() * (h - 40);
        g.part(ellipse(sx, sy, 3 + rr() * 3, 1.6 + rr()), { fill: '#ffffff', shade: '#c8dcf8' });
      }
      /* 길 */
      const pts = isl.path || [];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), y0 = Math.min(ay, by), y1 = Math.max(ay, by);
        g.rect(Math.round(x0) - 3, Math.round(y0) - 3, Math.round(x1 - x0) + 7, Math.round(y1 - y0) + 7, INK);
      }
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), y0 = Math.min(ay, by), y1 = Math.max(ay, by);
        g.rect(Math.round(x0) - 2, Math.round(y0) - 2, Math.round(x1 - x0) + 5, Math.round(y1 - y0) + 5, '#f6dc9a');
      }
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 0; k <= n; k += 4) g.set(Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n), '#d8a85a');
      }
      /* 출발 표지: 작은 오두막 */
      if (pts.length) {
        const [sx, sy] = pts[0];
        g.part(rect(sx - 5, sy - 4, sx + 5, sy + 4), { fill: '#e2383f', line: INK, shade: '#94162a', light: '#ff7b6e' });
        g.part(tri(sx - 7, sy - 3, sx + 7, sy - 3, sx, sy - 10), { fill: '#ffffff', line: INK, shade: '#c8d8f0' });
        g.part(rect(sx - 1, sy, sx + 1, sy + 4), { fill: '#5a2a14' });
      }
      /* 도착: 크리스마스 성 */
      if (pts.length > 1) {
        const [ex, ey] = pts[pts.length - 1];
        const bx = Math.round(ex), by = Math.round(ey) + 6;
        g.part(rect(bx - 9, by - 9, bx + 9, by), { fill: '#e8e8f8', line: INK, shade: '#a8a8c8', light: '#ffffff' });
        [-9, -4, 4, 8].forEach((dx) => g.part(rect(bx + dx - 1, by - 11, bx + dx + 1, by - 9), { fill: '#e8e8f8', line: INK }));
        g.part(rect(bx - 3, by - 15, bx + 3, by - 9), { fill: '#e8e8f8', line: INK, shade: '#a8a8c8' });
        g.part(tri(bx - 5, by - 15, bx + 5, by - 15, bx, by - 21), { fill: '#e2383f', line: INK, shade: '#94162a' });
        g.part(rect(bx - 2, by - 5, bx + 2, by), { fill: '#3a1a10', line: INK });
        g.part(ellipse(bx, by - 12, 1.4, 1.4), { fill: '#2a9a4a' });
        g.rect(bx, by - 24, 1, 3, INK); g.rect(bx + 1, by - 24, 3, 2, '#ffd23f');
      }
    });
    return g.toCanvas();
  }

  /* =====================================================================
     마리오식 스테이지 4종: 물속(water) · 하늘(sky) · 지하(cave) · 성(castle)
     원작 맵을 베끼지 않고 같은 분위기로 새로 그린 그림이다.
     각 스테이지는 { sky, strips: [{img, par, y, drift}], ground, fx } 로 만들어져
     draw() 에서 sky → strips(먼 것부터) → ground 순서로 찍힌다.
     fx: 화면에 떠다니는 알갱이. snow(눈) · bubble(물방울) · dust(반짝이 먼지) · ember(불티)
     ===================================================================== */
  const shadeHex = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
  };
  /* 벽돌 무늬 판 (cw×ch 벽돌, 줄마다 반 칸 엇갈림) */
  function brickWall(g, x0, y0, w, h, cw, ch, c) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const row = Math.floor((y - y0) / ch), bx = ((x - x0) + (row % 2) * (cw >> 1)) % cw, by = (y - y0) % ch;
      let v = c.fill;
      if (by === ch - 1 || bx === cw - 1) v = c.line;
      else if (by === 0 || bx === 0) v = c.light;
      else if (c.dark && (by === ch - 2 || bx === cw - 2)) v = c.dark;
      g.set(((x % g.w) + g.w) % g.w, y, v);
    }
  }
  function blockGround(c, top) {
    const Wd = 32, H = VH - GY;
    const g = new Grid(Wd, H);
    brickWall(g, 0, 0, Wd, H, 16, 8, c);
    if (top) for (let x = 0; x < Wd; x++) {
      const d = 2 + ((x * 5) % 7 === 0 ? 1 : 0);
      for (let y = 0; y < d; y++) g.set(x, y, y === d - 1 ? top.shade : top.fill);
    }
    return g.toCanvas();
  }

  /* ---------- 물속 ---------- */
  function buildWater() {
    const sky = (() => {
      const g = new Grid(VW, VH);
      const bands = [['#4aa0f4', 0], ['#3a88e2', 30], ['#2c70cc', 66], ['#2058b2', 100], ['#18469a', 128]];
      for (let y = 0; y < VH; y++) {
        let i = 0;
        while (i < bands.length - 1 && y >= bands[i + 1][1]) i++;
        for (let x = 0; x < VW; x++) {
          const nx = bands[i + 1];
          g.set(x, y, nx && y >= nx[1] - 3 && (x + y) % 2 === 0 ? nx[0] : bands[i][0]);
        }
      }
      /* 물 위 표면의 물결 */
      for (let x = 0; x < VW; x++) {
        const d = 3 + Math.round(Math.sin(x * .25) * 1.3);
        for (let y = 0; y < d; y++) g.set(x, y, y === d - 1 ? '#c8f0ff' : '#8ad4ff');
      }
      /* 비스듬히 내려오는 햇살 (바둑판 점) */
      [30, 96, 170, 250].forEach((rx, k) => {
        for (let y = 4; y < 118; y++) for (let x = 0; x < VW; x++) {
          const d = x - rx - y * .42;
          if (d >= 0 && d < 7 + k % 2 * 3 && (x + y) % 2 === 0 && y < 118 - d * 4) g.set(x, y, shadeHex(g.get(x, y) || '#2c70cc', .16));
        }
      });
      return g.toCanvas();
    })();
    const far = buildFar({ far: { fill: '#1c4c9c', snow: '#1c4c9c', line: '#163e84' } }, 320);
    const fish = (() => {
      const Wd = 480, g = new Grid(Wd, 70), r = rng(23);
      for (let s = 0; s < 5; s++) {
        const cx = 40 + s * 92 + r() * 30, cy = 10 + r() * 46, n = 3 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          const x = cx + k * 9 + r() * 4, y = cy + (k % 2) * 6 + r() * 3;
          g.part(any(ellipse(x, y, 4, 2.2), tri(x + 3, y, x + 7, y - 3, x + 7, y + 3)), { fill: '#1a4690' });
          g.set(Math.round(x - 2), Math.round(y - 1), '#4a88d8');
        }
      }
      return g.toCanvas();
    })();
    const dunes = buildHills({ hill: { fill: '#1e5c96', light: '#2c74b0', dark: '#174a7c', line: '#0c2c52', snow: null, snowShade: null } }, 384, 41);
    const reef = (() => {
      const Wd = 512, H = 70, base = 69, g = new Grid(Wd, H), r = rng(77);
      const CORAL = [['#ff6a8a', '#ffb0c0', '#c03a5a'], ['#ff9a3a', '#ffd08a', '#c0601a'], ['#c87af0', '#ecc0ff', '#8a3ab8']];
      for (let x = 14; x < Wd - 14; x += 26 + r() * 30) {
        if (r() < .55) {
          /* 해초: 물결처럼 흔들리는 줄기 */
          const h = 24 + r() * 36;
          for (let k = 0; k < 2; k++) {
            const sx = x + k * 5;
            for (let y = base; y > base - h + k * 6; y--) {
              const xx = Math.round(sx + Math.sin(y * .28 + k) * 2);
              g.set(xx, y, '#0e5a3a'); g.set(xx + 1, y, '#2aa060'); g.set(xx + 2, y, '#0e5a3a');
              if (y % 7 === 0) g.set(xx + 3, y - 1, '#5ad08a');
            }
          }
        } else {
          /* 산호: 동글동글 뭉친 가지 */
          const [fill, light, dark] = CORAL[Math.floor(r() * CORAL.length)];
          const h = 12 + r() * 14, w = 8 + r() * 6;
          const blobs = [ellipse(x, base - h * .4, w * .5, h * .45)];
          for (let k = 0; k < 4; k++) blobs.push(ellipse(x + (k - 1.5) * w * .45, base - h * (.6 + (k % 2) * .3), 3 + r() * 2, 3 + r() * 2));
          g.part(any(...blobs), { fill, light, shade: dark, line: '#0c2c52' });
        }
      }
      return g.toCanvas();
    })();
    return {
      sky, fx: 'bubble',
      strips: [
        { img: far, par: .08, y: GY - 100 },
        { img: fish, par: .15, y: 20, drift: -6 },
        { img: dunes, par: .3, y: GY - 70 },
        { img: reef, par: .7, y: GY - 70 }
      ],
      ground: blockGround({ fill: '#d8b070', light: '#f6d898', dark: '#b08848', line: '#5a3a14' }, { fill: '#f6e6b0', shade: '#d8c07a' })
    };
  }

  /* ---------- 하늘 ---------- */
  function buildSkyStage() {
    const sky = buildSky({ sky: [['#4aa8ff', 0], ['#68baff', 40], ['#8acaff', 80], ['#acdcff', 112]] }, 'skyland');
    const puff = (g, x, y, s, c) => g.part(any(ellipse(x, y + 4, 16 * s, 7 * s), ellipse(x - 9 * s, y + 3, 8 * s, 6 * s), ellipse(x + 2 * s, y - 1, 9 * s, 8 * s), ellipse(x + 11 * s, y + 3, 8 * s, 6 * s)), c);
    /* 저 아래 깔린 구름 바다 */
    const sea = (() => {
      const Wd = 320, H = 46, g = new Grid(Wd, H), r = rng(5);
      const bumps = [];
      for (let x = 0; x < Wd; x += 14 + r() * 12) bumps.push([x, 10 + r() * 12, 10 + r() * 8]);
      g.part(wrap(Wd, (x, y) => y > 30 || bumps.some(([cx, cy, rr]) => (x - cx) ** 2 + ((y - cy) * 1.5) ** 2 < rr * rr + (y - cy > 0 ? 400 : 0))), { fill: '#f4faff', line: '#9ac8ee', shade: '#d4eaff', shadeW: 2 });
      return g.toCanvas();
    })();
    /* 멀리 떠 있는 작은 눈섬 */
    const isles = (() => {
      const Wd = 480, H = 70, g = new Grid(Wd, H), r = rng(31);
      for (let x = 40; x < Wd - 40; x += 110 + r() * 60) {
        const y = 18 + r() * 30, w = 12 + r() * 10;
        g.part(tri(x - w, y, x + w, y, x, y + w * 1.1), { fill: '#8a5a34', line: '#3a2410', shade: '#5a3418' });
        g.part(ellipse(x, y, w + 1, 3.2), { fill: '#ffffff', line: '#3a2410', shade: '#cfe6ff' });
        g.part(tri(x - 4, y - 1, x + 4, y - 1, x, y - 13), { fill: '#2a9a54', line: '#0f3a1a', light: '#5ac87a' });
        g.set(Math.round(x), Math.round(y - 13), '#ffffff');
      }
      return g.toCanvas();
    })();
    const clouds = buildClouds({ cloud: { fill: '#ffffff', shade: '#e4f2ff', line: '#6aa4d8' } }, 480, 'skyland');
    /* 버섯 발판 (원작 하늘 맵의 큰 버섯 같은 느낌) */
    const shrooms = (() => {
      const Wd = 512, H = 90, base = 90, g = new Grid(Wd, H), r = rng(53);
      const CAPS = [['#e2383f', '#ff8a8a', '#94162a'], ['#3cb85a', '#8ef08a', '#1d7034'], ['#ff9a1f', '#ffd07a', '#b8580a']];
      for (let x = 30; x < Wd - 30; x += 70 + r() * 70) {
        const h = 30 + r() * 46, w = 14 + r() * 10;
        const [fill, light, dark] = CAPS[Math.floor(r() * CAPS.length)];
        g.part(rect(x - 3, base - h, x + 3, base), { fill: '#f0dcb0', line: INK, shade: '#c8a878' });
        g.part((xx, yy) => yy <= base - h + 1 && ((xx - x) / w) ** 2 + ((yy - (base - h + 1)) / 8) ** 2 <= 1, { fill, line: INK, light, shade: dark });
        for (let k = -1; k <= 1; k++) g.part(ellipse(x + k * w * .55, base - h - 3 + Math.abs(k) * 2, 2.2, 1.6), { fill: '#ffffff' });
      }
      return g.toCanvas();
    })();
    /* 땅 = 폭신한 구름 블록 */
    const ground = (() => {
      const Wd = 32, H = VH - GY, g = new Grid(Wd, H);
      for (let x = 0; x < Wd; x++) {
        const d = (x % 16) - 7.5, top = Math.round(8 - Math.sqrt(Math.max(0, 64 - d * d)) * .85);
        for (let y = top; y < H; y++) {
          let v = '#ffffff';
          if (y === top) v = '#7ab4e4';
          else if (y === top + 1 && Math.abs(d) > 3) v = '#ffffff';
          else if (y > H - 4) v = '#c4e0fa';
          else if (y > top + 6 && (x + y) % 4 === 0) v = '#e2f0ff';
          g.set(x, y, v);
        }
      }
      return g.toCanvas();
    })();
    return {
      sky, fx: 'snow',
      strips: [
        { img: isles, par: .08, y: 10 },
        { img: clouds, par: .2, y: 6, drift: 3 },
        { img: sea, par: .3, y: GY - 46 },
        { img: shrooms, par: .65, y: GY - 90 }
      ],
      ground
    };
  }

  /* ---------- 지하 (얼음 동굴) ---------- */
  function buildCave() {
    const sky = (() => {
      const g = new Grid(VW, VH);
      g.rect(0, 0, VW, VH, '#06081c');
      return g.toCanvas();
    })();
    /* 뒤쪽 어두운 벽돌 벽 */
    const wall = (() => {
      const g = new Grid(64, GY);
      brickWall(g, 0, 0, 64, GY, 16, 8, { fill: '#0e1638', light: '#152050', line: '#070b20' });
      return g.toCanvas();
    })();
    /* 벽돌 기둥 */
    const pillars = (() => {
      const Wd = 480, g = new Grid(Wd, GY), r = rng(61);
      for (let x = 20; x < Wd - 30; x += 70 + r() * 80) {
        const w = 14 + Math.floor(r() * 3) * 4;
        brickWall(g, Math.round(x), 0, w, GY, 8, 4, { fill: '#1a3a8a', light: '#2e56b8', dark: '#132c6a', line: '#081440' });
        for (let y = 0; y < GY; y++) { g.set(Math.round(x) - 1, y, INK); g.set(Math.round(x) + w, y, INK); }
      }
      return g.toCanvas();
    })();
    /* 천장: 파란 벽돌 줄 + 고드름 */
    const ceiling = (() => {
      const Wd = 512, g = new Grid(Wd, 40), r = rng(3);
      brickWall(g, 0, 0, Wd, 8, 8, 4, { fill: '#2a5ad0', light: '#6a9aff', dark: '#1a3a90', line: '#081440' });
      for (let x = 0; x < Wd; x += 5 + Math.floor(r() * 9)) {
        const len = 6 + r() * 22, w = 2 + r() * 3;
        g.part(tri(x - w, 7, x + w, 7, x, 7 + len), { fill: '#9ae8ff', line: '#0e3a52', light: '#ffffff', shade: '#5ac0e0' });
      }
      return g.toCanvas();
    })();
    /* 바닥의 얼음 결정과 돌기둥 */
    const crystals = (() => {
      const Wd = 512, H = 60, base = 59, g = new Grid(Wd, H), r = rng(19);
      const th = { tree: { fill: '#5ad0f0', light: '#c8f6ff', dark: '#2a8ab0', line: '#0a2c40' } };
      for (let x = 24; x < Wd - 24; x += 40 + r() * 50) {
        if (r() < .75) crystal(g, Math.round(x), base, 12 + r() * 22, th);
        else g.part(tri(x - 7, base, x + 7, base, x, base - 18 - r() * 14), { fill: '#3a4a7a', line: INK, light: '#5a6aa0', shade: '#242e54' });
      }
      return g.toCanvas();
    })();
    return {
      sky, fx: 'dust',
      strips: [
        { img: wall, par: .08, y: 0 },
        { img: pillars, par: .3, y: 0 },
        { img: crystals, par: .7, y: GY - 59 },
        { img: ceiling, par: .7, y: 0 }
      ],
      ground: blockGround({ fill: '#2a5ad0', light: '#6a9aff', dark: '#1a3a90', line: '#081440' }, { fill: '#cfeeff', shade: '#7ab8e8' })
    };
  }

  /* ---------- 성 (난이도 '상' = 월드의 마지막 관문). tint = 분야 색 (깃발·창문 빛) ---------- */
  function buildCastle(tint) {
    tint = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : '#e2383f';
    const sky = (() => {
      const g = new Grid(VW, VH);
      g.rect(0, 0, VW, VH, '#120a16');
      return g.toCanvas();
    })();
    /* 돌벽 + 아치 창문 + 분야 색 깃발 */
    const wall = (() => {
      const Wd = 320, g = new Grid(Wd, GY);
      brickWall(g, 0, 0, Wd, GY, 16, 8, { fill: '#2e2838', light: '#3c3448', line: '#16121e' });
      const glow = shadeHex(tint, -.45), glow2 = shadeHex(tint, -.2);
      for (let x = 40; x < Wd; x += 80) {
        const top = 40, bot = 92;
        g.part(any(rect(x - 11, top + 10, x + 11, bot), ellipse(x, top + 10, 11, 11)), { fill: glow, line: '#08060c', light: glow2 });
        for (let y = top; y < bot; y++) { g.set(x - 4, y, '#08060c'); g.set(x + 4, y, '#08060c'); }
        g.rect(x - 11, top + 26, 23, 1, '#08060c');
        g.part(ellipse(x + 5, top + 6, 2.4, 2.4), { fill: '#fff6c8' });
        /* 깃발 */
        const bx = x + 40;
        g.part(any(rect(bx - 9, 0, bx + 9, 44), tri(bx - 9, 44, bx + 9, 44, bx, 34)), { fill: tint, line: '#08060c', light: shadeHex(tint, .3), shade: shadeHex(tint, -.35) });
        g.stamp(['#.#.#', '#####', '#####'], bx - 2, 16, { '#': '#ffd23f' });
      }
      return g.toCanvas();
    })();
    /* 뒤쪽 용암 */
    const lava = (() => {
      const Wd = 128, H = 24, g = new Grid(Wd, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
        const top = 6 + Math.round(Math.sin(x * .19) * 2 + Math.sin(x * .07) * 1.5);
        if (y < top) continue;
        g.set(x, y, y === top ? '#ffe07a' : y < top + 3 ? '#ff9a2a' : (x + y) % 5 === 0 ? '#ff6a1a' : '#d03a10');
      }
      [[20, 14], [70, 17], [104, 12]].forEach(([x, y]) => g.part(ellipse(x, y, 2.2, 1.6), { fill: '#ffd23f' }));
      return g.toCanvas();
    })();
    /* 앞쪽 기둥 + 횃불, 위에서 늘어진 사슬 */
    const pillars = (() => {
      const Wd = 512, g = new Grid(Wd, GY), r = rng(83);
      for (let x = 50; x < Wd - 30; x += 120 + r() * 60) {
        const w = 18;
        brickWall(g, Math.round(x), 8, w, GY - 8, 9, 6, { fill: '#5a5468', light: '#7a7488', dark: '#46405a', line: '#1a1622' });
        g.part(rect(x - 3, 0, x + w + 3, 8), { fill: '#6a6478', line: '#1a1622', light: '#8a8498' });
        for (let y = 8; y < GY; y++) { g.set(Math.round(x) - 1, y, '#08060c'); g.set(Math.round(x) + w, y, '#08060c'); }
        /* 횃불 */
        const tx = Math.round(x + w / 2), ty = 62;
        g.part(rect(tx - 2, ty, tx + 2, ty + 8), { fill: '#6a4a2a', line: '#08060c' });
        g.part(any(ellipse(tx, ty - 3, 4, 5), tri(tx - 3, ty - 4, tx + 3, ty - 4, tx, ty - 14)), { fill: '#ff8a1a', line: '#7a1a0a', shade: '#e2383f' });
        g.part(ellipse(tx, ty - 3, 2, 3), { fill: '#ffe07a' });
      }
      /* 사슬 */
      for (let x = 20; x < Wd; x += 90 + Math.floor(r() * 40)) {
        const len = 20 + Math.floor(r() * 26);
        for (let y = 0; y < len; y++) {
          const k = y % 4;
          if (k === 0 || k === 3) g.set(x, y, '#8a8498');
          else { g.set(x - 1, y, '#8a8498'); g.set(x + 1, y, '#5a5468'); }
        }
      }
      return g.toCanvas();
    })();
    return {
      sky, fx: 'ember',
      strips: [
        { img: wall, par: .1, y: 0 },
        { img: lava, par: .3, y: GY - 22, drift: 2 },
        { img: pillars, par: .7, y: 0 }
      ],
      ground: blockGround({ fill: '#8a8496', light: '#c4c0d0', dark: '#5e586c', line: '#1a1622' }, null)
    };
  }
  const STAGE_BUILD = { water: buildWater, sky: buildSkyStage, cave: buildCave, castle: buildCastle };

  /* ---------- 상태 ---------- */
  const W = { cv: null, g: null, mode: 'side', theme: 'day', tint: null, fx: 'snow', cam: 0, vel: 0, pan: null, layers: {}, map: null, snow: [], t: 0, last: 0, shake: 0 };
  const LAYER_W = { far: 320, hills: 384, clouds: 480, near: 512 };

  function layers(name, tint) {
    if (STAGE_BUILD[name]) {
      const k = name + (name === 'castle' ? `|${tint || ''}` : '');
      return W.layers[k] || (W.layers[k] = STAGE_BUILD[name](tint));
    }
    if (W.layers[name]) return W.layers[name];
    const th = THEMES[name] || THEMES.day;
    return (W.layers[name] = {
      sky: buildSky(th, name),
      far: buildFar(th, LAYER_W.far),
      hills: buildHills(th, LAYER_W.hills, name.length * 13 + 1),
      hills2: buildHills({ ...th, hill: { ...th.hill, fill: th.hill.light, light: th.hill.light, dark: th.hill.fill } }, LAYER_W.hills, name.length * 31 + 7),
      clouds: buildClouds(th, LAYER_W.clouds, name),
      near: buildNear(th, LAYER_W.near, name),
      props: buildProps(th, 640, name),
      ground: buildGround(th),
      stars: name === 'night' ? Array.from({ length: 50 }, (_, i) => [(i * 73) % VW, (i * 37) % 110, i % 5]) : null
    });
  }

  let SG = null, SCAM = 0; /* 지금 그리는 캔버스와 카메라 (화면 또는 미리보기 그림) */
  function strip(img, par, y, drift = 0) {
    const w = img.width;
    let x = -(((SCAM * par + drift) % w) + w) % w;
    for (; x < VW; x += w) SG.drawImage(img, Math.round(x), y);
  }
  /* 옆 스크롤 스테이지 한 장면을 g 에 그린다 */
  function paintScene(g, theme, tint, cam, t, trees, props) {
    SG = g; SCAM = cam;
    if (STAGE_BUILD[theme]) {
      const L = layers(theme, tint);
      g.drawImage(L.sky, 0, 0);
      L.strips.forEach((s) => strip(s.img, s.par, s.y, s.drift ? t * s.drift : 0));
      strip(L.ground, 1, GY);
      return;
    }
    const L = layers(theme);
    g.drawImage(L.sky, 0, 0);
    if (L.stars) L.stars.forEach(([x, y, k]) => {
      const on = Math.floor(t * 2 + k * 1.7) % 5 !== 0;
      g.fillStyle = on ? '#ffffff' : '#8a8ad0';
      g.fillRect(((x - cam * .05) % VW + VW) % VW, y, 1, 1);
      if (k === 0 && on) { g.fillRect(((x - cam * .05) % VW + VW) % VW - 1, y, 3, 1); g.fillRect(((x - cam * .05) % VW + VW) % VW, y - 1, 1, 3); }
    });
    strip(L.far, .08, GY - 100);
    strip(L.clouds, .2, theme === 'ice' ? 0 : 6, theme === 'ice' ? 0 : t * 3);
    strip(L.hills2, .25, GY - 82);
    g.fillStyle = (THEMES[theme] || THEMES.day).hill.fill;
    g.fillRect(0, GY - 14, VW, 14);
    strip(L.hills, .4, GY - 66);
    if (trees !== false) strip(L.near, .7, GY - 59);
    if (props !== false) strip(L.props, 1, GY - 60);
    strip(L.ground, 1, GY);
  }

  function draw() {
    const g = W.g;
    if (W.mode === 'map' && W.map) g.drawImage(W.map, 0, 0);
    else paintScene(g, W.theme, W.tint, W.cam, W.t, W.trees, W.props);
    /* 떠다니는 알갱이: 눈 / 물방울 / 먼지 / 불티 */
    const fx = W.mode === 'map' ? 'snow' : W.fx;
    W.snow.forEach((f, i) => {
      const x = Math.round(((f.x - (W.mode === 'map' ? 0 : W.cam * f.z * .3)) % VW + VW) % VW), y = Math.round(f.y);
      if (fx === 'bubble') {
        if (i % 3) return;
        const big = f.z > .7;
        g.globalAlpha = .85;
        g.fillStyle = '#d8f4ff';
        if (big) { g.fillRect(x, y - 1, 2, 1); g.fillRect(x - 1, y, 1, 2); g.fillRect(x + 2, y, 1, 2); g.fillRect(x, y + 2, 2, 1); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); }
        else g.fillRect(x, y, 1, 1);
      } else if (fx === 'ember') {
        if (i % 2) return;
        g.globalAlpha = Math.max(0, Math.min(1, (y - 20) / 80));
        g.fillStyle = f.z > .6 ? '#ffd23f' : '#ff7a2a';
        g.fillRect(x, y, 1, f.z > .85 ? 2 : 1);
      } else if (fx === 'dust') {
        if (i % 2) return;
        g.globalAlpha = .35 + .4 * Math.abs(Math.sin(W.t * 2 + f.p));
        g.fillStyle = f.z > .5 ? '#9ad8ff' : '#5a8ad8';
        g.fillRect(x, y, 1, 1);
      } else {
        g.fillStyle = '#ffffff';
        g.globalAlpha = f.z > .7 ? 1 : .75;
        g.fillRect(x, y, f.z > .85 ? 2 : 1, f.z > .85 ? 2 : 1);
      }
    });
    g.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(.05, (now - (W.last || now)) / 1000);
    W.last = now;
    W.t += dt;
    if (W.pan) {
      const p = Math.min(1, (now - W.pan.start) / W.pan.ms);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      W.cam = W.pan.from + (W.pan.to - W.pan.from) * e;
      if (p >= 1) W.pan = null;
    } else W.cam += W.vel * dt;
    const fx = W.mode === 'map' ? 'snow' : W.fx;
    W.snow.forEach((f) => {
      if (fx === 'bubble' || fx === 'ember') {
        /* 아래에서 위로 올라간다 */
        f.y -= (fx === 'bubble' ? 10 + f.z * 18 : 6 + f.z * 12) * dt;
        f.x += Math.sin(W.t * 2 + f.p) * (fx === 'bubble' ? 8 : 5) * dt;
        if (f.y < -2) { f.y = GY + Math.random() * 6; f.x = Math.random() * VW; }
      } else if (fx === 'dust') {
        f.y += Math.sin(W.t * .7 + f.p) * 2 * dt;
        f.x += (1 + f.z * 2) * dt;
        if (f.y > GY || f.y < 0) f.y = Math.random() * GY;
      } else {
        f.y += (8 + f.z * 14) * dt;
        f.x += Math.sin(W.t * 1.3 + f.p) * 4 * dt * f.z;
        if (f.y > VH) { f.y = -2; f.x = Math.random() * VW; }
      }
    });
    draw();
    requestAnimationFrame(frame);
  }

  const World = {
    VW, VH, GY, THEMES,
    init(canvas, snowAmount) {
      W.cv = canvas; canvas.width = VW; canvas.height = VH;
      W.g = canvas.getContext('2d');
      W.g.imageSmoothingEnabled = false;
      const n = Math.max(0, Math.min(400, snowAmount == null ? 120 : snowAmount));
      for (let i = 0; i < n; i++) W.snow.push({ x: Math.random() * VW, y: Math.random() * VH, z: Math.random(), p: Math.random() * 6 });
      Object.keys(THEMES).forEach((k) => setTimeout(() => layers(k), 50));
      ['water', 'sky', 'cave'].forEach((k) => setTimeout(() => layers(k), 120));
      requestAnimationFrame(frame);
    },
    /* 옆 스크롤 스테이지 */
    side(theme, { vel = 0, props = true, trees = true, tint = null } = {}) {
      W.mode = 'side'; W.theme = THEMES[theme] || STAGE_BUILD[theme] ? theme : 'day'; W.tint = tint;
      W.fx = STAGE_BUILD[W.theme] ? layers(W.theme, tint).fx : 'snow';
      if (W.fx !== 'snow') W.snow.forEach((f) => { f.y = Math.random() * GY; });
      W.vel = vel; W.pan = null; W.props = props; W.trees = trees;
    },
    /* 카메라를 dx 칸만큼 부드럽게 옮긴다 */
    pan(dx, ms = 1200) { W.vel = 0; W.pan = { from: W.cam, to: W.cam + dx, start: performance.now(), ms }; },
    speed(v) { W.vel = v; W.pan = null; },
    /* 스테이지 한 부분을 잘라 그림 주소(dataURL)로. 파이프 판의 탑 배경에 쓴다 (칸 단위) */
    snapshot(theme, { tint = null, cam = 0, x = 0, y = 0, w = VW, h = VH, trees = true, props = false } = {}) {
      const c = document.createElement('canvas');
      c.width = VW; c.height = VH;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      paintScene(g, THEMES[theme] || STAGE_BUILD[theme] ? theme : 'day', tint, cam, 0, trees, props);
      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      out.getContext('2d').drawImage(c, x, y, w, h, 0, 0, w, h);
      return out.toDataURL();
    },
    /* 월드 지도. layout.islands = [{x,y,w,h,theme,path:[[x,y],...]}] (칸 단위) */
    map(layout) { W.mode = 'map'; W.vel = 0; W.pan = null; W.map = buildMap(layout); }
  };

  /* ================= 효과: 동전, 반짝이, 불꽃놀이 ================= */
  const FX = { cv: null, g: null, list: [] };
  const COLORS = ['#ff3a4a', '#ffd23f', '#4ab0ff', '#7af07a', '#ff8ad0', '#ffffff'];
  function fxFrame(now) {
    const g = FX.g;
    const dt = Math.min(.05, (now - (FX.last || now)) / 1000);
    FX.last = now;
    g.clearRect(0, 0, VW, VH);
    FX.list = FX.list.filter((p) => {
      p.age += dt;
      if (p.age > p.life) return false;
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'coin') {
        const fr = window.Pixel.sprites.coin()[Math.floor(p.age * 16) % 4];
        g.drawImage(fr, Math.round(p.x - 4), Math.round(p.y - 6));
      } else if (p.kind === 'img') {
        g.drawImage(p.img, Math.round(p.x - p.img.width / 2), Math.round(p.y - p.img.height / 2));
      } else if (p.kind === 'spark') {
        const k = 1 - p.age / p.life, s = k > .5 ? 2 : 1;
        g.fillStyle = p.color;
        g.fillRect(Math.round(p.x) - s, Math.round(p.y), s * 2 + 1, 1);
        g.fillRect(Math.round(p.x), Math.round(p.y) - s, 1, s * 2 + 1);
      } else if (p.kind === 'brick') {
        g.fillStyle = p.color;
        g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
        g.fillStyle = INK; g.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 2, 1, 1);
      } else if (p.kind === 'puff') {
        /* 흙먼지(눈보라) 한 덩이: 커지면서 옅어진다 */
        const k = p.age / p.life, r = 1 + Math.floor(k * 3);
        g.fillStyle = k < .5 ? '#ffffff' : '#d8e8ff';
        g.globalAlpha = 1 - k * .7;
        const cx = Math.round(p.x), cy = Math.round(p.y);
        g.fillRect(cx - r, cy - r + 1, r * 2 + 1, r * 2 - 1);
        g.fillRect(cx - r + 1, cy - r, r * 2 - 1, r * 2 + 1);
        g.globalAlpha = 1;
      } else if (p.kind === 'rocket') {
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 2);
        if (p.vy >= -10) { p.life = 0; burst(p.x, p.y, p.color); }
      } else {
        g.fillStyle = p.color;
        if (Math.floor(p.age * 20) % 3 !== 0 || p.age < p.life * .6) g.fillRect(Math.round(p.x), Math.round(p.y), p.size || 1, p.size || 1);
      }
      return true;
    });
    requestAnimationFrame(fxFrame);
  }
  const v = (n) => n / 6; /* 화면 픽셀 → 칸 */
  function burst(x, y, color) {
    const c = color || COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2, sp = 40 + Math.random() * 14;
      FX.list.push({ kind: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 30, age: 0, life: 1.1, color: i % 3 ? c : '#ffffff' });
    }
  }
  const Fx = {
    init(canvas) {
      FX.cv = canvas; canvas.width = VW; canvas.height = VH;
      FX.g = canvas.getContext('2d');
      requestAnimationFrame(fxFrame);
    },
    coin(x, y) { FX.list.push({ kind: 'coin', x: v(x), y: v(y), vx: 0, vy: -150, grav: 420, age: 0, life: .62 }); setTimeout(() => Fx.sparks(x, y - 150, 8), 600); },
    item(img, x, y) { FX.list.push({ kind: 'img', img, x: v(x), y: v(y), vx: 0, vy: -90, grav: 120, age: 0, life: 1.1 }); },
    sparks(x, y, n = 14, color) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 50;
        FX.list.push({ kind: 'spark', x: v(x), y: v(y), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 0, age: 0, life: .4 + Math.random() * .4, color: color || COLORS[i % COLORS.length] });
      }
    },
    bricks(x, y, color = '#d0702e') {
      [[-40, -120], [40, -120], [-30, -70], [30, -70]].forEach(([vx, vy]) => FX.list.push({ kind: 'brick', x: v(x), y: v(y), vx, vy, grav: 400, age: 0, life: 1.2, color }));
    },
    firework(x, y) {
      FX.list.push({ kind: 'rocket', x: v(x), y: VH, vx: (Math.random() - .5) * 10, vy: -Math.sqrt(2 * 120 * (VH - v(y))), grav: 120, age: 0, life: 3, color: COLORS[Math.floor(Math.random() * 5)] });
    },
    confetti(n = 80) {
      for (let i = 0; i < n; i++) FX.list.push({ kind: 'dot', x: Math.random() * VW, y: -Math.random() * 40, vx: (Math.random() - .5) * 20, vy: 20 + Math.random() * 30, grav: 6, age: 0, life: 6, color: COLORS[i % COLORS.length], size: 2 });
    },
    /* 착지·달리기 먼지. trail=true 면 한 덩이만 뒤로 */
    dust(x, y, trail) {
      const n = trail ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const d = trail ? 0 : (i ? 1 : -1);
        FX.list.push({ kind: 'puff', x: v(x) + d * 5, y: v(y) - 2, vx: d * 14, vy: -6, grav: 0, age: 0, life: .35 });
      }
    },
    /* 마우스 자리에서 떨어지는 눈송이 */
    flakes(x, y, n = 2) {
      for (let i = 0; i < n; i++) FX.list.push({ kind: 'dot', x: v(x) + (Math.random() - .5) * 4, y: v(y) + 2, vx: (Math.random() - .5) * 14, vy: 6 + Math.random() * 14, grav: 8, age: 0, life: 1.2 + Math.random() * .8, color: i % 3 ? '#ffffff' : '#d8ecff', size: Math.random() < .3 ? 2 : 1 });
    },
    clear() { FX.list = []; }
  };

  window.World = World;
  window.Fx = Fx;
})();
