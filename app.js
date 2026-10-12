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

  sorted.forEach((todo) => {
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

  // 할 일이 하나도 없으면 문구 보이기
  empty.hidden = todos.length > 0;
}

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
});

render();
