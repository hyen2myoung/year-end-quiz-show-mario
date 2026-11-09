/* =====================================================================
   행사 설정 파일 — 제목, 분야, 난이도, 연출 옵션을 바꿉니다.
   ===================================================================== */
window.QUIZ_SETTINGS = {

  title: "SW 센터 송년회 퀴즈쇼",
  titleTop: "SW 센터 송년회",          /* 표지 큰 제목 윗줄 */
  titleMain: "퀴즈쇼",                 /* 표지 큰 제목 아랫줄 */
  eyebrow: "Merry Christmas & Happy New Year",
  year: "2026",
  subtitle: "구름이와 노을이의 겨울 대모험",
  credit: "SEMES SWCC",                /* 표지 맨 아래 작은 글씨 (© 연도 뒤에 붙음) */

  /* 분야 = 월드. 왼쪽부터 순서대로 나옵니다.
     icon : book, note, eye, bulb 중 선택
     stage: 문제 화면 배경(월드 테마). day(눈 덮인 평원), water(물속), sky(하늘), cave(지하 얼음 동굴)
            예전 테마 night(밤 마을), sunset(노을 언덕), ice(얼음 동굴)도 쓸 수 있습니다.
     color: 분야 간판 색. 성 스테이지의 깃발·창문 색도 이 색을 씁니다.
     bgm  : 문제 화면 배경음. 아래 levels 순서(하, 중, 상)대로 한 곡씩. 비우면("") 조용합니다. */
  categories: [
    { name: "상식", icon: "book", stage: "day", color: "#2f7ae8",
      bgm: ["assets/bgm/title.mp3",       /* 하: Super Mario Bros - Overworld */
            "assets/bgm/grass-2.mp3",     /* 중: New Super Mario Bros - Overworld */
            "assets/bgm/castle-1.mp3"] }, /* 상: New Super Mario Bros - Tower */
    { name: "청각", icon: "note", stage: "water", color: "#7a4ae0",
      bgm: ["assets/bgm/water-1.mp3",     /* 하: Super Mario Bros - Underwater */
            "assets/bgm/water-2.mp3",     /* 중: New Super Mario Bros - Underwater */
            "assets/bgm/castle-2.mp3"] }, /* 상: Super Mario Bros 3 - Castle */
    { name: "시각", icon: "eye", stage: "sky", color: "#e8602a",
      bgm: ["assets/bgm/sky-1.mp3",       /* 하: Super Mario Bros 3 - Sky */
            "assets/bgm/sky-2.mp3",       /* 중: New Super Mario Bros - Athletic */
            "assets/bgm/castle-3.mp3"] }, /* 상: New Super Mario Bros - Castle */
    { name: "두뇌", icon: "bulb", stage: "cave", color: "#1a9ab8",
      bgm: ["assets/bgm/cave-1.mp3",      /* 하: Super Mario Bros - Underground */
            "assets/bgm/cave-2.mp3",      /* 중: New Super Mario Bros - Underground */
            "assets/bgm/castle-4.mp3"] }  /* 상: Super Mario Bros 3 - Boss Battle */
  ],

  /* 월드 안의 줄(난이도). 위에서부터 순서대로 나오고, 아래로 갈수록 별이 늘어납니다.
     color : 칸 색. green, gold, red, blue, purple 중 선택
     castle: true 이면 그 난이도는 월드의 마지막 관문 '성' 스테이지 (돌벽·용암·횃불 배경) */
  levels: [
    { name: "하", color: "green" },
    { name: "중", color: "gold" },
    { name: "상", color: "red", castle: true }
  ],

  /* 줄마다 칸 수 (1~4) */
  slotsPerCell: 4,

  mediaFolder: "resources",

  /* 문제 화면의 타이머 블록(초). 누르면 그 시간으로 바로 시작합니다 */
  timerPresets: [5, 10, 15],

  /* 마지막 몇 초부터 긴박하게 연출할지 */
  urgentSeconds: 5,

  snowAmount: 120,      /* 눈송이 개수. 행사 PC가 느리면 50 정도로 낮추세요 */

  /* 효과음. 받아 둔 마리오 효과음(assets/sfx)을 동작마다 붙였습니다. 어느 동작에 어떤 소리인지는 assets/sound.js 맨 위 표.
     타이머 5·10·15초는 길이가 꼭 맞는 P Switch 곡이 나옵니다. */
  sound: true,
  sfxVolume: 0.8,       /* 효과음 음량 0 ~ 1 */

  /* 배경음. 화면마다 적은 곡을 순서대로 돌려 틉니다 (한 곡이면 반복).
     title: 표지, map: 문제 고르는 파이프 화면. 문제·정답 화면 곡은 위 categories 의 bgm. */
  bgm: true,
  bgmTracks: {
    title: ["assets/bgm/title.mp3"],   /* Super Mario Bros - Overworld Theme */
    map: [                             /* Super Mario Bros 3 - World Map 1·2·3·4·7 */
      "assets/bgm/map1.mp3", "assets/bgm/map2.mp3", "assets/bgm/map3.mp3",
      "assets/bgm/map4.mp3", "assets/bgm/map7.mp3"
    ]
  },
  bgmVolume: 0.5,

  autoFullscreen: true, /* 첫 클릭 때 전체화면 */

  /* 구름이·노을이 옷: true = 모자 + 멜빵바지 + 주먹 든 점프 (기본), false = 예전 목도리 */
  heroOutfit: true,

  /* 진행 상황 저장 이름. 다른 행사에 재사용할 때 바꾸면 새로 시작합니다 */
  storageKey: "sw-center-quiz-2026-platformer"
};
