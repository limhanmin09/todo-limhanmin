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

// ===== 배경: 시간대 + 계절 + 날씨 =====
// 시간대: 아침(6~10시) / 낮(10~17시) / 저녁(17~20시) / 밤(20~6시)
// 계절: 봄(3~5월) / 여름(6~8월) / 가을(9~11월) / 겨울(12~2월)
// (처음 정하는 건 index.html에서 하고, 여기서는 1분마다 다시 확인해요)
const root = document.documentElement;

function updateTheme() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMonth() + 1;
  root.dataset.theme =
    h >= 6 && h < 10 ? "morning" : h >= 10 && h < 17 ? "day" : h >= 17 && h < 20 ? "evening" : "night";
  root.dataset.season =
    m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
}
setInterval(updateTheme, 60 * 1000);

// 날씨: 위치를 허락하면 Open-Meteo(무료 날씨 서비스)에서 지금 날씨를 받아와요.
// 허락하지 않거나 실패하면 계절 효과만 보여요. 30분마다 다시 확인해요.
function updateWeather() {
  if (!("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const url =
          "https://api.open-meteo.com/v1/forecast" +
          `?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}&current=weather_code`;
        const data = await (await fetch(url)).json();
        root.dataset.weather = weatherKind(data.current.weather_code);
      } catch {
        delete root.dataset.weather; // 실패하면 계절 효과만
      }
    },
    () => delete root.dataset.weather, // 위치 허락 안 함 → 계절 효과만
    { timeout: 10000, maximumAge: 30 * 60 * 1000 }
  );
}

// 날씨 번호(WMO 코드)를 맑음/흐림/비/눈/뇌우 다섯 가지로 묶어요
function weatherKind(code) {
  if (code <= 1) return "clear";
  if (code <= 48) return "cloudy";             // 구름 많음, 흐림, 안개
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "rain";                                // 이슬비, 비, 소나기
}

updateWeather();
setInterval(updateWeather, 30 * 60 * 1000);

// 계절·날씨 효과를 픽셀 네모로 그려요
// 비/눈/뇌우 날씨가 먼저, 아니면 계절: 봄=벚꽃잎, 가을=낙엽, 겨울=눈, 여름 저녁·밤=반딧불
const weatherCanvas = document.getElementById("weather");
const wctx = weatherCanvas.getContext("2d");
const drops = [];

function effectKind() {
  const w = root.dataset.weather;
  if (w === "rain" || w === "storm") return "rain";
  if (w === "snow") return "snow";
  const season = root.dataset.season;
  if (season === "spring") return "petal";
  if (season === "autumn") return "leaf";
  if (season === "winter") return "snow";
  if (root.dataset.theme === "evening" || root.dataset.theme === "night") return "firefly";
  return "none";
}

