/* 도트 그림 도구 + 그림 모음.
   화면 전체가 가로 320 × 세로 180 칸짜리 옛날 게임기 화면이라고 보고, 한 칸을 6픽셀로 키워 1920×1080 에 그린다.
   그래서 배경, 블록, 캐릭터, 효과가 모두 같은 크기의 네모 점으로 맞물린다. */
(function () {
  const P = 6; /* 화면 한 칸 = 6픽셀 */

  /* ---------- 색 ---------- */
  const rgbCache = {};
  function rgba(c) {
    if (rgbCache[c]) return rgbCache[c];
    let r = 0, g = 0, b = 0, a = 255;
    if (c[0] === '#') {
      const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16);
    } else {
      const m = c.match(/[\d.]+/g).map(Number);
      [r, g, b] = m; a = m[3] == null ? 255 : Math.round(m[3] * 255);
    }
    return (rgbCache[c] = [r, g, b, a]);
  }

  /* ---------- 격자 ---------- */
  class Grid {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
    get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
    set(x, y, v) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = v; return this; }
    rect(x0, y0, w, h, v) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, v); return this; }
    /* 도형 하나를 칠한다. line: 바깥 윤곽선, shade: 아래·오른쪽 그림자, light: 위·왼쪽 밝은 테 */
    part(test, { fill, line, shade, light, shadeW = 1 } = {}) {
      const { w, h } = this;
      const m = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (test(x + .5, y + .5)) m[y * w + x] = 1;
      const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      if (line) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (inside(x, y)) continue;
          if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) this.set(x, y, line);
        }
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!inside(x, y)) continue;
        let v = fill;
        let edgeLo = false;
        for (let k = 1; k <= shadeW; k++) if (!inside(x, y + k) || !inside(x + k, y)) edgeLo = true;
        if (shade && edgeLo) v = shade;
        else if (light && (!inside(x, y - 1) || !inside(x - 1, y))) v = light;
        this.set(x, y, v);
      }
      return this;
    }
    /* 문자열 그림: 한 글자 = 한 칸. map 에 없는 글자는 비워 둔다 */
    stamp(rows, x0, y0, map) {
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) this.set(x0 + i, y0 + j, map[ch]); }));
      return this;
    }
    toCanvas(canvas) {
      const c = canvas || document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      const g = c.getContext('2d');
      const img = g.createImageData(this.w, this.h);
      for (let i = 0; i < this.c.length; i++) {
        const v = this.c[i];
        if (!v) continue;
        const [r, gg, b, a] = rgba(v);
        img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = a;
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    toDataURL() { return this.toCanvas().toDataURL(); }
  }

  /* 도형 판정 */
  const ellipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const tri = (ax, ay, bx, by, cx, cy) => (x, y) => {
    const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
    const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
    const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const any = (...fs) => (x, y) => fs.some((f) => f(x, y));
  const not = (f, g) => (x, y) => f(x, y) && !g(x, y);
  /* 모서리가 한 칸씩 깎인 네모 */
  const rrect = (x0, y0, x1, y1, r = 1) => (x, y) => {
    if (!(x >= x0 && x <= x1 && y >= y0 && y <= y1)) return false;
    const dx = Math.max(x0 + r - x, x - (x1 - r), 0), dy = Math.max(y0 + r - y, y - (y1 - r), 0);
    return dx + dy <= r + .5;
  };

  /* ================= 그림 모음 =================
     모두 코드로 찍은 그림이라 따로 넣을 이미지 파일이 없다. */
  const INK = '#1a1020';
  const S = {};
  const cache = {};
  const once = (name, fn) => () => cache[name] || (cache[name] = fn());

  /* 블록 테두리 공통: 바깥 검은 선, 위·왼쪽 밝게, 아래·오른쪽 어둡게, 네 귀퉁이 못 */
  function block(size, { fill, light, dark, rivet = INK }) {
    const g = new Grid(size, size);
    g.part(rrect(.5, .5, size - 1.5, size - 1.5, 1), { fill, line: INK, shade: dark, light });
    g.part(rrect(1, 1, size - 2, size - 2, 1), { fill, shade: dark, light, shadeW: 1 });
    [[2, 2], [size - 3, 2], [2, size - 3], [size - 3, size - 3]].forEach(([x, y]) => g.set(x, y, rivet));
    return g;
  }

  /* 선물 블록: 문제 정답을 꺼내는 블록. 빨간 상자에 금빛 리본, 가운데 반짝 별 */
  S.giftBlock = once('giftBlock', () => {
    const g = block(16, { fill: '#e2383f', light: '#ff7b6e', dark: '#9c1b2a' });
    g.rect(7, 1, 2, 14, '#ffd23f');
    g.rect(1, 7, 14, 2, '#ffd23f');
    g.set(7, 1, '#fff2a8'); g.set(1, 7, '#fff2a8');
    g.rect(9, 7, 6, 1, '#ffd23f');
    g.rect(8, 9, 1, 6, '#d99a14'); g.rect(9, 8, 6, 1, '#d99a14');
    g.stamp(['..#..', '.###.', '#####', '.###.', '.#.#.'], 6, 5, { '#': '#ffffff' });
    g.set(8, 7, '#ffd23f');
    return g.toDataURL();
  });
  /* 다 쓴 블록 */
  S.usedBlock = once('usedBlock', () => block(16, { fill: '#a8642e', light: '#c98a4a', dark: '#6a3a16', rivet: '#3a1e0a' }).toDataURL());
  /* 타이머 블록: 금빛 블록 위에 DOM 으로 숫자를 얹는다 */
  S.timeBlock = once('timeBlock', () => block(12, { fill: '#f5b829', light: '#ffe27a', dark: '#b5761a', rivet: '#7a4a08' }).toDataURL());
  S.timeBlockOn = once('timeBlockOn', () => block(12, { fill: '#a8642e', light: '#c98a4a', dark: '#6a3a16', rivet: '#3a1e0a' }).toDataURL());
  S.stopBlock = once('stopBlock', () => block(12, { fill: '#38a8e8', light: '#8ad8ff', dark: '#1a5ea0', rivet: '#0b3060' }).toDataURL());

  /* 지도 칸: 난이도별 색 */
  const NODE_COL = {
    green: { fill: '#3cb85a', light: '#8ef08a', dark: '#1d7034' },
    gold: { fill: '#ff9a1f', light: '#ffd07a', dark: '#b8580a' },
    red: { fill: '#e8384a', light: '#ff8a8a', dark: '#94162a' },
    blue: { fill: '#3a7ae8', light: '#8ab8ff', dark: '#1a3e94' },
    purple: { fill: '#9a5ae8', light: '#d0a8ff', dark: '#5a2a9a' }
  };
  S.node = (col) => cache[`node-${col}`] || (cache[`node-${col}`] = (() => {
    const c = NODE_COL[col] || NODE_COL.gold;
    const g = new Grid(12, 13);
    g.part(rrect(.5, 1.5, 10.5, 11.5, 1), { fill: c.dark, line: INK });
    g.part(rrect(.5, .5, 10.5, 9.5, 1), { fill: c.fill, line: INK, light: c.light });
    return g.toDataURL();
  })());
  /* 푼 칸: 눈 덮인 바닥에 깃발 */
  S.nodeClear = once('nodeClear', () => {
    const g = new Grid(12, 13);
    g.part(rrect(.5, 1.5, 10.5, 11.5, 1), { fill: '#7f8fb0', line: INK });
    g.part(rrect(.5, .5, 10.5, 9.5, 1), { fill: '#e8f0ff', line: INK, light: '#ffffff', shade: '#b8c8e8' });
    g.rect(3, 2, 1, 7, '#5a3a1a');
    g.stamp(['####.', '#####', '###..'], 4, 2, { '#': '#e2383f' });
    g.set(4, 3, '#ffffff');
    g.rect(2, 8, 3, 1, '#5a3a1a');
    return g.toDataURL();
  });
  S.nodeEmpty = once('nodeEmpty', () => {
    const g = new Grid(12, 13);
    g.part(rrect(.5, 1.5, 10.5, 11.5, 1), { fill: '#555a6a', line: '#2a2c38' });
    g.part(rrect(.5, .5, 10.5, 9.5, 1), { fill: '#8a90a2', line: '#2a2c38', light: '#a8aec0' });
    return g.toDataURL();
  });

  /* 동전: 돌아가는 4장 */
  S.coin = once('coin', () => [0, 1, 2, 1].map((k) => {
    const g = new Grid(8, 12);
    const rx = [3.4, 2.4, 1][k];
    g.part(ellipse(4, 6, rx, 5.4), { fill: '#ffc81e', line: INK, light: '#fff3a0', shade: '#c47a08' });
    if (k < 2) g.rect(4, 3, 1, 6, '#c47a08');
    return g.toCanvas();
  }));
  /* 반짝 별 */
  S.star = once('star', () => {
    const g = new Grid(14, 14);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.8 : 6.4;
      pts.push([7 + Math.cos(a) * r, 7.3 + Math.sin(a) * r]);
    }
    const inStar = (x, y) => {
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    };
    g.part(inStar, { fill: '#ffd23f', line: INK, light: '#fff7c0', shade: '#e09010' });
    g.set(6, 6, INK); g.set(8, 6, INK); g.set(6, 7, INK); g.set(8, 7, INK);
    return g.toCanvas();
  });
  /* 선물 상자 (블록에서 튀어나오는 것) */
  S.present = once('present', () => {
    const g = new Grid(14, 14);
    g.part(rect(1, 5, 12, 12), { fill: '#3cb85a', line: INK, light: '#8ef08a', shade: '#1d7034' });
    g.part(rect(0, 3, 13, 5), { fill: '#46c866', line: INK, light: '#9af89a' });
    g.rect(6, 3, 2, 10, '#ffd23f');
    g.stamp(['##..##', '#.##.#', '.####.'], 4, 0, { '#': '#ffd23f' });
    return g.toCanvas();
  });

  /* 자명종: 숫자는 DOM 으로 크게 얹는다 */
  S.clock = (urgent) => cache[`clock${urgent ? 1 : 0}`] || (cache[`clock${urgent ? 1 : 0}`] = (() => {
    const g = new Grid(30, 30);
    const body = urgent ? { fill: '#ff3a3a', light: '#ff9a8a', dark: '#a01020' } : { fill: '#e8384a', light: '#ff8a8a', dark: '#94162a' };
    /* 종 두 개 */
    g.part(ellipse(6, 6, 4.6, 4), { fill: '#ffd23f', line: INK, light: '#fff3a0', shade: '#c47a08' });
    g.part(ellipse(23, 6, 4.6, 4), { fill: '#ffd23f', line: INK, light: '#fff3a0', shade: '#c47a08' });
    g.rect(13, 1, 4, 3, INK); g.rect(14, 2, 2, 1, '#ffd23f');
    /* 다리 */
    g.part(tri(5, 24, 9, 24, 3, 29), { fill: INK });
    g.part(tri(20, 24, 24, 24, 26, 29), { fill: INK });
    /* 몸통 */
    g.part(ellipse(14.5, 16, 12, 11.4), { fill: body.fill, line: INK, light: body.light, shade: body.dark, shadeW: 2 });
    g.part(ellipse(14.5, 15.6, 9.2, 8.6), { fill: '#fffaf0', line: INK, shade: '#d8d0c0' });
    return g.toCanvas();
  })());

  /* 분야 아이콘 10×10 */
  const ICON_ROWS = {
    book: ['..........', '.###..###.', '#WWW##WWW#', '#WWW##WWW#', '#WWW##WWW#', '#WWW##WWW#', '#WWW##WWW#', '.###..###.', '....##....', '..........'],
    note: ['....####..', '....#WW#..', '....#..#..', '....#..#..', '....#..#..', '.###.###..', '#WW##WW#..', '#WW##WW#..', '.##..##...', '..........'],
    eye: ['..........', '...####...', '.##WWWW##.', '#WWW##WWW#', '#WW####WW#', '#WWW##WWW#', '.##WWWW##.', '...####...', '..........', '..........'],
    bulb: ['...####...', '..#WWWW#..', '.#WWWWWW#.', '.#WWWWWW#.', '.#WWWWWW#.', '..#WWWW#..', '...####...', '...#WW#...', '...####...', '....##....']
  };
  S.icon = (name, color = '#ffffff') => cache[`icon-${name}-${color}`] || (cache[`icon-${name}-${color}`] = (() => {
    const g = new Grid(10, 10);
    g.stamp(ICON_ROWS[name] || ICON_ROWS.book, 0, 0, { '#': INK, W: color });
    return g.toDataURL();
  })());

  /* 벽돌 블록 16×16: 엇갈려 쌓은 벽돌 + 윗면 눈.
     tone 을 주면 그 색 벽돌 (파이프 판의 층 난이도 색). 없으면 기본 주황 벽돌 */
  const BRICK_TONES = {
    base: ['#d0702e', '#f6a464', '#86400f', '#3a1606'],
    green: ['#38b04c', '#8ae878', '#1a6a2c', '#0a2a10'],
    gold: ['#f0a818', '#ffe07a', '#a0600a', '#3a2000'],
    red: ['#dc3438', '#ff8c80', '#8a1420', '#2a0408'],
    blue: ['#3a7ae8', '#8ab8ff', '#1a3e94', '#08143a'],
    purple: ['#9a4ae0', '#d0a0ff', '#5a2090', '#1e0838']
  };
  S.brick = (tone) => cache[`brick-${tone || 'base'}`] || (cache[`brick-${tone || 'base'}`] = (() => {
    const [fill, light, dark, line] = BRICK_TONES[tone] || BRICK_TONES.base;
    const g = new Grid(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const row = Math.floor(y / 4), bx = (x + (row % 2) * 4) % 8, by = y % 4;
      let v = fill;
      if (by === 3 || bx === 7) v = line;
      else if (by === 0 || bx === 0) v = light;
      else if (bx === 6) v = dark;
      g.set(x, y, v);
    }
    for (let x = 0; x < 16; x++) { g.set(x, 0, '#ffffff'); if (x % 3 !== 1) g.set(x, 1, '#ffffff'); if (x % 5 === 2) g.set(x, 2, '#cfe6ff'); }
    for (let i = 0; i < 16; i++) { g.set(i, 15, INK); g.set(15, i, INK); g.set(0, i, g.get(0, i) === '#ffffff' ? '#ffffff' : INK); }
    return g.toDataURL();
  })());
  /* 선물 블록 반짝임 3장을 가로로 이어 붙인 띠 (CSS 가 한 장씩 넘긴다) */
  S.giftStrip = once('giftStrip', () => {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 16;
    const x = c.getContext('2d');
    [['#ffffff', '#ffd23f'], ['#fff2a8', '#ffffff'], ['#ffd23f', '#fff2a8']].forEach(([star, rib], k) => {
      const g = block(16, { fill: '#e2383f', light: '#ff7b6e', dark: '#9c1b2a' });
      g.rect(7, 1, 2, 14, rib === '#ffffff' ? '#ffe680' : '#ffd23f');
      g.rect(1, 7, 14, 2, rib === '#ffffff' ? '#ffe680' : '#ffd23f');
      g.rect(8, 9, 1, 6, '#d99a14'); g.rect(9, 8, 6, 1, '#d99a14');
      g.stamp(['..#..', '.###.', '#####', '.###.', '.#.#.'], 6, 5, { '#': star });
      if (k === 1) { g.set(3, 3, '#ffffff'); g.set(12, 12, '#ffffff'); }
      if (k === 2) { g.set(12, 3, '#ffffff'); g.set(3, 12, '#ffffff'); }
      x.drawImage(g.toCanvas(), k * 16, 0);
    });
    return c.toDataURL();
  });

  /* 꼬마 펭귄 (밟히는 역할): 털모자, 흰 배, 주황 부리·발. 걷기 2장 + 납작 1장 */
  const PENG_PAL = { k: INK, n: '#24306a', N: '#3a4a9a', w: '#ffffff', W: '#d8e4ff', o: '#ff9a1a', O: '#c86a08', r: '#e2383f', R: '#ff7b6e', y: '#ffffff' };
  const PENG_TOP = [
    '......yy......',
    '.....kRrk.....',
    '....kRrrrk....',
    '...kRrrrrrk...',
    '...kyyyyyyk...',
    '..knnnnnnnNk..',
    '..knnwwwwnnk..',
    '.knnwkwwkwnnk.',
    '.knnwwoowwnnk.',
    '.knnwwOOwwnnk.',
    'knnnwwwwwwnnnk',
    'knnwwwwwwwwnnk',
    'knnwwwwwwwWnnk',
    '.knwwwwwwWWnk.',
    '..kkWWWWWWkk..'
  ];
  S.penguin = once('penguin', () => {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 16;
    const x = c.getContext('2d');
    [0, 1].forEach((k) => {
      const g = new Grid(16, 16);
      g.stamp(PENG_TOP, 1, 0, PENG_PAL);
      g.stamp(k ? ['..ooo....ooo'.padStart(13, '.')] : ['...ooo..ooo..'], 1, 15, PENG_PAL);
      x.drawImage(g.toCanvas(), k * 16, 0);
    });
    const g = new Grid(16, 16);
    g.stamp(['.....kRrk.....', '..kkyyyyyykk..', '.knnwkwwkwnnk.', 'knnwwwoowwwnnk', 'kkkkkkkkkkkkkk'], 1, 10, PENG_PAL);
    g.stamp(['.oo........oo.'], 1, 15, PENG_PAL);
    x.drawImage(g.toCanvas(), 32, 0);
    return c.toDataURL();
  });

  /* 지도 장식: 위에서 본 눈 덮인 전나무 (박자 맞춰 흔들리는 2장) */
  S.mapTree = once('mapTree', () => {
    const c = document.createElement('canvas');
    c.width = 24; c.height = 16;
    const x = c.getContext('2d');
    [0, 1].forEach((k) => {
      const g = new Grid(12, 16);
      const lean = k ? .8 : 0;
      g.part(tri(6 + lean, 1, 1, 9, 11, 9), { fill: '#22924a', line: INK, light: '#4cc068', shade: '#0f5a2e' });
      g.part(tri(6 + lean * .5, 4, .5, 13, 11.5, 13), { fill: '#22924a', line: INK, light: '#4cc068', shade: '#0f5a2e' });
      g.rect(5, 13, 2, 2, '#6a3a1a');
      g.set(Math.round(6 + lean), 2, '#ffffff'); g.rect(3, 8, 2, 1, '#ffffff'); g.rect(8, 12, 2, 1, '#ffffff');
      g.set(4, 11, '#ff3a4a'); g.set(8, 7, '#ffd23f');
      x.drawImage(g.toCanvas(), k * 12, 0);
    });
    return c.toDataURL();
  });

  /* 색 섞기: k>0 이면 흰색 쪽, k<0 이면 검은색 쪽 */
  const mix = (hex, k) => {
    const [r, g, b] = rgba(hex);
    const t = k > 0 ? 255 : 0, a = Math.abs(k);
    const c = (v) => Math.round(v + (t - v) * a).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
  };
  /* 파이프 20×16: 위 입구(넓은 테) 6칸 + 몸통 10칸. 원통처럼 왼쪽 밝은 띠, 오른쪽 그림자, 입구에 눈이 쌓였다.
     kind: ready(분야 색) / used(회색 + 빨간 깃발) / empty(어두운 회색) */
  S.pipe = (hex, kind = 'ready') => cache[`pipe-${hex}-${kind}`] || (cache[`pipe-${hex}-${kind}`] = (() => {
    const base = kind === 'used' ? '#9aa2b4' : kind === 'empty' ? '#5a5e6e' : hex;
    const L = mix(base, .45), LL = mix(base, .75), D = mix(base, -.35), DD = mix(base, -.6);
    const g = new Grid(20, 16);
    const shadeRow = (x0, x1, y0, y1) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let v = base;
        if (u < .12) v = L; else if (u < .24) v = LL; else if (u < .34) v = L; else if (u > .86) v = DD; else if (u > .7) v = D;
        g.set(x, y, v);
      }
    };
    /* 몸통 */
    shadeRow(3, 16, 6, 15);
    for (let y = 6; y < 16; y++) { g.set(2, y, INK); g.set(17, y, INK); }
    /* 입구 테 */
    shadeRow(1, 18, 1, 5);
    for (let x = 0; x < 20; x++) { g.set(x, 0, INK); g.set(x, 6, INK); }
    for (let y = 0; y < 7; y++) { g.set(0, y, INK); g.set(19, y, INK); }
    /* 입구 안쪽 어둠 (위에서 살짝 보이는 구멍) */
    g.rect(3, 1, 14, 1, DD);
    /* 쌓인 눈 */
    for (let x = 1; x < 19; x++) { g.set(x, 0, '#ffffff'); if (x % 4 !== 0) g.set(x, 1, '#ffffff'); if (x % 5 === 2) g.set(x, 2, '#dfeeff'); }
    g.set(0, 0, INK); g.set(19, 0, INK);
    if (kind === 'used') {
      g.rect(4, 7, 1, 6, '#5a3a1a');
      g.stamp(['###', '####', '##'], 5, 7, { '#': '#e2383f' });
    }
    return g.toDataURL();
  })());

  /* 하트(남은 문제 표시) */
  S.heart = once('heart', () => {
    const g = new Grid(9, 8);
    g.stamp(['.##.##.', '#WW#rr#', '#Wrrrr#', '#rrrrr#', '.#rrr#.', '..#r#..', '...#...'], 1, 0, { '#': INK, W: '#ffffff', r: '#ff3a5a' });
    return g.toDataURL();
  });

  window.Pixel = { P, Grid, ellipse, rect, rrect, tri, any, not, INK, sprites: S, rgba };
})();
