/* 효과음·배경음 자리.
   효과음은 아직 비워 두었습니다. 화면 곳곳에서 아래 이름으로 이미 부르고 있으니,
   나중에 넣을 때는 Sound.play 만 채우고 settings.js 의 sound 를 true 로 바꾸면 됩니다.
   배경음(Bgm)은 아래에 들어가 있고, 곡은 settings.js 의 bgmTracks 에서 고릅니다.

   이름        언제 나는 소리
   start       표지에서 게임 시작
   move        지도에서 칸 옮기기
   select      칸 고르기, 메뉴 고르기
   enter       스테이지 입장 (검은 화면 카드)
   jump        캐릭터 점프
   bump        블록 머리로 치기
   coin        동전 튀어나옴
   timerStart  타이머 시작
   pause       타이머 멈춤
   tick        1초마다 (urgent=true 이면 마지막 몇 초)
   timeUp      시간 종료
   reveal      선물 블록에서 정답이 튀어나옴
   clear       정답 화면 (스테이지 클리어)
   flag        지도에 깃발 꽂기
   allClear    모든 문제 끝
   open        대화창 열기
   blip        대화창 글자 찍힐 때
   deny        새로고침 막힘
   iris        화면 닫히고 열릴 때 */
(function () {
  const SET = window.QUIZ_SETTINGS || {};
  const Sound = {
    enabled: !!SET.sound,
    /* name 은 위 표의 이름. 지금은 아무 소리도 내지 않는다 */
    play(name, opts) { if (!this.enabled) return; /* 나중에 여기에 소리 재생을 넣는다 */ },
    unlock() {}
  };
  /* 배경음: 화면마다 곡 목록(settings.js 의 bgmTracks)을 차례로 돌려 튼다.
     scene('title') 표지, scene('map') 파이프 판, scene(null) 끄기 (문제·정답 화면).
     브라우저는 첫 클릭/키 입력 전에는 소리를 막으므로 start() 가 불릴 때 실제로 재생된다.
     지도 곡은 문제를 풀고 돌아왔을 때 멈췄던 곳부터 이어서 나온다. */
  const Bgm = {
    unlocked: false, want: null, held: false, players: {},
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
    active() { return this.unlocked && !this.held ? this.want : null; },
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
    /* 문제의 음악이 재생되는 동안 배경음을 잠시 멈춘다 */
    hold(v) { if (this.held === !!v) return; this.held = !!v; this.sync(); }
  };
  window.Sound = Sound;
  window.Bgm = Bgm;
})();