function newDrop(kind, W, H, anywhere) {
  const palettes = {
    petal: ["#ffc8dd", "#ffafcc", "#fde2e4"],
    leaf: ["#e76f51", "#f4a261", "#e9c46a", "#bc6c25"],
    snow: ["#ffffff", "#eaf4ff"],
    rain: ["rgba(200, 225, 255, 0.7)"],
    firefly: ["#fff59d", "#d4fc79"],
  };
  const colors = palettes[kind];
  return {
    kind,
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : -10,
    speed: kind === "rain" ? 9 + Math.random() * 5 : kind === "firefly" ? 0.3 : 0.6 + Math.random() * 1.2,
    sway: Math.random() * Math.PI * 2,
    size: kind === "rain" ? 3 : kind === "snow" ? (Math.random() < 0.3 ? 9 : 6) : 6,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function drawWeather() {
  const W = weatherCanvas.clientWidth;
  const H = weatherCanvas.clientHeight;
  if (weatherCanvas.width !== W) weatherCanvas.width = W; // 창 크기가 바뀔 때만 다시 맞춰요
  if (weatherCanvas.height !== H) weatherCanvas.height = H;
  const kind = effectKind();
  const target = { none: 0, petal: 40, leaf: 35, snow: 90, rain: 160, firefly: 25 }[kind];

  // 종류가 바뀌면 다시 뿌리고, 개수를 맞춰요
  if (drops.length && drops[0].kind !== kind) drops.length = 0;
  while (drops.length < target) drops.push(newDrop(kind, W, H, true));
  drops.length = Math.min(drops.length, target);

  wctx.clearRect(0, 0, W, H);
  for (const d of drops) {
    d.sway += 0.03;
    if (kind === "firefly") {
      d.x += Math.cos(d.sway) * 0.6;
      d.y += Math.sin(d.sway * 0.7) * 0.4;
      wctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(d.sway * 2));
    } else {
      d.y += d.speed;
      d.x += kind === "rain" ? -1.5 : Math.sin(d.sway) * 0.8;
      wctx.globalAlpha = 1;
    }
    if (d.y > H || d.x < -10 || d.x > W + 10) Object.assign(d, newDrop(kind, W, H, false));
    wctx.fillStyle = d.color;
    const px = Math.round(d.x / 3) * 3; // 픽셀 칸에 맞추기
    const py = Math.round(d.y / 3) * 3;
    if (kind === "rain") wctx.fillRect(px, py, 3, 12);
    else wctx.fillRect(px, py, d.size, d.size);
  }
  wctx.globalAlpha = 1;
  requestAnimationFrame(drawWeather);
}
requestAnimationFrame(drawWeather);

// 뇌우일 때는 가끔 번개가 번쩍여요
setInterval(() => {
  if (root.dataset.weather !== "storm" || Math.random() < 0.6) return;
  document.querySelector(".backdrop").animate(
    [{ filter: "brightness(1)" }, { filter: "brightness(2.2)" }, { filter: "brightness(1)" }, { filter: "brightness(1.8)" }, { filter: "brightness(1)" }],
    { duration: 500, easing: "steps(5)" }
  );
}, 4000);

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

  // 이스터에그: 할 일에 "인택"이 들어가면 낚시꾼이 나와서 연못에 낚싯대를 던져요
  if (text.includes("인택")) fishingParty();

  // 이스터에그: 할 일에 "삭준"이 들어가면 나무가 쑥 커지고 미친 돼지가 질주해요
  if (text.includes("삭준")) sakjunParty();

  // 이스터에그: 할 일에 "예성"이 들어가면 "1꿇" 팻말을 든 강아지가 지나가요
  if (text.includes("예성")) yesungPuppy();

  // 이스터에그: 할 일에 "승리"가 들어가면 배경 글씨가 "What is Love?"로 바뀌고 커플이 지나가요
  if (text.includes("승리")) seungriLove();

  // 이스터에그: 할 일에 "진수"가 들어가면 오른쪽 위에 코 버튼이 생겨요
  if (text.includes("진수") && noseButton.hidden) {
    noseButton.hidden = false;
    noseButton.animate(
      [{ transform: "scale(0)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }],
      { duration: 400, easing: "steps(4)" }
    );
  }
});

// ===== 픽셀 그림 도우미 =====
// 글자 하나가 픽셀 한 칸이에요. "."은 빈칸, 나머지 글자는 colors에서 색을 찾아요.
// outline 색을 주면 그림 바깥에 1칸짜리 테두리를 자동으로 그려요.
function makeSprite(art, colors, outline) {
  const pad = outline ? 1 : 0;
  const canvas = document.createElement("canvas");
  canvas.width = art[0].length + pad * 2;
  canvas.height = art.length + pad * 2;
  const g = canvas.getContext("2d");
  const filled = (x, y) => art[y]?.[x] && art[y][x] !== ".";
  for (let y = -pad; y < art.length + pad; y++) {
    for (let x = -pad; x < art[0].length + pad; x++) {
      if (filled(x, y)) {
        g.fillStyle = colors[art[y][x]];
      } else if (outline && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) {
        g.fillStyle = outline;
      } else {
        continue;
      }
      g.fillRect(x + pad, y + pad, 1, 1);
    }
  }
  return canvas;
}

// 화면(카드와 배경)을 흔들어요
function shakeScreen(duration, power) {
  const frames = [];
  for (let i = 0; i < 10; i++) {
    const p = power * (1 - i / 10);
    frames.push({ transform: `translate(${(Math.random() - 0.5) * p * 2}px, ${(Math.random() - 0.5) * p * 2}px)` });
  }
  frames.push({ transform: "translate(0, 0)" });
  for (const el of document.querySelectorAll(".app, .backdrop")) {
    el.animate(frames, { duration, easing: "steps(10)" });
  }
}

// 🦖 코 버튼을 누르면 거대한 픽셀 공룡이 3초 동안 튀어나와요
// 갑자기 번쩍! → 화면을 꽉 채우며 튀어나옴 → 입을 쩍 벌리고 화면 쪽으로 덤벼듦 → 쑥 내려감
const noseButton = document.getElementById("nose-btn");
noseButton.addEventListener("click", showDino);

let dinoShowing = false; // 공룡이 나와 있는 동안 또 누르면 무시

const dinoArt = [
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
// 입을 쩍 벌린 모습: 빨간 입속(R)과 이빨(W), 눈은 빨갛게(F)
const dinoRoarArt = [
  "..........GGGGGGGG..",
  ".........GGFKGGGGGGG",
  ".........GGGGGGGGGGG",
  ".........GGGGGWGWGWG",
  ".........GGGRRRRRRRR",
  ".........GGRRRRRRR..",
  "G.......GGGRRRRR....",
  "G......GGGGGWGWGW...",
  "GG....GGGGGGGGGG....",
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
const dinoColors = { G: "#5cb85c", E: "#ffffff", K: "#2b2d42", F: "#ff2e2e", R: "#8b1e2d", W: "#ffffff" };

function showDino() {
  if (dinoShowing) return;
  dinoShowing = true;
  noseButton.hidden = true; // 코 버튼은 한 번 누르면 사라져요

  const calm = makeSprite(dinoArt, dinoColors, "#1f5130");
  const roar = makeSprite(dinoRoarArt, dinoColors, "#1f5130");

  // 어두워지는 막 + 번쩍이는 빛 + 공룡 + 고함 글씨
  const dim = document.createElement("div");
  dim.className = "dino-dim";
  const flash = document.createElement("div");
  flash.className = "dino-flash";
  const stage = document.createElement("div");
  stage.className = "dino-stage";
  const canvas = document.createElement("canvas");
  canvas.width = calm.width;
  canvas.height = calm.height;
  const g = canvas.getContext("2d");
  g.drawImage(calm, 0, 0);
  stage.append(canvas);
  const shout = document.createElement("p");
  shout.className = "dino-shout";
  shout.textContent = "크아아앙!!!";
  document.body.append(dim, stage, flash, shout);

  // 1) 갑자기 빨갛게 번쩍 + 크게 흔들림
  flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: "steps(4)" });
  shakeScreen(1600, 28);
  dim.animate(
    [{ opacity: 0 }, { opacity: 0.6, offset: 0.05 }, { opacity: 0.6, offset: 0.85 }, { opacity: 0 }],
    { duration: 3000, fill: "forwards" }
  );

  // 2) 0.1초 만에 화면을 꽉 채우며 튀어나오고, 화면 쪽으로 덤벼들었다가, 마지막에 쑥 내려가요
  stage.animate(
    [
      { transform: "translate(-50%, 100%) scale(1)" },
      { transform: "translate(-50%, 0) scale(1)", offset: 0.03 },
      { transform: "translate(-50%, 0) scale(1)", offset: 0.12 },
      { transform: "translate(-50%, 4%) scale(1.45)", offset: 0.18 },
      { transform: "translate(-50%, 2%) scale(1.35)", offset: 0.3 },
      { transform: "translate(-50%, 4%) scale(1.42)", offset: 0.45 },
      { transform: "translate(-50%, 2%) scale(1.35)", offset: 0.6 },
      { transform: "translate(-50%, 0) scale(1.1)", offset: 0.82 },
      { transform: "translate(-50%, 110%) scale(1)" },
    ],
    { duration: 3000, easing: "steps(45)" }
  ).onfinish = () => {
    dim.remove();
    stage.remove();
    flash.remove();
    shout.remove();
    dinoShowing = false;
  };

  // 3) 덤벼드는 순간 입을 쩍 벌리고 고함 + 하얗게 한 번 더 번쩍
  setTimeout(() => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(roar, 0, 0);
    flash.style.background = "#fff";
    flash.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 350, easing: "steps(3)" });
    shakeScreen(1200, 36);
  }, 360);
  setTimeout(() => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(calm, 0, 0);
  }, 2300);

  shout.animate(
    [
      { opacity: 0, transform: "translate(-50%, 0) scale(3) rotate(-6deg)" },
      { opacity: 0, transform: "translate(-50%, 0) scale(3) rotate(-6deg)", offset: 0.12 },
      { opacity: 1, transform: "translate(-50%, 0) scale(1) rotate(-6deg)", offset: 0.16 },
      { opacity: 1, transform: "translate(-52%, 2px) scale(1.05) rotate(-4deg)", offset: 0.3 },
      { opacity: 1, transform: "translate(-48%, -2px) scale(1) rotate(-8deg)", offset: 0.5 },
      { opacity: 1, transform: "translate(-51%, 2px) scale(1.05) rotate(-5deg)", offset: 0.7 },
      { opacity: 0, transform: "translate(-50%, 0) scale(0.8) rotate(-6deg)", offset: 0.8 },
      { opacity: 0, transform: "translate(-50%, 0) scale(0.8) rotate(-6deg)" },
    ],
    { duration: 3000, easing: "steps(40)", fill: "forwards" }
  );
}

