/* 효과음·배경음.
   효과음 파일은 assets/sfx (받아 둔 마리오 효과음에서 앞뒤 빈 소리를 잘라 음량을 맞춘 것).
   파일이 없는 짧은 "삑" 소리(커서·대화창·멈춤)는 옛날 게임기 소리처럼 코드로 만든다.
   배경음(Bgm)은 아래쪽, 곡은 settings.js 의 bgmTracks 에서 고른다.

   이름        언제 나는 소리                         소리
   start       표지에서 게임 시작                     1UP
   move        지도에서 칸 옮기기 / 메뉴 커서         짧은 삑 (코드)
   select      칸 고르기, 메뉴 고르기                 두 음 삑 (코드)
   enter       스테이지 입장 (검은 화면 카드)         없음 (원작도 조용)
   jump        캐릭터 점프                            Mario Jump
   stomp       펭귄 밟기                              Goomba Stomp
   pipe        파이프 들어가기·나오기                 Pipe
   bump        블록 머리로 치기                       Bump
   coin        동전 튀어나옴                          Coin
   timerStart  타이머 시작·이어서                     P Switch 타이머 곡 (5·10·15초)
   pause       타이머 멈춤                            멈춤 효과음 (코드)
   tick        1초마다 / 점수 올라갈 때               짧은 삑 (P Switch 곡이 도는 동안은 안 남)
   timeUp      시간 종료                              Lose a Life
   reveal      선물 블록에서 정답이 튀어나옴          Item Block → PowerUp
   clear       정답 화면 (스테이지 클리어)            Level Clear
   flag        지도에 깃발 꽂기                       Down the FlagPole
   allClear    모든 문제 끝                           Castle Clear + Fireworks
   open        대화창 열기                            두 음 (코드)
   blip        대화창 글자 찍힐 때                    아주 짧은 삑 (코드)
   deny        새로고침 막힘                          Bump
   iris        화면 닫히고 열릴 때                    없음 */
