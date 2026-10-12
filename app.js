// 할 일 목록은 이 변수에만 저장돼요.
// 따로 저장하지 않기 때문에 새로고침하면 전부 사라져요.
let todos = [];

const form = document.getElementById("new-todo-form");
const input = document.getElementById("new-todo");
const dateInput = document.getElementById("new-date");
const timeInput = document.getElementById("new-time");
const authorInput = document.getElementById("new-author");
const list = document.getElementById("todo-list");
const nearest = document.getElementById("nearest");
const empty = document.getElementById("empty");
const footerQuote = document.getElementById("footer-quote");
const filterBar = document.getElementById("filter-bar");
const filterButtons = document.querySelectorAll("#filter-bar [data-filter]");
const remaining = document.getElementById("remaining");
const filterEmpty = document.getElementById("filter-empty");

// 지금 고른 버튼: "all"(전체), "active"(진행 중), "done"(완료)
let filter = "all";

// 빈 공간에 넣을 재치 있는 문구 (새로고침할 때마다 무작위로 골라요)
const quotes = [
  "마감은 다가오고, 나는 유튜브를 보고 있다.",
  "5분만 쉬자고 한 게 2시간 전이다.",
  "내일의 나는 오늘의 나를 원망할 것이다.",
  "과제는 미룰수록 커진다. 과학적으로 증명됨(아님).",
  "할 일이 없다고? 진짜? 다시 생각해 봐.",
  "D-Day에 시작하는 것도 재능이다.",
  "책상 정리부터 하는 건 공부가 아니다.",
  "시작이 반이다. 그럼 나는 아직 0이다.",
];

function randomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

empty.textContent = randomQuote();
footerQuote.textContent = randomQuote();

// 낮/밤 배경: 오전 6시~오후 6시는 낮, 나머지는 밤
// (처음 정하는 건 index.html에서 하고, 여기서는 1분마다 다시 확인해요)
function updateTheme() {
  const hour = new Date().getHours();
  document.documentElement.dataset.theme = hour >= 6 && hour < 18 ? "day" : "night";
}
setInterval(updateTheme, 60 * 1000);

// 밤하늘 별: 작은 네모를 여기저기 뿌려요 (땅이 있는 아래쪽은 빼고)
const stars = document.getElementById("stars");
for (let i = 0; i < 70; i++) {
  const star = document.createElement("i");
  if (i % 10 === 0) star.className = "big"; // 열 개 중 하나는 반짝이는 + 모양
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 80}%`;
  star.style.animationDelay = `${-Math.random() * 2}s`;
  star.style.animationDuration = `${1 + Math.random() * 2}s`;
  stars.append(star);
}

// 마감 시각 구하기 (시간을 안 골랐으면 그날 밤 23:59로 봐요)
function dueTime(todo) {
  if (!todo.date) return Infinity; // 마감일 없음 → 맨 아래로
  return new Date(`${todo.date}T${todo.time || "23:59"}`).getTime();
}

// "D-3", "D-Day", "D+2 (지남)" 같은 글자 만들기
function dDayText(todo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(`${todo.date}T00:00`);
  const diff = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

  let text;
  if (diff > 0) text = `D-${diff}`;
  else if (diff === 0) text = "D-Day";
  else text = `D+${-diff}`;

  if (todo.time) text += ` (${timeText(todo.time)})`;
  if (dueTime(todo) < Date.now()) text += " 지남";
  return text;
}

// "18:30" → "오후 6시 30분"
function timeText(time) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${ampm} ${hour}시` : `${ampm} ${hour}시 ${m}분`;
}