// ===== 🐾 땅 위를 지나가는 픽셀 친구들 =====
// 가끔 하나씩 화면 한쪽에서 반대쪽으로 걸어가요.
// 마우스를 올리거나 누르면 "!" 하고 깜짝 놀라 펄쩍 뛴 다음 반대로 도망가요.
const critterKinds = [
  {
    name: "고양이",
    colors: { O: "#f4a259", K: "#2b2d42", P: "#ff8fab" },
    frames: [
      [
        "........O..O",
        "........OOOO",
        "........OKOK",
        "O.......OOPO",
        "O..OOOOOOOOO",
        ".OOOOOOOOOO.",
        "..OOOOOOOOO.",
        "..OOOOOOOOO.",
        "..O.O...O.O.",
        "..O.O...O.O.",
      ],
      [
        "........O..O",
        "........OOOO",
        "........OKOK",
        ".O......OOPO",
        "O..OOOOOOOOO",
        ".OOOOOOOOOO.",
        "..OOOOOOOOO.",
        "..OOOOOOOOO.",
        "...O.O...O.O",
        "...O.O...O.O",
      ],
    ],
    outline: "#7a3e12",
  },
  {
    name: "병아리",
    colors: { Y: "#ffd23f", K: "#2b2d42", B: "#f77f00" },
    frames: [
      ["..YYYY..", ".YYYYKY.", ".YYYYYYB", "YYYYYYY.", "YYYYYYY.", ".YYYYY..", "..B.B...", "..B.B..."],
      ["..YYYY..", ".YYYYKY.", ".YYYYYYB", "YYYYYYY.", "YYYYYYY.", ".YYYYY..", "..B..B..", ".B...B.."],
    ],
    outline: "#a86b00",
  },
  {
    name: "슬라임",
    colors: { S: "#7bd389", K: "#2b2d42", W: "#ffffff" },
    frames: [
      ["...SSSS...", "..SWSSSS..", ".SSSKSSKS.", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", ".SSSSSSSS."],
      ["..........", "...SSSS...", "..SWSSSSS.", ".SSSKSSKSS", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS"],
    ],
    outline: "#2f7a3e",
  },
  {
    name: "펭귄",
    colors: { K: "#2b2d42", W: "#ffffff", B: "#f77f00", E: "#000000" },
    frames: [
      ["..KKKK..", ".KKKKKK.", ".KKWEKKB", ".KWWWWK.", "KKWWWWKK", "KKWWWWKK", ".KWWWWK.", ".KWWWWK.", "..B..B..", ".BB..BB."],
      ["..KKKK..", ".KKKKKK.", ".KKWEKKB", ".KWWWWK.", "KKWWWWKK", "KKWWWWKK", ".KWWWWK.", ".KWWWWK.", "...BB...", "..BB.BB."],
    ],
    outline: "#000000",
  },
];

// 미리 그림을 만들어 둬요 (그림마다 걷는 모습 2장)
for (const kind of critterKinds) {
  kind.sprites = kind.frames.map((art) => makeSprite(art, kind.colors, kind.outline));
}

const critterLayer = document.getElementById("critters");
const critters = [];

function spawnCritter() {
  if (critters.length >= 4) return; // 한 화면에 최대 4마리
  const kind = critterKinds[Math.floor(Math.random() * critterKinds.length)];
  const scale = 5; // 픽셀 한 칸 = 5px
  const fromLeft = Math.random() < 0.5;

  const el = document.createElement("div");
  el.className = "critter";
  const body = document.createElement("canvas");
  body.width = kind.sprites[0].width;
  body.height = kind.sprites[0].height;
  body.style.width = `${body.width * scale}px`;
  body.style.height = `${body.height * scale}px`;
  const bubble = document.createElement("span");
  bubble.className = "critter-bubble";
  bubble.textContent = "!";
  el.append(bubble, body);
  critterLayer.append(el);

  const critter = {
    el,
    body,
    kind,
    x: fromLeft ? -body.width * scale : window.innerWidth,
    dir: fromLeft ? 1 : -1,
    speed: 40 + Math.random() * 30, // 1초에 몇 px
    frame: 0,
    scared: false,
  };
  critters.push(critter);

  // 건드리면 깜짝!
  const startle = () => {
    if (critter.scared) return;
    critter.scared = true;
    el.classList.add("scared");
    body.animate(
      [
        { transform: `scaleX(${critter.dir}) translateY(0)` },
        { transform: `scaleX(${critter.dir}) translateY(-60px)` },
        { transform: `scaleX(${critter.dir}) translateY(0)` },
      ],
      { duration: 450, easing: "steps(6)" }
    );
    // 놀라서 잠깐 멈췄다가 반대로 4배 빠르게 도망가요
    critter.speed = 0;
    setTimeout(() => {
      critter.dir *= -1;
      critter.speed = 260;
    }, 450);
  };
  el.addEventListener("pointerenter", startle);
  el.addEventListener("pointerdown", startle);
  critter.startle = startle; // 돼지가 지나갈 때도 놀라게 하려고 꺼내 둬요
}

let lastTime = performance.now();
function moveCritters(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  for (let i = critters.length - 1; i >= 0; i--) {
    const c = critters[i];
    c.x += c.dir * c.speed * dt;
    // 걷는 모습 2장을 번갈아 보여줘요 (도망칠 때는 더 빠르게)
    const frame = Math.floor(now / (c.scared ? 90 : 250)) % 2;
    if (frame !== c.frame || !c.drawn) {
      const g = c.body.getContext("2d");
      g.clearRect(0, 0, c.body.width, c.body.height);
      g.drawImage(c.kind.sprites[frame], 0, 0);
      c.frame = frame;
      c.drawn = true;
    }
    c.el.style.transform = `translateX(${Math.round(c.x)}px)`;
    if (!c.body.getAnimations().length) c.body.style.transform = `scaleX(${c.dir})`;
    // 화면 밖으로 나가면 정리
    if (c.x < -200 || c.x > window.innerWidth + 200) {
      c.el.remove();
      critters.splice(i, 1);
    }
  }
  requestAnimationFrame(moveCritters);
}
requestAnimationFrame(moveCritters);

// 처음에는 2초 뒤에 한 마리, 그다음은 4~9초마다 한 마리씩
setTimeout(spawnCritter, 2000);
(function scheduleCritter() {
  setTimeout(() => {
    spawnCritter();
    scheduleCritter();
  }, 4000 + Math.random() * 5000);
})();

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

// 🎣 이스터에그: 약 6.5초 동안 낚시 대참사
// 1) 연못 옆 땅속에서 낚시꾼이 쑥 올라와요
// 2) 낚싯대를 휘둘러 찌를 연못에 던지고, 찌가 까딱까딱
// 3) 찌가 쏙 들어가는 순간 물이 펑! 물고기 수백 마리가 튀어나와 낚시꾼을 덮쳐요
// 4) 물고기 산 위로 "살려줘~!" … 그리고 스르르 사라져요
let fishingNow = false; // 낚시 중에 또 "인택"을 적어도 한 번만

function fishingParty() {
  if (fishingNow) return;
  fishingNow = true;

  const DURATION = 6500;
  const pondEl = document.getElementById("pond");
  const random = (min, max) => min + Math.random() * (max - min);

  // 화면 전체를 덮는 판 (클릭은 그대로 통과해요)
  const stage = document.createElement("div");
  stage.className = "party";
  const canvas = document.createElement("canvas");
  stage.append(canvas);
  document.body.append(stage);
  const ctx = canvas.getContext("2d");
  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener("resize", resize);

  // ----- 픽셀 그림 -----
  // 낚시꾼 (왼쪽 연못을 바라봐요): H=모자, S=피부, K=눈·장화, B=조끼, P=바지
  const fisher = makeSprite(
    [
      "...HHHHH....",
      "..HHHHHHH...",
      ".HHHHHHHHHH.",
      "...SSSSS....",
      "..KSSSSS....",
      "...SSSSS....",
      "....SSS.....",
      "..BBBBBBB...",
      ".SBBBBBBBB..",
      "SSBBBBBBBB..",
      "..BBBBBBBB..",
      "..BBBBBBBB..",
      "..PPPPPPP...",
      "..PPP.PPP...",
      "..PPP.PPP...",
      "..PPP.PPP...",
      "..KKK.KKK...",
      ".KKKK.KKKK..",
    ],
    { H: "#6a994e", S: "#f2c79b", K: "#2b2d42", B: "#e07a5f", P: "#3d5a80" },
    "#2b2d42"
  );
  const FISHER_SCALE = 6;
  const fisherW = fisher.width * FISHER_SCALE;
  const fisherH = fisher.height * FISHER_SCALE;

  // 물고기 4가지 색 (오른쪽을 바라봐요)
  const fishArt = [".FFF..F.", "FFFFF.FF", "FKFFFFF.", "FFFFF.FF", ".FFF..F."];
  const fishSprites = ["#f4a259", "#4cc9f0", "#c0c7d6", "#ff8fab", "#ffd23f"].map((color) =>
    makeSprite(fishArt, { F: color, K: "#2b2d42" }, "#2b2d42")
  );

  // ----- 위치 계산 (연못과 땅 기준) -----
  function layout() {
    const pond = pondEl.getBoundingClientRect();
    const groundTop = H - 56;
    return {
      pondX: pond.left + pond.width / 2,
      pondY: pond.top + pond.height * 0.45,
      groundTop,
      fisherX: pond.right + 40, // 낚시꾼 왼쪽 끝 x
    };
  }

  // ----- 물고기 산 만들기 -----
  // 물고기마다 "튀어나오는 시각"과 "떨어질 자리"를 미리 정해요.
  // 나중에 나온 물고기일수록 산 위쪽에 쌓여서 낚시꾼이 점점 파묻혀요.
  const FISH_COUNT = 260;
  const BURST = 2300; // 물이 펑! 터지는 시각
  const fishes = [];
  for (let i = 0; i < FISH_COUNT; i++) {
    const progress = i / FISH_COUNT;
    fishes.push({
      img: fishSprites[i % fishSprites.length],
      launch: BURST + progress * 1700 + random(0, 80), // 1.7초 동안 계속 튀어나와요
      flight: random(550, 900),
      arc: random(120, 320), // 얼마나 높이 튀는지
      scale: Math.round(random(4, 7)),
      height: Math.pow(progress, 0.8) * fisherH * 1.5 * random(0.85, 1.1), // 산에서의 높이
      side: random(-1, 1), // 산의 왼쪽/오른쪽
      spin: random(-0.3, 0.3),
      flip: Math.random() < 0.5,
    });
  }

  const splashes = []; // 물보라 (파란 네모)
  function splash(x, y, count, power) {
    for (let i = 0; i < count; i++) {
      const a = random(Math.PI * 1.1, Math.PI * 1.9); // 위쪽으로
      const s = random(power * 0.4, power);
      splashes.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, size: Math.random() < 0.3 ? 8 : 4 });
    }
  }

  // 말풍선 (캔버스에 픽셀 글씨로 그려요)
  function bubble(text, x, y, size) {
    ctx.font = `700 ${size}px Galmuri11, "Press Start 2P", monospace`;
    const w = ctx.measureText(text).width + size;
    const h = size * 1.8;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - h);
    ctx.fillStyle = "#2b2d42";
    ctx.fillRect(bx - 4, by - 4, w + 8, h + 8);
    ctx.fillStyle = "#fff";
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = "#2b2d42";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, bx + w / 2, by + h / 2);
  }

  let burstDone = false;
  const start = performance.now();

  function frame(now) {
    const t = Math.max(0, now - start); // 첫 프레임 시각이 시작보다 살짝 이를 수 있어서 0 아래로 안 내려가게
    const L = layout();
    ctx.clearRect(0, 0, W, H);
    // 마지막 0.9초는 스르르 사라져요
    ctx.globalAlpha = t > DURATION - 900 ? Math.max(0, (DURATION - t) / 900) : 1;

    // 1) 낚시꾼이 땅속에서 쑥 (0~0.5초, 뚝뚝 끊어서)
    const rise = Math.min(1, t / 500);
    const riseStep = Math.floor(rise * 8) / 8;
    const fx = Math.round(L.fisherX);
    const fy = Math.round(L.groundTop - fisherH * riseStep);
    // 땅 위로 나온 부분만 그려요
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, L.groundTop);
    ctx.clip();
    ctx.drawImage(fisher, fx, fy, fisherW, fisherH);
    ctx.restore();

    // 2) 낚싯대: 손에서 위쪽으로 뻗어요. 0.9~1.3초에 뒤로 젖혔다 앞으로 휘둘러요
    const handX = fx + FISHER_SCALE;
    const handY = fy + FISHER_SCALE * 9.5;
    let angle = -Math.PI * 0.6; // 기본: 왼쪽 위로
    if (t > 900 && t < 1100) angle = -Math.PI * 0.35; // 뒤로 젖히기
    else if (t >= 1100 && t < 1300) angle = -Math.PI * 0.8; // 앞으로 휘두르기
    if (t > 500) {
      const rodLen = 130;
      const tipX = handX + Math.cos(angle) * rodLen;
      const tipY = handY + Math.sin(angle) * rodLen;
      ctx.fillStyle = "#7f5539";
      for (let s = 0; s <= 1; s += 0.03) {
        ctx.fillRect(Math.round(handX + (tipX - handX) * s), Math.round(handY + (tipY - handY) * s), 5, 5);
      }

      // 3) 찌: 1.3초부터 연못으로 날아가고, 까딱까딱, 2.1초에 쏙!
      if (t > 1300) {
        const fly = Math.min(1, (t - 1300) / 450);
        let bx = tipX + (L.pondX - tipX) * fly;
        let by = tipY + (L.pondY - tipY) * fly - Math.sin(fly * Math.PI) * 90;
        if (fly >= 1) {
          by += t < 2100 ? (Math.floor(t / 250) % 2) * 4 : 14; // 까딱까딱 → 쏙
          if (t >= BURST) by = L.pondY + 30; // 터진 뒤엔 물속으로
        }
        // 낚싯줄 (하얀 점선)
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        for (let s = 0; s <= 1; s += 0.02) {
          const lx = tipX + (bx - tipX) * s;
          const ly = tipY + (by - tipY) * s + Math.sin(s * Math.PI) * 20 * (1 - fly * 0.6);
          ctx.fillRect(Math.round(lx), Math.round(ly), 2, 2);
        }
        if (t < BURST) {
          ctx.fillStyle = "#ff2e2e";
          ctx.fillRect(Math.round(bx) - 6, Math.round(by) - 6, 12, 6);
          ctx.fillStyle = "#fff";
          ctx.fillRect(Math.round(bx) - 6, Math.round(by), 12, 6);
        }
      }
    }

    // 말풍선: 기대 → 깜짝
    if (t > 500 && t < 1300) bubble("오늘은 대어다!", fx + fisherW / 2, fy - 10, 18);
    if (t > 2000 && t < BURST + 300) bubble("!!", fx + fisherW / 2, fy - 10, 26);

    // 4) 펑! 물보라 + 화면 흔들림
    if (t >= BURST && !burstDone) {
      burstDone = true;
      splash(L.pondX, L.pondY, 140, 22);
      shakeScreen(900, 24);
    }
    if (t >= BURST && t < BURST + 1700 && Math.random() < 0.6) splash(L.pondX + random(-60, 60), L.pondY, 6, 14);

    // 물보라 그리기
    for (let i = splashes.length - 1; i >= 0; i--) {
      const p = splashes[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.7;
      p.life -= 0.02;
      if (p.life <= 0 || p.y > H) { splashes.splice(i, 1); continue; }
      ctx.fillStyle = Math.random() < 0.5 ? "#9fd3ff" : "#ffffff";
      ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, p.size, p.size);
    }

    // 5) 물고기: 연못에서 튀어올라 포물선을 그리며 낚시꾼 위로 쌓여요
    const pileX = fx + fisherW / 2;
    for (const f of fishes) {
      if (t < f.launch) continue;
      const fw = f.img.width * f.scale;
      const fh = f.img.height * f.scale;
      const halfWidth = (fisherW * 0.9 + 70) * Math.pow(1 - Math.min(f.height / (fisherH * 1.6), 0.95), 0.7);
      const endX = pileX + f.side * halfWidth;
      const endY = L.groundTop - f.height - fh / 2;
      const p = Math.min(1, (t - f.launch) / f.flight);
      const x = L.pondX + (endX - L.pondX) * p;
      const y = L.pondY + (endY - L.pondY) * p - Math.sin(p * Math.PI) * f.arc;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      // 날아가는 동안은 빙글빙글, 쌓인 뒤에는 파닥파닥
      const wiggle = p < 1 ? f.spin * (t - f.launch) / 60 : Math.sin(t / 80 + f.side * 10) * 0.15;
      ctx.rotate(Math.round(wiggle / (Math.PI / 8)) * (Math.PI / 8));
      if (f.flip) ctx.scale(-1, 1);
      ctx.drawImage(f.img, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
    }

    // 6) 물고기 산 꼭대기에서 "살려줘~!"
    if (t > BURST + 1900 && t < DURATION - 300) {
      const shake = (Math.floor(t / 70) % 2) * 4 - 2;
      bubble("살려줘~!", pileX + shake, L.groundTop - fisherH * 1.75, 24);
    }

    if (t < DURATION) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      stage.remove();
      fishingNow = false;
    }
  }
  requestAnimationFrame(frame);
}

