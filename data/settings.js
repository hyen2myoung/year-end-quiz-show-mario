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
     stage: 문제 화면 배경(월드 테마). 난이도마다 같은 월드가 낮·노을·밤으로 바뀝니다 (levels 의 time). day(눈 덮인 평원), water(물속), sky(하늘), cave(지하 얼음 동굴)
            예전 테마 night(밤 마을), sunset(노을 언덕), ice(얼음 동굴)도 쓸 수 있습니다.
     color: 분야 간판 색.
     edition: data/editions.js 의 마리오 버전. 문제·정답의 캐릭터와 버전 표시를 정합니다.
     bgm  : 같은 버전의 문제 화면 배경음. 아래 levels 순서(하, 중, 상)대로 한 곡씩. 비우면("") 조용합니다. */
  categories: [
    { name: "상식", icon: "book", stage: "day", color: "#2f7ae8", edition: "smb1",
      bgm: ["assets/bgm/title.mp3",
            "assets/bgm/cave-1.mp3",
            "배경음악 및 효과음/Super Mario Bros - Soundtrack/11 - Super Mario Bros (NES) Music - Hurried Castle.mp3"] },
    { name: "청각", icon: "note", stage: "water", color: "#7a4ae0", edition: "smb3",
      bgm: ["배경음악 및 효과음/Super Mario Bros 3 - Soundtrack/04 - Super Mario Bros 3 (NES) Music - Underwater Theme.mp3",
            "배경음악 및 효과음/Super Mario Bros 3 - Soundtrack/02 - Super Mario Bros 3 (NES) Music - Overworld Theme 2.mp3",
            "배경음악 및 효과음/Super Mario Bros 3 - Soundtrack/30 - Super Mario Bros 3 (NES) Music - Bowser Battle.mp3"] },
    { name: "시각", icon: "eye", stage: "sky", color: "#e8602a", edition: "nsmb",
      bgm: ["assets/bgm/sky-2.mp3",
            "assets/bgm/grass-2.mp3",
            "배경음악 및 효과음/New Super Mario Bros DS - Soundtrack/32 - Castle Boss.mp3"] },
    { name: "두뇌", icon: "bulb", stage: "cave", color: "#1a9ab8", edition: "smw",
      bgm: ["배경음악 및 효과음/Super Mario World - Soundtrack/12 - Super Mario World OST - Underground.mp3",
            "배경음악 및 효과음/Super Mario World - Soundtrack/14 - Super Mario World OST - Haunted House.mp3",
            "배경음악 및 효과음/Super Mario World - Soundtrack/25 - Super Mario World OST - The Evil King Bowser.mp3"] }
  ],

  /* 월드 안의 줄(난이도). 위에서부터 순서대로 나오고, 아래로 갈수록 별이 늘어납니다.
     color : 칸 색. green, gold, red, blue, purple 중 선택
     time  : 문제 화면 배경의 시간대. day(낮) · dusk(노을) · night(밤). 같은 분야 월드가 이 시간대 빛으로 바뀝니다 */
  levels: [
    { name: "하", color: "green", time: "day" },
    { name: "중", color: "gold",  time: "dusk" },
    { name: "상", color: "red",   time: "night" }
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
  stageBgmVolume: 0.26, /* 문제·정답의 브금은 작게. 문제 음원·타이머 재생 중에는 자동으로 멈춥니다. */

  autoFullscreen: true, /* 첫 클릭 때 전체화면 */

  /* 구름이·노을이 옷: true = 모자 + 멜빵바지 + 주먹 든 점프 (기본), false = 예전 목도리 */
  heroOutfit: true,

  /* 진행 상황 저장 이름. 다른 행사에 재사용할 때 바꾸면 새로 시작합니다 */
  storageKey: "sw-center-quiz-2026-platformer"
};