// 할 일 글자를 두 번 누르면 입력칸으로 바꿔서 고치기
// Enter: 저장 (다 지웠으면 원래대로), Esc나 다른 곳 클릭: 취소
function startEdit(todo, title) {
  const editor = document.createElement("input");
  editor.type = "text";
  editor.className = "edit";
  editor.value = todo.title;
  title.replaceWith(editor);
  editor.focus();
  editor.select();

  let finished = false; // 저장/취소가 두 번 실행되지 않게 막기

  function finish(save) {
    if (finished) return;
    finished = true;
    const text = editor.value.trim();
    if (save && text !== "") todo.title = text;
    render();
  }

  editor.addEventListener("keydown", (event) => {
    if (event.isComposing) return; // 한글 입력 중의 Enter는 무시
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  editor.addEventListener("blur", () => finish(false));
}

// 화면을 todos 내용대로 다시 그리기
function render() {
  list.innerHTML = "";

  // 완료한 할 일은 맨 아래로, 그 안에서는 마감일이 가까운 순서로 정렬
  const sorted = [...todos].sort(
    (a, b) => a.done - b.done || dueTime(a) - dueTime(b)
  );

  // 고른 버튼에 맞는 할 일만 보여주기
  const shown = sorted.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true; // 전체
  });

  shown.forEach((todo) => {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done");

    // 완료 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      render();
    });

    // 할 일 내용 + 작성자 (작성자는 적었을 때만 아래에 작게)
    const text = document.createElement("div");
    text.className = "text";

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = todo.title;
    title.title = "두 번 눌러서 고치기";
    title.addEventListener("dblclick", () => startEdit(todo, title));
    text.append(title);

    if (todo.author) {
      const author = document.createElement("span");
      author.className = "author";
      author.textContent = `✍ ${todo.author}`;
      text.append(author);
    }

    li.append(checkbox, text);

    // 마감일 표시 (마감일이 있을 때만)
    if (todo.date) {
      const badge = document.createElement("span");
      badge.className = "badge";
      if (dueTime(todo) < Date.now()) badge.classList.add("late");
      badge.textContent = dDayText(todo);
      li.append(badge);
    }

    // 삭제 버튼
    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "✕";
    del.title = "삭제";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t !== todo);
      render();
    });

    li.append(del);
    list.append(li);
  });

  // 가장 가까운 할 일 (완료한 일과 마감일 없는 일은 빼요)
  const next = sorted.find((t) => !t.done && t.date);
  if (next) {
    nearest.textContent = `🔔 가장 가까운 할 일: ${next.title} (${dDayText(next)})`;
    nearest.hidden = false;
  } else {
    nearest.hidden = true;
  }

  // 할 일이 하나도 없으면 문구 보이기 (이때는 버튼 줄도 숨겨요)
  empty.hidden = todos.length > 0;
  filterBar.hidden = todos.length === 0;

  // 남은 할 일 개수 (완료 안 한 일)
  remaining.textContent = `남은 일 ${todos.filter((t) => !t.done).length}개`;

  // 할 일은 있는데 고른 버튼에 해당하는 게 없을 때 안내 문구
  if (todos.length > 0 && shown.length === 0) {
    filterEmpty.textContent =
      filter === "done" ? "완료한 할 일이 아직 없어요" : "남은 할 일이 없어요! 대단해요 🎉";
    filterEmpty.hidden = false;
  } else {
    filterEmpty.hidden = true;
  }
}

// 전체 / 진행 중 / 완료 버튼
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("selected", b === button));
    render();
  });
});

// 추가 버튼을 누르거나 Enter를 치면 실행
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 페이지가 새로고침되지 않게 막기

  const text = input.value.trim();
  if (text === "") return; // 빈 칸이면 추가하지 않기

  todos.push({
    title: text,
    done: false,
    date: dateInput.value, // 안 골랐으면 ""
    time: dateInput.value ? timeInput.value : "", // 날짜 없이 시간만은 무시
    author: authorInput.value.trim(), // 안 적었으면 ""
  });
  // 작성자 이름은 다음 할 일에도 쓰도록 지우지 않고 남겨 둬요
  input.value = "";
  dateInput.value = "";
  timeInput.value = "";
  input.focus();
  render();

  // 이스터에그: 할 일에 "야구"가 들어가면 폭죽 + 야구공과 배트
  if (text.includes("야구")) baseballParty();

  // 이스터에그: 할 일에 "진수"가 들어가면 오른쪽 위에 코 버튼이 생겨요
  if (text.includes("진수") && noseButton.hidden) {
    noseButton.hidden = false;
    noseButton.animate(
      [{ transform: "scale(0)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }],
      { duration: 400, easing: "steps(4)" }
    );
  }
});

// 🦖 코 버튼을 누르면 거대한 픽셀 공룡이 3초 동안 나왔다 들어가요
const noseButton = document.getElementById("nose-btn");
noseButton.addEventListener("click", showDino);

let dinoShowing = false; // 공룡이 나와 있는 동안 또 누르면 무시