// ===== 🌳 계절 따라 바뀌는 픽셀 나무 =====
// L=잎, D=진한 잎, T=줄기, t=줄기 그늘
const treeArt = [
  ".....LLLLLL.....",
  "...LLLLLLLLLL...",
  "..LLLDLLLLLLLL..",
  ".LLLLLLLLLDLLLL.",
  ".LLDLLLLLLLLLLL.",
  "LLLLLLLLLLLLDLLL",
  "LLLLLLDLLLLLLLLL",
  "LLDLLLLLLLLLLLLL",
  "LLLLLLLLLLDLLLLL",
  ".LLLLLDLLLLLLLL.",
  ".LLLLLLLLLLLDLL.",
  "..DLLLLLLLLLLD..",
  "...DDLLTTLLDD...",
  ".....DDTTDD.....",
  "......TTTT......",
  "......TTtT......",
  "......TTtT......",
  "......TTtT......",
  "......TTtT......",
  ".....TTTtTT.....",
  "....TTT..TTT....",
];
const treeLeaves = {
  spring: { L: "#ffc2d1", D: "#ff8fab" }, // 벚꽃
  summer: { L: "#6ab04c", D: "#3e8e41" }, // 초록 잎
  autumn: { L: "#f4a261", D: "#e76f51" }, // 단풍
  winter: { L: "#f4f8ff", D: "#b9c7dd" }, // 눈 쌓인 나무
};
// 나무 자리(화면 가로 %)와 크기(픽셀 한 칸 크기)
const treeSpots = [
  { left: 0.5, scale: 8 },
  { left: 22, scale: 10 },
  { left: 71, scale: 7 },
  { left: 88, scale: 9 },
];
const treesEl = document.getElementById("trees");
let treeSeason = "";

