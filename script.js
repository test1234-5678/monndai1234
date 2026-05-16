let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;
let answered = false;

let comboCount = 0;
let selectedMode = "normal";
let selectedCount = 5;

// ======================
// スコアキー
// ======================
const HIGH_SCORE_KEY = "quiz_high_score";
const TODAY_BEST_KEY = "quiz_today_best";
const TODAY_DATE_KEY = "quiz_today_date";

// ======================
// 初期読み込み
// ======================
fetch("questions.json")
.then(r => r.json())
.then(data => {

  questions = data;

  createQuestionList();
  updateProgressRate();
  loadScores();

})
.catch(err => {
  console.error("JSON読み込みエラー:", err);
});

// ======================
// モード
// ======================
function setMode(mode){

  selectedMode = mode;

  document.getElementById("mode-normal").classList.remove("selected");
  document.getElementById("mode-random").classList.remove("selected");
  document.getElementById("mode-weak").classList.remove("selected");

  document.getElementById("mode-" + mode).classList.add("selected");

  updateSettings();
  loadScores();
}

// ======================
// 問題数
// ======================
function setCount(count){

  selectedCount = count;

  document.getElementById("count-5").classList.remove("selected");
  document.getElementById("count-10").classList.remove("selected");
  document.getElementById("count-20").classList.remove("selected");

  document.getElementById("count-" + count).classList.add("selected");

  updateSettings();
  loadScores();
}

// ======================
// 表示更新
// ======================
function updateSettings(){

  let modeText = "";

  if(selectedMode === "normal") modeText = "順番";
  if(selectedMode === "random") modeText = "ランダム";
  if(selectedMode === "weak") modeText = "苦手";

  document.getElementById("settingsText").innerText =
  modeText + " / " + selectedCount + "問";
}

// ======================
// 開始
// ======================
function startQuiz(){

  correctCount = 0;
  answered = false;

  let temp = [...questions];

  if(selectedMode === "normal"){
    let saved = localStorage.getItem("quiz_progress_index");
    let startIndex = saved ? parseInt(saved) : 0;
    temp = questions.slice(startIndex);
  }

  if(selectedMode === "random"){
    temp.sort(() => Math.random() - 0.5);
  }

  if(selectedMode === "weak"){
    temp.sort((a,b) => getRate(a.id) - getRate(b.id));
  }

  // ★安全化
  quizQuestions = temp
    .filter(q => q && q.choices && q.choices.length > 0)
    .slice(0, selectedCount);

  currentQuestion = 0;

  showPage("quizPage");
  showQuestion();
  loadScores();
}

// ======================
// 問題表示（完全安定版）
// ======================
function showQuestion(){

  answered = false;

  if(!quizQuestions || quizQuestions.length === 0){
    console.error("問題がありません");
    return;
  }

  const q = quizQuestions[currentQuestion];

  if(!q || !q.choices){
    console.error("問題データ異常:", q);
    return;
  }

  document.getElementById("progress").innerText =
  (currentQuestion + 1) + " / " + quizQuestions.length;

  const globalIndex = questions.indexOf(q);

  document.getElementById("questionNumber").innerText =
  "問題 " + (globalIndex + 1);

  document.getElementById("question").innerText = q.question;

  showHistory(q.id);

  document.getElementById("result").innerText = "";

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  let choices = Array.isArray(q.choices) ? [...q.choices] : [];

  if(choices.length === 0){
    console.error("選択肢なし:", q);
    return;
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(choice => {

    if(choice === undefined) return;

    const btn = document.createElement("button");
    btn.innerText = choice;
    btn.onclick = () => checkAnswer(choice);
    choicesDiv.appendChild(btn);

  });

  loadScores();
}

// ======================
// 回答
// ======================
function checkAnswer(choice){

  if(answered) return;

  answered = true;

  const q = quizQuestions[currentQuestion];
  const quizPage = document.getElementById("quizPage");

  let correct = false;

  if(choice === q.answer){

    correct = true;
    correctCount++;
    comboCount++;

    document.getElementById("result").innerText =
    "⭕️ 正解！！\nコンボ：" + comboCount + " " + getTitle(comboCount);

    quizPage.classList.add("correct-flash");

  }else{

    comboCount = 0;

    document.getElementById("result").innerText =
    "❌ 不正解！！\n正解：" + q.answer;

    quizPage.classList.add("wrong-shake");
  }

  updateHighScore(comboCount);
  updateTodayScore(comboCount);

  saveHistory(q.id, correct);
  createQuestionList();
  updateProgressRate();

  loadScores();

  setTimeout(() => {
    quizPage.classList.remove("correct-flash");
    quizPage.classList.remove("wrong-shake");
  }, 500);
}

// ======================
// 称号
// ======================
function getTitle(c){

  if(c >= 100) return "👑 LEGEND";
  if(c >= 50) return "🔥 MASTER";
  if(c >= 20) return "🚀 EXPERT";
  if(c >= 5) return "⭐ GOOD";
  return "";
}

// ======================
// ハイスコア
// ======================
function updateHighScore(c){

  let high = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);

  if(c > high){
    localStorage.setItem(HIGH_SCORE_KEY, c);
  }
}

// ======================
// 今日スコア
// ======================
function updateTodayScore(c){

  let today = new Date().toDateString();
  let saved = localStorage.getItem(TODAY_DATE_KEY);

  if(saved !== today){
    localStorage.setItem(TODAY_DATE_KEY, today);
    localStorage.setItem(TODAY_BEST_KEY, 0);
  }

  let best = parseInt(localStorage.getItem(TODAY_BEST_KEY) || 0);

  if(c > best){
    localStorage.setItem(TODAY_BEST_KEY, c);
  }
}

// ======================
// スコア表示（安全）
// ======================
function loadScores(){

  const r1 = document.getElementById("row1");
  const r2 = document.getElementById("row2");

  if(!r1 || !r2) return;

  let high = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  let today = parseInt(localStorage.getItem(TODAY_BEST_KEY) || 0);

  r1.innerText =
  "現在の連続正答数：" + comboCount +
  "    今日の最高：" + today;

  r2.innerText =
  "ハイスコア：" + high +
  "    称号：" + getTitle(high);
}

// ======================
// 次へ
// ======================
function nextQuestion(){

  if(currentQuestion >= quizQuestions.length - 1){
    finishQuiz();
    return;
  }

  currentQuestion++;
  showQuestion();
}

// ======================
// 戻る
// ======================
function prevQuestion(){

  if(currentQuestion === 0) return;

  currentQuestion--;
  showQuestion();
}

// ======================
// ホーム
// ======================
function goHome(){

  quizQuestions = [];
  currentQuestion = 0;
  correctCount = 0;
  answered = false;
  comboCount = 0;

  showPage("topPage");
  loadScores();
}

// ======================
// 終了
// ======================
function finishQuiz(){

  showPage("finishPage");

  const rate =
  Math.round(correctCount / quizQuestions.length * 100);

  document.getElementById("finalResult").innerText =
  correctCount + " / " + quizQuestions.length +
  " 正解\n正答率 " + rate + "%";

  loadScores();
}

// ======================
// 画面切替
// ======================
function showPage(id){

  document.getElementById("topPage").classList.add("hidden");
  document.getElementById("quizPage").classList.add("hidden");
  document.getElementById("finishPage").classList.add("hidden");
  document.getElementById("listPage").classList.add("hidden");

  document.getElementById(id).classList.remove("hidden");
}