function showDino() {
  if (dinoShowing) return;
  dinoShowing = true;
  noseButton.hidden = true; // 코 버튼은 한 번 누르면 사라져요

  // 픽셀 공룡 그림: G=몸, E=눈 흰자, K=눈동자 (테두리는 자동으로 그려요)
  const art = [
    "..........GGGGGGGG..",
    ".........GGEKGGGGGGG",
    ".........GGGGGGGGGGG",
    ".........GGGGGGGGGGG",
    ".........GGGGGG.....",
    ".........GGGGGGGGG..",
    "G.......GGGGG.......",
    "G......GGGGGG.......",
    "GG....GGGGGGGGG.....",
    "GGG..GGGGGGGG.G.....",
    "GGGGGGGGGGGGG.......",
    "GGGGGGGGGGGG........",
    ".GGGGGGGGGGG........",
    "..GGGGGGGGGG........",
    "...GGGGGGGG.........",
    "....GGG.GGG.........",
    "....GG....G.........",
    "....G.....G.........",
    "....GG....GG........",
  ];
  const colors = { G: "#5cb85c", E: "#ffffff", K: "#2b2d42" };
  const outline = "#1f5130";

  const canvas = document.createElement("canvas");
  canvas.width = art[0].length + 2; // 테두리 자리 1칸씩
  canvas.height = art.length + 2;
  const g = canvas.getContext("2d");
  const filled = (x, y) => art[y]?.[x] && art[y][x] !== ".";
  for (let y = -1; y <= art.length; y++) {
    for (let x = -1; x <= art[0].length; x++) {
      if (filled(x, y)) {
        g.fillStyle = colors[art[y][x]];
      } else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) {
        g.fillStyle = outline;
      } else {
        continue;
      }
      g.fillRect(x + 1, y + 1, 1, 1);
    }
  }

  // 화면 아래에서 솟아오르는 공룡 + 말풍선
  const stage = document.createElement("div");
  stage.className = "dino-stage";
  const bubble = document.createElement("p");
  bubble.className = "dino-bubble";
  bubble.textContent = "크아앙!";
  stage.append(canvas, bubble);
  document.body.append(stage);

  // 0~0.4초 솟아오름 → 2.4초 머무름 (살짝 들썩) → 마지막 0.6초 내려감 = 3초
  stage.animate(
    [
      { transform: "translate(-50%, 100%)" },
      { transform: "translate(-50%, 0)", offset: 0.13 },
      { transform: "translate(-50%, -3%)", offset: 0.3 },
      { transform: "translate(-50%, 0)", offset: 0.45 },
      { transform: "translate(-50%, -3%)", offset: 0.6 },
      { transform: "translate(-50%, 0)", offset: 0.8 },
      { transform: "translate(-50%, 100%)" },
    ],
    { duration: 3000, easing: "steps(30)" } // 뚝뚝 끊어 움직여서 게임처럼
  ).onfinish = () => {
    stage.remove();
    dinoShowing = false;
  };

  bubble.animate(
    [{ opacity: 0 }, { opacity: 0, offset: 0.12 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.78 }, { opacity: 0, offset: 0.8 }],
    { duration: 3000, fill: "forwards" }
  );
}