function drawTrees() {
  const season = root.dataset.season;
  if (season === treeSeason) return; // 계절이 바뀔 때만 다시 그려요
  treeSeason = season;
  const sprite = makeSprite(treeArt, { ...treeLeaves[season], T: "#8b5a2b", t: "#6b4423" }, "#2b2d42");
  treesEl.innerHTML = "";
  for (const spot of treeSpots) {
    const tree = document.createElement("canvas");
    tree.className = "tree";
    tree.width = sprite.width;
    tree.height = sprite.height;
    tree.getContext("2d").drawImage(sprite, 0, 0);
    tree.style.left = `${spot.left}%`;
    tree.style.width = `${sprite.width * spot.scale}px`;
    treesEl.append(tree);
  }
}
drawTrees();
setInterval(drawTrees, 60 * 1000);

// ===== 🐟 연못에서 가끔 물고기가 퐁! 뛰어올라요 =====
const pondFishSprite = makeSprite(
  [".FFF..F.", "FFFFF.FF", "FKFFFFF.", "FFFFF.FF", ".FFF..F."],
  { F: "#f4a259", K: "#2b2d42" },
  "#2b2d42"
);
setInterval(() => {
  if (root.dataset.season === "winter" || Math.random() < 0.4) return; // 겨울엔 얼어서 안 뛰어요
  const pond = document.getElementById("pond");
  const fish = document.createElement("canvas");
  fish.className = "pond-fish";
  fish.width = pondFishSprite.width;
  fish.height = pondFishSprite.height;
  fish.getContext("2d").drawImage(pondFishSprite, 0, 0);
  const startX = 30 + Math.random() * 150;
  fish.style.left = `${startX}px`;
  fish.style.top = "20px";
  pond.parentElement.append(fish);
  fish.animate(
    [
      { transform: "translate(0, 0) rotate(-40deg)" },
      { transform: "translate(24px, -50px) rotate(0deg)" },
      { transform: "translate(48px, 0) rotate(40deg)" },
    ],
    { duration: 900, easing: "steps(9)" }
  ).onfinish = () => fish.remove();
}, 5000);

// ===== 🐱 내 고양이 "보리" =====
// 배부름·목마름·기분·심심함은 0~100. 앞의 셋은 시간이 지나면 줄고, 심심함은 쌓여요 (새로고침하면 처음으로).
const cat = {
  full: 70,
  water: 70,
  mood: 70,
  bored: 30, // 심심함: 높을수록 심심해요. 놀아주면 확 줄어요

  busy: false, // 밥이나 물을 먹는 중
  happyUntil: 0,
};
const catCanvas = document.getElementById("cat");
const catBubble = document.getElementById("cat-bubble");
const towerEl = document.querySelector(".tower");
const bowlFood = document.getElementById("bowl-food");
const bowlWater = document.getElementById("bowl-water");

