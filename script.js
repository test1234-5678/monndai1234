let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;
let answered = false;

// ======================
// コンボ・スコア
// ======================
let comboCount = 0;

const HIGH_SCORE_KEY = "quiz_high_score";
const TODAY_BEST_KEY = "quiz_today_best";
const TODAY_DATE_KEY = "quiz_today_date";

// ======================
// 初期読み込み
// ======================
fetch("questions.json")
.then(r=>r.json())
.then(data=>{

  questions = data;

  createQuestionList();
  updateProgressRate();
  loadScores();

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

  }else if(selectedMode === "random"){

    temp.sort(()=>Math.random()-0.5);

  }else if(selectedMode === "weak"){

    temp.sort((a,b)=>getRate(a.id)-getRate(b.id));

  }

  quizQuestions = temp.slice(0, selectedCount);
  currentQuestion = 0;

  showPage("quizPage");
  showQuestion();

  loadScores();
}

// ======================
// 問題表示
// ======================
function showQuestion(){

  answered = false;

  const q = quizQuestions[currentQuestion];

  document.getElementById("progress").innerText =
  (currentQuestion+1) + " / " + quizQuestions.length;

  const globalIndex = questions.indexOf(q);

  document.getElementById("questionNumber").innerText =
  "問題 " + (globalIndex + 1);

  document.getElementById("question").innerText =
  q.question;

  showHistory(q.id);

  const resultEl = document.getElementById("result");
  resultEl.innerText = "";
  resultEl.className = "";

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  let choices = [...q.choices];
  choices.sort(()=>Math.random()-0.5);

  choices.forEach(choice=>{

    const btn = document.createElement("button");
    btn.innerText = choice;
    btn.onclick = ()=>checkAnswer(choice);
    choicesDiv.appendChild(btn);

  });

  saveProgress();
  loadScores();
}

// ======================
// 回答
// ======================
function checkAnswer(choice){

  if(answered) return;

  answered = true;

  const q = quizQuestions[currentQuestion];
  const resultEl = document.getElementById("result");
  const quizPage = document.getElementById("quizPage");

  let correct = false;

  if(choice === q.answer){

    correct = true;
    correctCount++;
    comboCount++;

    resultEl.innerText =
    "⭕️ 正解！！\n🔥コンボ：" + comboCount + "\n" + getTitle(comboCount);

    quizPage.classList.add("correct-flash");

  }else{

    comboCount = 0;

    resultEl.innerText =
    "❌ 不正解！！\n正解は " + q.answer;

    quizPage.classList.add("wrong-shake");

  }

  updateTodayScore(comboCount);
  updateHighScore(comboCount);

  saveHistory(q.id, correct);
  createQuestionList();
  updateProgressRate();
  saveProgress();

  loadScores();

  setTimeout(()=>{

    quizPage.classList.remove("correct-flash");
    quizPage.classList.remove("wrong-shake");

  },600);
}

// ======================
// コンボ称号
// ======================
function getTitle(combo){

  if(combo >= 100) return "👑 LEGEND";
  if(combo >= 50) return "🔥 MASTER";
  if(combo >= 20) return "🚀 EXPERT";
  if(combo >= 5) return "⭐ GOOD";
  return "";

}

// ======================
// 今日スコア
// ======================
function updateTodayScore(combo){

  let today = new Date().toDateString();
  let savedDate = localStorage.getItem(TODAY_DATE_KEY);

  if(savedDate !== today){
    localStorage.setItem(TODAY_DATE_KEY, today);
    localStorage.setItem(TODAY_BEST_KEY, 0);
  }

  let best = parseInt(localStorage.getItem(TODAY_BEST_KEY) || 0);

  if(combo > best){
    localStorage.setItem(TODAY_BEST_KEY, combo);
  }

}

// ======================
// ハイスコア
// ======================
function updateHighScore(combo){

  let best = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);

  if(combo > best){
    localStorage.setItem(HIGH_SCORE_KEY, combo);
  }

}

// ======================
// スコア表示
// ======================
function loadScores(){

  let high = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  let today = parseInt(localStorage.getItem(TODAY_BEST_KEY) || 0);

  document.getElementById("row1").innerText =
  "現在の連続正答数：" + comboCount +
  "    今日の最高：" + today;

  document.getElementById("row2").innerText =
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

// ======================
// スワイプ
// ======================
let touchStartX = 0;

document.addEventListener("touchstart", e=>{

  if(e.target.tagName === "BUTTON") return;

  touchStartX = e.changedTouches[0].screenX;

});

document.addEventListener("touchend", e=>{

  if(e.target.tagName === "BUTTON") return;

  const page = document.getElementById("quizPage");
  if(page.classList.contains("hidden")) return;

  let diff = e.changedTouches[0].screenX - touchStartX;

  if(Math.abs(diff) < 60) return;

  if(diff > 0){
    prevQuestion();
  }else{
    nextQuestion();
  }

});