// ⚾ 이스터에그: 약 6초 동안 화면 전체가 홈런 축제가 돼요
// - 번쩍! 하고 화면이 흔들려요
// - 폭죽이 화면 아래에서 쏘아 올라가 크게 터져요
// - 픽셀 야구공과 배트가 수십 개 빙글빙글 날아다녀요
// - 거대한 야구공이 화면 쪽으로 날아오고 "HOME RUN!" 글씨가 쾅 찍혀요
function baseballParty() {
  const DURATION = 6000; // 전체 길이 (밀리초)
  const PX = 4; // 픽셀 한 칸 크기 (폭죽 불꽃을 이 크기 칸에 맞춰 그려요)
  const colors = ["#ff8a8a", "#ff4d6d", "#8ec5f5", "#4cc9f0", "#ffd166", "#ffffff", "#b8f2c9"];
  const random = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // 화면 전체를 덮는 판 (클릭은 그대로 통과해요)
  const stage = document.createElement("div");
  stage.className = "party";
  const canvas = document.createElement("canvas");
  const flash = document.createElement("div");
  flash.className = "flash";
  const homerun = document.createElement("p");
  homerun.className = "homerun";
  homerun.textContent = "HOME RUN!";
  stage.append(canvas, flash, homerun);
  document.body.append(stage);

  const ctx = canvas.getContext("2d");
  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false; // 픽셀이 뭉개지지 않게
  }
  resize();
  window.addEventListener("resize", resize);

  // ----- 픽셀 그림 (야구공, 배트) -----
  // 글자 하나가 픽셀 한 칸이에요. X=테두리, W=흰색, R=빨간 실밥
  const ballArt = [
    "....XXXX....",
    "..XXWWWWXX..",
    ".XWRWWWWRWX.",
    ".XRWWWWWWRX.",
    "XWRWWWWWWRWX",
    "XRWWWWWWWWRX",
    "XRWWWWWWWWRX",
    "XWRWWWWWWRWX",
    ".XRWWWWWWRX.",
    ".XWRWWWWRWX.",
    "..XXWWWWXX..",
    "....XXXX....",
  ];
  const palette = { X: "#2b2d42", W: "#ffffff", R: "#e63946" };

  function spriteFromArt(art) {
    const c = document.createElement("canvas");
    c.width = art[0].length;
    c.height = art.length;
    const g = c.getContext("2d");
    art.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (palette[ch]) {
          g.fillStyle = palette[ch];
          g.fillRect(x, y, 1, 1);
        }
      })
    );
    return c;
  }

  // 배트는 대각선으로 점점 굵어지게 계산해서 그려요
  function batSprite() {
    const S = 16;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const cells = []; // 0=빈칸, 1=나무, 2=손잡이 테이프
    for (let y = 0; y < S; y++) cells.push(new Array(S).fill(0));
    for (let t = 0; t <= 1; t += 0.01) {
      const cx = 2 + t * 11.5;
      const cy = 13 - t * 11.5;
      const r = t < 0.35 ? 0.7 : 0.7 + (t - 0.35) * 2.4;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++)
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) cells[y][x] = t < 0.3 ? 2 : 1;
    }
    cells[14][1] = cells[14][2] = cells[13][1] = 2; // 손잡이 끝 둥근 부분
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        if (cells[y][x]) {
          g.fillStyle = cells[y][x] === 2 ? "#3a3a3a" : "#d9a066";
          g.fillRect(x, y, 1, 1);
        } else if (
          [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells[y + dy]?.[x + dx] === 1)
        ) {
          g.fillStyle = "#6b3e1f"; // 나무 테두리
          g.fillRect(x, y, 1, 1);
        }
      }
    return c;
  }

  const ball = spriteFromArt(ballArt);
  const bat = batSprite();

  // ----- 움직이는 것들 -----
  const sparks = [];   // 폭죽 불꽃
  const rockets = [];  // 올라가는 폭죽
  const flyers = [];   // 날아다니는 공, 배트
  const confetti = []; // 위에서 쏟아지는 색종이

  function launchRocket() {
    rockets.push({
      x: random(W * 0.1, W * 0.9),
      y: H + 10,
      vy: -random(H * 0.018, H * 0.026),
      targetY: random(H * 0.12, H * 0.5),
      color: pick(colors),
    });
  }

  function explode(x, y, color) {
    const count = Math.round(random(90, 150));
    const power = Math.min(W, H) * random(0.011, 0.017);
    const second = pick(colors);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * Math.sqrt(Math.random());
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: random(0.012, 0.022),
        color: Math.random() < 0.75 ? color : second,
        size: pick([PX, PX, PX * 2]),
      });
    }
  }

  function launchFlyer() {
    const fromLeft = Math.random() < 0.5;
    flyers.push({
      img: Math.random() < 0.55 ? ball : bat,
      x: fromLeft ? -100 : W + 100,
      y: random(H * 0.3, H * 1.0),
      vx: (fromLeft ? 1 : -1) * random(W * 0.006, W * 0.012),
      vy: -random(H * 0.012, H * 0.024),
      rot: random(0, Math.PI * 2),
      spin: random(0.08, 0.3) * (Math.random() < 0.5 ? 1 : -1),
      scale: Math.round(random(3, 9)), // 픽셀 한 칸을 몇 배로 키울지
    });
  }

  function dropConfetti() {
    confetti.push({
      x: random(0, W),
      y: -20,
      vy: random(2, 5),
      sway: random(0, Math.PI * 2),
      color: pick(colors),
      size: pick([PX, PX * 2]),
    });
  }

  // ----- 큰 장면 연출 -----
  // 1) 시작: 번쩍 + 화면 흔들림
  const shake = [
    { transform: "translate(0, 0)" },
    { transform: "translate(-14px, 8px)" },
    { transform: "translate(12px, -10px)" },
    { transform: "translate(-8px, -6px)" },
    { transform: "translate(6px, 8px)" },
    { transform: "translate(0, 0)" },
  ];
  function boom(strength) {
    flash.animate([{ opacity: strength }, { opacity: 0 }], { duration: 650, easing: "ease-out" });
    document.querySelector(".app").animate(shake, { duration: 550 });
    document.querySelector(".backdrop")?.animate(shake, { duration: 550 });
  }
  boom(0.85);

  // 처음부터 폭죽 여러 개를 한꺼번에 터뜨려요
  for (let i = 0; i < 5; i++) explode(random(W * 0.15, W * 0.85), random(H * 0.15, H * 0.55), pick(colors));

  // 2) 거대한 야구공이 멀리서 화면 쪽으로 날아와요 (0.6초 ~ 2.0초)
  const giant = { start: 600, end: 2000 };

  // 3) 공이 화면에 닿는 순간 "HOME RUN!" 쾅 + 한 번 더 번쩍
  setTimeout(() => {
    boom(1);
    for (let i = 0; i < 6; i++) explode(random(W * 0.1, W * 0.9), random(H * 0.1, H * 0.6), pick(colors));
    homerun.animate(
      [
        { transform: "translate(-50%, -50%) scale(4) rotate(-8deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(0.9) rotate(-4deg)", opacity: 1, offset: 0.12 },
        { transform: "translate(-50%, -50%) scale(1.06) rotate(-4deg)", opacity: 1, offset: 0.2 },
        { transform: "translate(-50%, -50%) scale(1) rotate(-4deg)", opacity: 1, offset: 0.85 },
        { transform: "translate(-50%, -50%) scale(1.3) rotate(-4deg)", opacity: 0 },
      ],
      { duration: 3400, easing: "ease-out", fill: "forwards" }
    );
  }, giant.end);

  // 계속 새로 쏘아 올리고 날려요 (끝나기 1.2초 전까지)
  const timers = [
    setInterval(launchRocket, 260),
    setInterval(launchFlyer, 70),
    setInterval(() => { for (let i = 0; i < 6; i++) dropConfetti(); }, 50),
  ];
  setTimeout(() => timers.forEach(clearInterval), DURATION - 1200);

  // ----- 매 화면마다 그리기 -----
  const startTime = performance.now();
  const snap = (v) => Math.round(v / PX) * PX; // 픽셀 칸에 맞추기

  function frame(now) {
    const elapsed = now - startTime;

    // 이전 화면을 살짝 남겨서 꼬리가 생기게 해요
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    // 올라가는 폭죽
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += r.vy;
      ctx.fillStyle = r.color;
      ctx.fillRect(snap(r.x), snap(r.y), PX, PX * 3);
      if (r.y <= r.targetY) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    // 폭죽 불꽃 (중력으로 천천히 떨어져요)
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= 0.96;
      s.vy = s.vy * 0.96 + 0.12;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life > 0.3 ? 1 : s.life / 0.3;
      if (Math.random() < 0.08) ctx.globalAlpha *= 0.3; // 반짝반짝
      ctx.fillStyle = s.color;
      ctx.fillRect(snap(s.x), snap(s.y), s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // 색종이
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.y += c.vy;
      c.sway += 0.08;
      if (c.y > H + 20) { confetti.splice(i, 1); continue; }
      ctx.fillStyle = c.color;
      ctx.fillRect(snap(c.x + Math.sin(c.sway) * 12), snap(c.y), c.size, c.size);
    }

    // 날아다니는 공, 배트 (포물선을 그리며 빙글빙글)
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += H * 0.0004;
      f.rot += f.spin;
      if (f.y > H + 200 || f.x < -300 || f.x > W + 300) { flyers.splice(i, 1); continue; }
      const size = f.img.width * f.scale;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.round(f.rot / (Math.PI / 8)) * (Math.PI / 8)); // 8방향씩 끊어 돌아서 게임처럼
      ctx.drawImage(f.img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    // 거대한 야구공: 작게 시작해서 화면을 가득 채울 만큼 커져요
    if (elapsed >= giant.start && elapsed <= giant.end) {
      const t = (elapsed - giant.start) / (giant.end - giant.start);
      const eased = t * t * t; // 처음엔 천천히, 마지막에 확!
      const size = Math.max(W, H) * (0.05 + eased * 1.6);
      ctx.save();
      ctx.translate(W * (0.75 - 0.25 * t), H * (0.25 + 0.25 * t));
      ctx.rotate(Math.round((t * 6) / (Math.PI / 8)) * (Math.PI / 8));
      ctx.globalAlpha = t > 0.92 ? (1 - t) / 0.08 : 1;
      ctx.drawImage(ball, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      stage.remove();
    }
  }
  requestAnimationFrame(frame);
}