// 앉아 있는 치즈 고양이 (앞모습): C=털, S=줄무늬, W=흰 털, K=눈, P=코
const catBase = [
  ".C..........C.",
  ".CC........CC.",
  ".CCC......CCC.",
  ".CCCCCCCCCCCC.",
  "CCSCCCCCCCCSCC",
  "CCKKCCCCCCKKCC",
  "CCKKCCCCCCKKCC",
  "CCCCCWPPWCCCCC",
  ".CCCCWWWWCCCC.",
  "..CCCCCCCCCC..",
  ".CCCCWWWWCCCC.",
  ".CCCWWWWWWCCC.",
  ".CCCWWWWWWCCCC",
  ".CC.WW..WW.CCC",
];
const catColors = { C: "#f4a259", S: "#d9822b", W: "#fff3e0", K: "#2b2d42", P: "#ff8fab" };
const withEyes = (row5, row6) => catBase.map((r, i) => (i === 5 ? row5 : i === 6 ? row6 : r));
const catFaces = {
  idle: makeSprite(catBase, catColors, "#7a3e12"),
  blink: makeSprite(withEyes("CCCCCCCCCCCCCC", "CCKKCCCCCCKKCC"), catColors, "#7a3e12"),
  happy: makeSprite(withEyes("CCCKCCCCCCKCCC", "CCKCKCCCCKCKCC"), catColors, "#7a3e12"), // ^ ^
};
catCanvas.width = catFaces.idle.width;
catCanvas.height = catFaces.idle.height;

function drawCat(face) {
  const g = catCanvas.getContext("2d");
  g.clearRect(0, 0, catCanvas.width, catCanvas.height);
  g.drawImage(catFaces[face], 0, 0);
}
drawCat("idle");

// 가끔 눈을 깜빡여요 (기분 좋을 때는 ^ ^)
setInterval(() => {
  if (Date.now() < cat.happyUntil) return;
  drawCat("blink");
  setTimeout(() => drawCat(Date.now() < cat.happyUntil ? "happy" : "idle"), 180);
}, 3500);

function updateGauges() {
  document.getElementById("g-full").style.width = `${cat.full}%`;
  document.getElementById("g-water").style.width = `${cat.water}%`;
  document.getElementById("g-mood").style.width = `${cat.mood}%`;
  document.getElementById("g-bored").style.width = `${cat.bored}%`;
}
updateGauges();

const clamp = (v) => Math.max(0, Math.min(100, v));

// 고양이 머리 위에 말풍선을 잠깐 띄워요
let bubbleTimer;
function catSay(text, ms = 1600) {
  catBubble.textContent = text;
  catBubble.style.left = `${catCanvas.offsetLeft + catCanvas.offsetWidth / 2}px`;
  catBubble.style.bottom = `${parseFloat(getComputedStyle(catCanvas).bottom) + catCanvas.offsetHeight + 8}px`;
  catBubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => (catBubble.hidden = true), ms);
}

function beHappy(ms) {
  cat.happyUntil = Date.now() + ms;
  drawCat("happy");
  setTimeout(() => {
    if (Date.now() >= cat.happyUntil) drawCat("idle");
  }, ms + 20);
}

