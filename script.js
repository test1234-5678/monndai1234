//////////////////////////////
// グローバル変数
//////////////////////////////

let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;
let answered = false;
let comboCount = 0;

let selectedMode = "normal";
let selectedCount = 5;

const HIGH_SCORE_KEY = "quiz_high_score";
const TODAY_BEST_KEY = "quiz_today_best";

//////////////////////////////
// 初期読み込み
//////////////////////////////

fetch("questions.json")
.then(r => r.json())
.then(data => {

  questions = Array.isArray(data) ? data : [];

  createQuestionListSafe();
  updateProgressRateSafe();
  loadScoresSafe();

})
.catch(err => {
  console.error("JSONエラー:", err);
  questions = [];
});

//////////////////////////////
// モード
//////////////////////////////

function setMode(mode){

  selectedMode = mode;

  ["normal","random","weak"].forEach(m=>{
    const el = document.getElementById("mode-" + m);
    if(el) el.classList.remove("selected");
  });

  const target = document.getElementById("mode-" + mode);
  if(target) target.classList.add("selected");

  updateSettingsSafe();
}

//////////////////////////////
// 問題数
//////////////////////////////

function setCount(count){

  selectedCount = count;

  [5,10,20].forEach(n=>{
    const el = document.getElementById("count-" + n);
    if(el) el.classList.remove("selected");
  });

  const target = document.getElementById("count-" + count);
  if(target) target.classList.add("selected");

  updateSettingsSafe();
}

//////////////////////////////
// 表示更新
//////////////////////////////

function updateSettingsSafe(){

  const el = document.getElementById("settingsText");
  if(!el) return;

  let modeText = "順番";
  if(selectedMode === "random") modeText = "ランダム";
  if(selectedMode === "weak") modeText = "苦手";

  el.innerText = modeText + " / " + selectedCount + "問";
}

//////////////////////////////
// 開始
//////////////////////////////

function startQuiz(){

  correctCount = 0;
  answered = false;
  currentQuestion = 0;
  comboCount = 0;

  let temp = Array.isArray(questions) ? [...questions] : [];

  if(selectedMode === "normal"){
    let saved = localStorage.getItem("quiz_progress_index");
    let startIndex = saved ? parseInt(saved) : 0;
    temp = temp.slice(startIndex);
  }

  if(selectedMode === "random"){
    temp.sort(() => Math.random() - 0.5);
  }

  if(selectedMode === "weak"){
    temp.sort(() => Math.random() - 0.5);
  }

  quizQuestions = temp.filter(q =>
    q &&
    typeof q.question === "string" &&
    Array.isArray(q.choices) &&
    typeof q.answer === "string"
  );

  quizQuestions = quizQuestions.slice(0, selectedCount);

  if(quizQuestions.length === 0){
    alert("問題がありません");
    return;
  }

  showPage("quizPage");
  showQuestionSafe();
}

//////////////////////////////
// 問題表示（最重要）
//////////////////////////////

function showQuestionSafe(){

  answered = false;

  if(!Array.isArray(quizQuestions) || quizQuestions.length === 0){
    console.warn("quizQuestions空");
    return;
  }

  if(currentQuestion < 0) currentQuestion = 0;
  if(currentQuestion >= quizQuestions.length) currentQuestion = 0;

  const q = quizQuestions[currentQuestion];

  if(!q){
    console.warn("問題なし");
    return;
  }

  document.getElementById("question").innerText =
  q.question || "";

  document.getElementById("progress").innerText =
  (currentQuestion + 1) + " / " + quizQuestions.length;

  const choicesDiv = document.getElementById("choices");

  if(!choicesDiv) return;

  choicesDiv.innerHTML = "";

  let choices = Array.isArray(q.choices) ? [...q.choices] : [];

  // ★絶対保証（空防止）
  if(choices.length === 0){
    choices = ["データなし"];
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(c => {

    const btn = document.createElement("button");
    btn.innerText = c;

    btn.onclick = () => checkAnswerSafe(c);

    choicesDiv.appendChild(btn);
  });

  showHistorySafe(q.id);
}

//////////////////////////////
// 回答
//////////////////////////////

function checkAnswerSafe(choice){

  if(answered) return;
  answered = true;

  const q = quizQuestions[currentQuestion];

  let correct = (choice === q.answer);

  const result = document.getElementById("result");

  if(correct){

    correctCount++;
    comboCount++;

    result.innerText =
    "⭕️ 正解！！\nコンボ：" + comboCount;

  } else {

    comboCount = 0;

    result.innerText =
    "❌ 不正解！！\n正解：" + q.answer;
  }

  saveHistorySafe(q.id, correct);
  updateProgressRateSafe();
  loadScoresSafe();
}

//////////////////////////////
// 次へ・戻る
//////////////////////////////

function nextQuestion(){

  if(currentQuestion >= quizQuestions.length - 1){
    finishQuizSafe();
    return;
  }

  currentQuestion++;
  showQuestionSafe();
}

function prevQuestion(){

  if(currentQuestion <= 0) return;

  currentQuestion--;
  showQuestionSafe();
}

//////////////////////////////
// ホーム
//////////////////////////////

function goHome(){

  quizQuestions = [];
  currentQuestion = 0;
  correctCount = 0;
  answered = false;
  comboCount = 0;

  showPage("topPage");
}

//////////////////////////////
// 終了
//////////////////////////////

function finishQuizSafe(){

  showPage("finishPage");

  const rate =
  quizQuestions.length > 0
  ? Math.round(correctCount / quizQuestions.length * 100)
  : 0;

  document.getElementById("finalResult").innerText =
  correctCount + " / " + quizQuestions.length +
  " 正解\n正答率 " + rate + "%";
}

//////////////////////////////
// 画面切替
//////////////////////////////

function showPage(id){

  ["topPage","quizPage","finishPage","listPage"].forEach(p=>{
    const el = document.getElementById(p);
    if(el) el.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if(target) target.classList.remove("hidden");
}

//////////////////////////////
// 履歴
//////////////////////////////

function saveHistorySafe(id, result){

  let h = JSON.parse(localStorage.getItem(id) || "[]");

  h.push(!!result);

  if(h.length > 3) h.shift();

  localStorage.setItem(id, JSON.stringify(h));
}

function showHistorySafe(id){

  const el = document.getElementById("history");
  if(!el) return;

  let h = JSON.parse(localStorage.getItem(id) || "[]");

  el.innerText =
  "過去3回：" + h.map(v => v ? "◯" : "×").join(" ");
}

//////////////////////////////
// 進捗
//////////////////////////////

function updateProgressRateSafe(){

  const el = document.getElementById("progressRate");
  const bar = document.getElementById("progressFill");

  if(!questions.length) return;

  let ok = 0;

  questions.forEach(q=>{
    let h = JSON.parse(localStorage.getItem(q.id) || "[]");
    if(h.length === 3 && h.every(x => x)) ok++;
  });

  let rate = Math.round(ok / questions.length * 100);

  if(el) el.innerText = "進捗率：" + rate + "%";
  if(bar) bar.style.width = rate + "%";
}

//////////////////////////////
// 問題一覧
//////////////////////////////

function createQuestionListSafe(){

  const list = document.getElementById("questionList");
  if(!list) return;

  list.innerHTML = "";

  questions.forEach(q => {

    const btn = document.createElement("button");

    btn.innerText = q.question || "";

    btn.onclick = () => {
      quizQuestions = [q];
      currentQuestion = 0;
      showPage("quizPage");
      showQuestionSafe();
    };

    list.appendChild(btn);
  });
}