(function () {
  const SET = window.QUIZ_SETTINGS || {};
  const DIR = 'assets/sfx/';
  const vol = () => Math.max(0, Math.min(1, SET.sfxVolume == null ? 0.8 : SET.sfxVolume));

  /* ---------- 파일 효과음: 미리 읽어 두고, 겹쳐 나야 하면 복제해서 튼다 ---------- */
  const FILES = ['jump', 'stomp', 'pipe', 'bump', 'coin', 'item', 'powerup', '1up', 'timeup', 'clear', 'flag', 'castle', 'fireworks'];
  const pool = {};
  function loadAll() {
    FILES.forEach((n) => {
      if (pool[n]) return;
      const a = new Audio(DIR + n + '.mp3');
      a.preload = 'auto';
      pool[n] = [a];
    });
  }
  function file(n, gain = 1) {
    const list = pool[n] || (loadAll(), pool[n]);
    if (!list) return;
    let a = list.find((x) => x.paused || x.ended);
    if (!a) { if (list.length >= 6) a = list[0]; else { a = list[0].cloneNode(); list.push(a); } }
    a.volume = Math.min(1, vol() * gain);
    try { a.currentTime = 0; } catch (e) {}
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* ---------- 코드로 만드는 8비트 삑 소리 ---------- */
  let ctx = null;
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* notes: [주파수Hz, 길이초] 를 차례로. 0 이면 쉼 */
  function beep(notes, gain = 0.12, type = 'square') {
    const c = ac();
    if (!c) return;
    let t = c.currentTime + 0.005;
    notes.forEach(([f, d]) => {
      if (f) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(gain * vol(), t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + d);
        o.connect(g).connect(c.destination);
        o.start(t); o.stop(t + d + 0.02);
      }
      t += d;
    });
  }

  /* ---------- P Switch 타이머 곡: 타이머 길이(5·10·15초)와 꼭 맞는 곡 ---------- */
  const PSW = [5, 10, 15];
  const Timer = {
    a: null, sec: 0,
    has(sec) { return Sound.enabled && PSW.includes(sec); },
    /* 매 프레임 부른다. running 이면 남은 시간에 맞춰 곡을 틀고, 아니면 멈춘다 */
    sync(status, sec, remainMs) {
      if (status !== 'running' || !this.has(sec)) { this.pause(); return; }
      if (!this.a || this.sec !== sec) {
        this.stop();
        this.a = new Audio(`${DIR}pswitch${sec}.mp3`);
        this.a.preload = 'auto';
        this.sec = sec;
      }
      const a = this.a, want = Math.max(0, sec - remainMs / 1000);
      a.volume = vol();
      if (a.paused && !a.ended && remainMs > 120) {
        if (Math.abs(a.currentTime - want) > 0.35) { try { a.currentTime = want; } catch (e) {} }
        const p = a.play(); if (p && p.catch) p.catch(() => {});
      }
    },
    pause() { if (this.a && !this.a.paused) this.a.pause(); },
    stop() { if (!this.a) return; this.a.pause(); this.a.removeAttribute('src'); this.a.load(); this.a = null; this.sec = 0; }
  };

  const Sound = {
    enabled: !!SET.sound,
    timer: Timer,
    play(name, opts = {}) {
      if (!this.enabled) return;
      switch (name) {
        case 'start': file('1up'); break;
        case 'move': beep([[1568, 0.035]], 0.05); break;
        case 'select': beep([[1319, 0.04], [1976, 0.07]], 0.08); break;
        case 'jump': file('jump', 0.8); break;
        case 'stomp': file('stomp'); break;
        case 'pipe': file('pipe'); break;
        case 'bump': case 'deny': file('bump'); break;
        case 'coin': file('coin', 0.85); break;
        case 'timerStart': if (!Timer.has(opts.sec)) beep([[988, 0.06], [1319, 0.1]], 0.1); break;
        case 'pause': beep([[1319, 0.06], [1047, 0.06], [1319, 0.06], [1047, 0.1]], 0.1); break;
        case 'tick': beep([[opts.urgent ? 1760 : 1175, 0.045]], opts.urgent ? 0.1 : 0.06); break;
        case 'timeUp': Timer.stop(); file('timeup'); break;
        case 'reveal': file('item'); setTimeout(() => file('powerup'), 520); break;
        case 'clear': file('clear'); break;
        case 'flag': file('flag'); break;
        case 'allClear':
          if (window.Bgm) window.Bgm.quiet(7000);
          file('castle'); setTimeout(() => file('fireworks', 0.8), 400); break;
        case 'open': beep([[784, 0.05], [1175, 0.08]], 0.07); break;
        case 'blip': beep([[2093, 0.012]], 0.035); break;
        default: break; /* enter, iris: 소리 없음 */
      }
    },
    /* 첫 클릭/키 입력 때 불린다: 삑 소리 장치를 깨우고 파일을 미리 읽는다 */
    unlock() { if (!this.enabled) return; ac(); loadAll(); }
  };
  /* 배경음: 화면마다 곡 목록(settings.js 의 bgmTracks)을 차례로 돌려 튼다.
     scene('title') 표지, scene('map') 파이프 판, scene(null) 끄기 (문제·정답 화면).
     브라우저는 첫 클릭/키 입력 전에는 소리를 막으므로 start() 가 불릴 때 실제로 재생된다.
     지도 곡은 문제를 풀고 돌아왔을 때 멈췄던 곳부터 이어서 나온다. */
  const Bgm = {
    unlocked: false, want: null, held: false, quietUntil: 0, players: {},
    vol() { return Math.max(0, Math.min(1, SET.bgmVolume == null ? 0.5 : SET.bgmVolume)); },
    player(name) {
      if (this.players[name]) return this.players[name];
      const list = ((SET.bgmTracks || {})[name] || []).filter(Boolean);
      if (!list.length) return null;
      const a = new Audio();
      a.preload = 'auto';
      const pl = { a, list, i: 0, fade: 0 };
      a.src = list[0];
      a.loop = list.length === 1;
      a.addEventListener('ended', () => { pl.i = (pl.i + 1) % list.length; a.src = list[pl.i]; if (this.active() === name) a.play().catch(() => {}); });
      return (this.players[name] = pl);
    },
    active() { return this.unlocked && !this.held && Date.now() >= this.quietUntil ? this.want : null; },
    fadeTo(pl, target, ms, done) {
      clearInterval(pl.fade);
      const a = pl.a, from = a.volume, t0 = Date.now();
      pl.fade = setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / ms);
        a.volume = from + (target - from) * k;
        if (k >= 1) { clearInterval(pl.fade); if (done) done(); }
      }, 30);
    },
    sync() {
      if (!SET.bgm) return;
      const on = this.active();
      Object.entries(this.players).forEach(([n, pl]) => {
        if (n !== on && !pl.a.paused) this.fadeTo(pl, 0, 400, () => pl.a.pause());
      });
      const pl = on && this.player(on);
      if (!pl) return;
      if (pl.a.paused) { pl.a.volume = 0; pl.a.play().catch(() => {}); }
      this.fadeTo(pl, this.vol(), 600);
    },
    scene(name) { this.want = name || null; this.sync(); },
    start() { if (this.unlocked) return; this.unlocked = true; this.sync(); },
    stop() { this.scene(null); },
    /* 잠깐 조용히 (모든 문제 끝 축하 음악이 나오는 동안) */
    quiet(ms) { this.quietUntil = Date.now() + ms; this.sync(); setTimeout(() => this.sync(), ms + 50); },
    /* 문제의 음악이 재생되는 동안 배경음을 잠시 멈춘다 */
    hold(v) { if (this.held === !!v) return; this.held = !!v; this.sync(); }
  };
  window.Sound = Sound;
  window.Bgm = Bgm;
})();