// 쓰다듬기 (보리를 직접 누르면): 하트가 뿅뿅, 골골골~
let lastPet = 0;
function petCat() {
  if (Date.now() - lastPet < 500) return;
  lastPet = Date.now();
  cat.mood = clamp(cat.mood + 15);
  cat.bored = clamp(cat.bored - 10); // 쓰다듬어 주면 심심함이 조금 줄어요
  updateGauges();
  beHappy(2000);
  catSay(pick(["골골골~", "그르릉~", "냐아~♥", "더 해줘옹"]));
  // 고양이가 살짝 들썩
  catCanvas.animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }],
    { duration: 300, easing: "steps(3)" }
  );
  for (let i = 0; i < 4; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "♥";
    heart.style.left = `${catCanvas.offsetLeft + 20 + Math.random() * 40}px`;
    heart.style.bottom = `${parseFloat(getComputedStyle(catCanvas).bottom) + 60}px`;
    towerEl.append(heart);
    heart.animate(
      [
        { transform: "translate(0, 0)", opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 40}px, -70px)`, opacity: 0 },
      ],
      { duration: 900 + i * 150, easing: "steps(8)" }
    ).onfinish = () => heart.remove();
  }
}

// 놀아주기: 장난감이 마구 흔들리고 보리가 폴짝폴짝 세 번 뛰어요
// 신나게 놀면 기분은 오르고 심심함은 확 줄고, 배와 목은 조금 고파져요
let lastPlay = 0;
function playCat() {
  if (Date.now() - lastPlay < 1200) return;
  if (cat.busy) {
    catSay("먹는 중이다옹!");
    return;
  }
  lastPlay = Date.now();
  cat.mood = clamp(cat.mood + 15);
  cat.bored = clamp(cat.bored - 30);
  cat.full = clamp(cat.full - 3);
  cat.water = clamp(cat.water - 3);
  updateGauges();
  beHappy(1800);
  catSay(pick(["냥냥! 신난다옹!", "잡았다옹!", "한 번 더 하자옹!", "우다다다!"]));

  // 장난감이 빠르게 휙휙
  document.querySelector(".ct-toy").animate(
    [{ transform: "rotate(-35deg)" }, { transform: "rotate(35deg)" }, { transform: "rotate(-25deg)" }, { transform: "rotate(25deg)" }, { transform: "rotate(0deg)" }],
    { duration: 900, easing: "steps(8)" }
  );

  // 보리가 폴짝폴짝 세 번 (뚝뚝 끊어서)
  const start = performance.now();
  function hop(now) {
    const t = Math.max(0, now - start);
    const p = Math.min(1, t / 900);
    const height = Math.abs(Math.sin(p * Math.PI * 3)) * 28; // 세 번 튀어오르기
    catCanvas.style.transform = `translateY(${-Math.round(height / 4) * 4}px)`;
    if (p < 1) requestAnimationFrame(hop);
    else catCanvas.style.transform = "";
  }
  requestAnimationFrame(hop);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 고양이가 폴짝 뛰어서 다른 자리로 가요 (left, bottom은 캣타워 안의 px)
const SPOTS = {
  top: { left: 24, bottom: 330 },
  food: { left: 84, bottom: 26 },
  water: { left: 208, bottom: 26 },
};
// 포물선을 그리며 10번에 나눠 뚝뚝 움직여요 (게임처럼)
function jumpTo(spot) {
  const from = { left: catCanvas.offsetLeft, bottom: parseFloat(getComputedStyle(catCanvas).bottom) };
  const to = SPOTS[spot];
  const peak = Math.max(from.bottom, to.bottom) + 50;
  const DURATION = 650;
  const start = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      const p = Math.min(1, Math.floor(((now - start) / DURATION) * 10) / 10);
      const left = from.left + (to.left - from.left) * p;
      // 처음 높이 → 꼭대기 → 도착 높이를 잇는 포물선
      const bottom = (1 - p) * (1 - p) * from.bottom + 2 * (1 - p) * p * (2 * peak - (from.bottom + to.bottom) / 2) + p * p * to.bottom;
      catCanvas.style.left = `${left}px`;
      catCanvas.style.bottom = `${bottom}px`;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

// 밥주기/물주기: 그릇을 채우면 고양이가 내려와서 먹고 다시 올라가요
async function serve(kind) {
  if (cat.busy) return;
  const isFood = kind === "food";
  if ((isFood ? cat.full : cat.water) >= 95) {
    catSay(isFood ? "배불러옹~" : "목 안 말라옹~");
    return;
  }
  cat.busy = true;
  const bowl = isFood ? bowlFood : bowlWater;
  bowl.classList.add("full");
  catSay(isFood ? "밥이다옹!" : "물이다옹!", 900);
  await new Promise((r) => setTimeout(r, 500));
  await jumpTo(kind);
  catSay(isFood ? "냠냠냠…" : "할짝할짝…", 2000);
  beHappy(2600);
  await new Promise((r) => setTimeout(r, 2000));
  bowl.classList.remove("full");
  if (isFood) cat.full = clamp(cat.full + 35);
  else cat.water = clamp(cat.water + 35);
  cat.mood = clamp(cat.mood + 5);
  updateGauges();
  await jumpTo("top");
  catSay("잘 먹었다옹♥");
  cat.busy = false;
}

catCanvas.addEventListener("click", petCat);
document.getElementById("btn-play").addEventListener("click", playCat);
document.getElementById("btn-feed").addEventListener("click", () => serve("food"));
document.getElementById("btn-water").addEventListener("click", () => serve("water"));

// 20초마다 배고픔·목마름·기분이 조금씩 줄고 심심함은 쌓여요. 부족하면 졸라요
// 심심함이 80 넘게 쌓이면 기분이 더 빨리 떨어져요
setInterval(() => {
  cat.full = clamp(cat.full - 3);
  cat.water = clamp(cat.water - 4);
  cat.bored = clamp(cat.bored + 6);
  cat.mood = clamp(cat.mood - (cat.bored >= 80 ? 5 : 2));
  updateGauges();
  if (cat.busy) return;
  if (cat.full < 30) catSay("배고파옹…", 2500);
  else if (cat.water < 30) catSay("목말라옹…", 2500);
  else if (cat.bored >= 70) catSay(pick(["심심하다옹…", "놀아줘옹!", "장난감 흔들어줘옹…"]), 2500);
  else if (cat.mood < 30) catSay("기분이 별로다옹…", 2500);
}, 20000);

// ===== 🐷 "삭준" 이스터에그 =====
// 나무들이 1초 동안 엄청 커졌다가 돌아오고, 화난 돼지가 오른쪽에서 왼쪽으로 한 번 질주해요
let sakjunNow = false;

const pigColors = { P: "#ff8fa3", D: "#e5537a", K: "#2b2d42", R: "#c1121f" };
const pigBody = [
  "...DD...........",
  "..DPRRPPPPPPPP..",
  ".PPRKPPPPPPPPPP.",
  "DDPPPPPPPPPPPPPP",
  "DDPPPPPPPPPPPPPD",
  "DDPPPPPPPPPPPPP.",
  ".PPPPPPPPPPPPPP.",
  "..PPPPPPPPPPPP..",
];
const pigFrames = [
  makeSprite([...pigBody, "..PP.PP...PP.PP.", "..PP.PP...PP.PP.", "..KK.KK...KK.KK."], pigColors, "#7a1f35"),
  makeSprite([...pigBody, "...PP.PP..PP.PP.", ".PP...PP.PP...PP", ".KK...KK.KK...KK"], pigColors, "#7a1f35"),
];

function sakjunParty() {
  if (sakjunNow) return;
  sakjunNow = true;

  // 1) 나무가 1초 동안 쑥쑥 커졌다가 돌아와요
  for (const tree of document.querySelectorAll(".tree")) {
    tree.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(3.2)", offset: 0.4 },
        { transform: "scale(2.8)", offset: 0.6 },
        { transform: "scale(1)" },
      ],
      { duration: 1000, easing: "steps(12)" }
    );
  }

  // 나무가 커지는 1초 동안 화면 가운데에 커다란 "싹"이 스르르 나타났다 사라져요
  const sak = document.createElement("p");
  sak.className = "sak-text";
  sak.textContent = "싹";
  document.body.append(sak);
  setTimeout(() => sak.remove(), 1000);

  // 2) 1초 뒤 돼지 질주 (약 1.8초)
  setTimeout(runPig, 1000);
}

function runPig() {
  const stage = document.createElement("div");
  stage.className = "party";
  const canvas = document.createElement("canvas");
  stage.append(canvas);
  document.body.append(stage);
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);
  ctx.imageSmoothingEnabled = false;

  const SCALE = 9;
  const pw = pigFrames[0].width * SCALE;
  const ph = pigFrames[0].height * SCALE;
  const groundTop = H - 56;
  const RUN = 1800;
  const dust = [];
  const steam = [];
  const start = performance.now();
  shakeScreen(RUN, 10);

  function frame(now) {
    const t = Math.max(0, now - start); // 첫 프레임 시각이 시작보다 살짝 이를 수 있어서 0 아래로 안 내려가게
    const p = t / RUN;
    const x = W + 40 - (W + pw + 80) * p; // 오른쪽 → 왼쪽
    const hop = (Math.floor(t / 70) % 2) * 6; // 쿵쾅쿵쾅
    const y = groundTop - ph - hop;
    ctx.clearRect(0, 0, W, H);

    // 뒤로 날리는 흙먼지
    if (Math.random() < 0.9) {
      dust.push({ x: x + pw - 10, y: groundTop - 10, vx: 3 + Math.random() * 5, vy: -Math.random() * 4, life: 1 });
    }
    // 머리에서 뿜어 나오는 화난 김
    if (Math.random() < 0.5) {
      steam.push({ x: x + 30, y: y - 10, vx: -1 + Math.random() * 2, vy: -2 - Math.random() * 2, life: 1 });
    }
    for (const list of [dust, steam]) {
      for (let i = list.length - 1; i >= 0; i--) {
        const d = list[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += list === dust ? 0.2 : -0.02;
        d.life -= 0.03;
        if (d.life <= 0) { list.splice(i, 1); continue; }
        ctx.globalAlpha = d.life;
        ctx.fillStyle = list === dust ? "#b08968" : "#ffffff";
        const s = list === dust ? 8 : 10;
        ctx.fillRect(Math.round(d.x / 4) * 4, Math.round(d.y / 4) * 4, s, s);
      }
    }
    ctx.globalAlpha = 1;

    // 돼지 (다리 2장을 빠르게 번갈아)
    ctx.drawImage(pigFrames[Math.floor(t / 60) % 2], Math.round(x), Math.round(y), pw, ph);

    // 화난 말풍선
    ctx.font = '700 26px Galmuri11, "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = "꾸에에엑!!!";
    const tw = ctx.measureText(text).width + 24;
    const bx = Math.round(x + pw / 2 - tw / 2);
    const by = Math.round(y - 70);
    ctx.fillStyle = "#2b2d42";
    ctx.fillRect(bx - 4, by - 4, tw + 8, 52);
    ctx.fillStyle = "#fff";
    ctx.fillRect(bx, by, tw, 44);
    ctx.fillStyle = "#c1121f";
    ctx.fillText(text, bx + tw / 2, by + 23);

    // 지나가는 길에 있는 픽셀 친구들은 깜짝 놀라요
    for (const c of critters) {
      if (Math.abs(c.x - x) < 160) c.startle?.();
    }

    if (t < RUN + 400) {
      requestAnimationFrame(frame);
    } else {
      stage.remove();
      sakjunNow = false;
    }
  }
  requestAnimationFrame(frame);
}

// ===== 🐶 "예성" 이스터에그 =====
// "1꿇" 팻말을 입에 문 강아지가 왼쪽에서 오른쪽으로 총총총 지나가요 (약 6초)
const puppyColors = { B: "#c68642", W: "#fff3e0", K: "#2b2d42", E: "#8b5a2b" };
const puppyBody = [
  "..........BB..",
  ".........BBBB.",
  "........EBBKBB",
  "B.......EBBBBK",
  "B.......BBBWW.",
  ".BBBBBBBBBBB..",
  ".BBBBBBBBBBB..",
  ".BWWWWWWWBB...",
];
const puppyFrames = [
  makeSprite([...puppyBody, ".B.B....B.B...", ".B.B....B.B..."], puppyColors, "#5c3d2e"),
  makeSprite([...puppyBody, "..B.B..B.B....", "..B.B..B.B...."], puppyColors, "#5c3d2e"),
];
let puppyNow = false;

function yesungPuppy() {
  if (puppyNow) return;
  puppyNow = true;

  const SCALE = 7;
  const el = document.createElement("div");
  el.className = "puppy";
  const sign = document.createElement("div");
  sign.className = "puppy-sign";
  sign.innerHTML = "<span>1꿇</span>";
  const body = document.createElement("canvas");
  body.width = puppyFrames[0].width;
  body.height = puppyFrames[0].height;
  body.style.width = `${body.width * SCALE}px`;
  body.style.height = `${body.height * SCALE}px`;
  el.append(sign, body);
  document.body.append(el);

  const g = body.getContext("2d");
  const width = body.width * SCALE;
  const DURATION = 6000;
  const start = performance.now();
  let frame = -1;

  function walk(now) {
    const t = Math.max(0, now - start);
    const p = Math.min(1, t / DURATION);
    const x = -width - 40 + (window.innerWidth + width + 80) * p; // 왼쪽 → 오른쪽
    const bounce = (Math.floor(t / 150) % 2) * 4; // 총총총
    el.style.transform = `translate(${Math.round(x)}px, ${-bounce}px)`;
    const f = Math.floor(t / 150) % 2;
    if (f !== frame) {
      g.clearRect(0, 0, body.width, body.height);
      g.drawImage(puppyFrames[f], 0, 0);
      frame = f;
    }
    if (p < 1) requestAnimationFrame(walk);
    else {
      el.remove();
      puppyNow = false;
    }
  }
  requestAnimationFrame(walk);
}

// ===== 💕 "승리" 이스터에그 =====
// 배경의 "JESUS loves you"가 2초 동안 "What is Love?"로 바뀌고,
// 손을 꼭 잡은 남녀 커플이 하트를 뿅뿅 날리며 왼쪽에서 오른쪽으로 걸어가요 (약 7초)
// H=머리, S=피부, K=눈, M=입, B=셔츠, P=바지, F=신발 / L=긴 머리, R=리본, D=원피스
const boyColors = { H: "#4a3728", S: "#f2c79b", K: "#2b2d42", M: "#e5737f", B: "#4ba3e3", P: "#3d5a80", F: "#2b2d42" };
const girlColors = { L: "#6b3e26", R: "#ff4d6d", S: "#f2c79b", K: "#2b2d42", M: "#e5737f", D: "#ff8fab", F: "#c1121f" };
const boyTop = [
  "..HHHHHH..",
  ".HHHHHHHH.",
  ".HSSSSSSH.",
  ".SSKSSKSS.",
  ".SSSSSSSS.",
  "..SSMMSS..",
  "...SSSS...",
  "..BBBBBB..",
  ".SBBBBBBS.",
  ".SBBBBBBS.",
  "..BBBBBB..",
  "..PPPPPP..",
];
const girlTop = [
  "..LLRRLL..",
  ".LLLLLLLL.",
  "LLSSSSSSLL",
  "LSSKSSKSSL",
  "LSSSSSSSSL",
  "LLSSMMSSLL",
  "LL.SSSS.LL",
  "..DDDDDD..",
  ".SDDDDDDS.",
  ".SDDDDDDS.",
  ".DDDDDDDD.",
  "DDDDDDDDDD",
];
const boyFrames = [
  makeSprite([...boyTop, "..PP..PP..", "..PP..PP..", "..FF..FF.."], boyColors, "#2b2d42"),
  makeSprite([...boyTop, ".PP...PP..", ".PP...PP..", ".FF...FF.."], boyColors, "#2b2d42"),
];
const girlFrames = [
  makeSprite([...girlTop, "...S..S...", "...S..S...", "..FF..FF.."], girlColors, "#2b2d42"),
  makeSprite([...girlTop, "..S....S..", "..S....S..", ".FF....FF."], girlColors, "#2b2d42"),
];
let loveNow = false;

function seungriLove() {
  if (loveNow) return;
  loveNow = true;

  // 1) 배경 글씨를 2초 동안 "What is Love?"로
  const jesus = document.querySelector(".jesus");
  const original = jesus.innerHTML;
  jesus.innerHTML = "What is<span>Love?</span>";
  jesus.classList.add("love");
  setTimeout(() => {
    jesus.innerHTML = original;
    jesus.classList.remove("love");
  }, 2000);

  // 2) 손잡은 커플: 남자가 왼쪽, 여자가 오른쪽 (가운데 손이 맞닿아요)
  const SCALE = 6;
  const el = document.createElement("div");
  el.className = "couple";
  const boy = document.createElement("canvas");
  const girl = document.createElement("canvas");
  for (const c of [boy, girl]) {
    c.width = boyFrames[0].width;
    c.height = boyFrames[0].height;
    c.style.width = `${c.width * SCALE}px`;
    c.style.height = `${c.height * SCALE}px`;
  }
  el.append(boy, girl);
  document.body.append(el);

  const width = boy.width * SCALE * 2;
  const DURATION = 7000;
  const start = performance.now();
  let frame = -1;
  let lastHeart = 0;

  function walk(now) {
    const t = Math.max(0, now - start);
    const p = Math.min(1, t / DURATION);
    const x = -width - 40 + (window.innerWidth + width + 80) * p; // 왼쪽 → 오른쪽
    el.style.transform = `translateX(${Math.round(x)}px)`;

    // 두 사람이 엇갈려 통통 걸어요
    const f = Math.floor(t / 220) % 2;
    if (f !== frame) {
      frame = f;
      for (const [canvas, frames, step] of [[boy, boyFrames, f], [girl, girlFrames, 1 - f]]) {
        const g = canvas.getContext("2d");
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(frames[step], 0, 0);
      }
      boy.style.transform = `translateY(${-f * 4}px)`;
      girl.style.transform = `translateY(${-(1 - f) * 4}px)`;
    }

    // 머리 위로 하트가 뿅뿅
    if (t - lastHeart > 280) {
      lastHeart = t;
      const heart = document.createElement("span");
      heart.className = "love-heart";
      heart.textContent = "♥";
      heart.style.left = `${Math.round(x + width / 2 + (Math.random() - 0.5) * 60)}px`;
      document.body.append(heart);
      const drift = (Math.random() - 0.5) * 50;
      const hStart = performance.now();
      (function rise(n) {
        const q = Math.min(1, (n - hStart) / 1400);
        heart.style.transform = `translate(${Math.round(drift * q)}px, ${-Math.round(q * 90 / 4) * 4}px)`;
        heart.style.opacity = String(1 - q);
        if (q < 1) requestAnimationFrame(rise);
        else heart.remove();
      })(hStart);
    }

    if (p < 1) requestAnimationFrame(walk);
    else {
      el.remove();
      loveNow = false;
    }
  }
  requestAnimationFrame(walk);
}
