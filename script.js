//////////////////////////////
// 1. グローバル変数
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
const TODAY_DATE_KEY = "quiz_today_date";

//////////////////////////////
// 2. 初期読み込み
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
// 3. モード設定
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
  loadScoresSafe();
}

//////////////////////////////
// 4. 問題数設定
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
  loadScoresSafe();
}

//////////////////////////////
// 5. 設定表示
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
// 6. 開始処理
//////////////////////////////

function startQuiz(){

  correctCount = 0;
  answered = false;
  currentQuestion = 0;

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
    temp.sort((a,b) => getRateSafe(a.id) - getRateSafe(b.id));
  }

  // ★絶対に空にしない
  quizQuestions = temp.filter(q =>
    q && q.question && Array.isArray(q.choices)
  );

  quizQuestions = quizQuestions.slice(0, selectedCount);

  if(quizQuestions.length === 0){
    alert("問題がありません");
    return;
  }

  showPageSafe("quizPage");
  showQuestionSafe();
  loadScoresSafe();
}

//////////////////////////////
// 7. 問題表示
//////////////////////////////

function showQuestionSafe(){

  answered = false;

  const q = quizQuestions[currentQuestion];

  if(!q){
    console.error("問題なし");
    return;
  }

  const progress = document.getElementById("progress");
  if(progress){
    progress.innerText =
    (currentQuestion + 1) + " / " + quizQuestions.length;
  }

  const question = document.getElementById("question");
  if(question){
    question.innerText = q.question || "";
  }

  const choicesDiv = document.getElementById("choices");
  if(!choicesDiv) return;

  choicesDiv.innerHTML = "";

  let choices = Array.isArray(q.choices) ? [...q.choices] : [];

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(c => {

    const btn = document.createElement("button");
    btn.innerText = c;
    btn.onclick = () => checkAnswerSafe(c);

    choicesDiv.appendChild(btn);
  });

  showHistorySafe(q.id);
  loadScoresSafe();
}

//////////////////////////////
// 8. 回答処理
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

    if(result){
      result.innerText =
      "⭕️ 正解！！\nコンボ：" + comboCount;
    }

  } else {

    comboCount = 0;

    if(result){
      result.innerText =
      "❌ 不正解！！\n正解：" + q.answer;
    }
  }

  saveHistorySafe(q.id, correct);
  updateProgressRateSafe();
  loadScoresSafe();
  createQuestionListSafe();
}

//////////////////////////////
// 9. 次へ・戻る
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
// 10. ホーム
//////////////////////////////

function goHome(){

  quizQuestions = [];
  currentQuestion = 0;
  correctCount = 0;
  answered = false;
  comboCount = 0;

  showPageSafe("topPage");
  loadScoresSafe();
}

//////////////////////////////
// 11. 終了
//////////////////////////////

function finishQuizSafe(){

  showPageSafe("finishPage");

  const rate =
  quizQuestions.length > 0
  ? Math.round(correctCount / quizQuestions.length * 100)
  : 0;

  const el = document.getElementById("finalResult");

  if(el){
    el.innerText =
    correctCount + " / " + quizQuestions.length +
    " 正解\n正答率 " + rate + "%";
  }

  loadScoresSafe();
}

//////////////////////////////
// 12. 画面切替
//////////////////////////////

function showPageSafe(id){

  ["topPage","quizPage","finishPage","listPage"].forEach(p=>{
    const el = document.getElementById(p);
    if(el) el.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if(target) target.classList.remove("hidden");
}

//////////////////////////////
// 13. 履歴
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
// 14. レート
//////////////////////////////

function getRateSafe(id){

  let h = JSON.parse(localStorage.getItem(id) || "[]");

  if(h.length === 0) return 0;

  return h.filter(x => x).length / h.length;
}

//////////////////////////////
// 15. スコア
//////////////////////////////

function loadScoresSafe(){

  const r1 = document.getElementById("row1");
  const r2 = document.getElementById("row2");

  if(!r1 || !r2) return;

  let high = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  let today = parseInt(localStorage.getItem(TODAY_BEST_KEY) || 0);

  r1.innerText =
  "連続正答：" + comboCount +
  " / 今日最高：" + today;

  r2.innerText =
  "ハイスコア：" + high;
}

//////////////////////////////
// 16. 進捗
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
// 17. 問題一覧
//////////////////////////////

function createQuestionListSafe(){

  const list = document.getElementById("questionList");
  if(!list) return;

  list.innerHTML = "";

  (questions || []).forEach(q => {

    const btn = document.createElement("button");

    btn.innerText = q.question || "問題";

    btn.onclick = () => {
      quizQuestions = [q];
      currentQuestion = 0;
      showPageSafe("quizPage");
      showQuestionSafe();
    };

    list.appendChild(btn);
  });
}