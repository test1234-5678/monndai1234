let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;

let selectedMode = "normal";
let selectedCount = 5;
let answered = false;

// ======================
// コンボ・スコア
// ======================
let comboCount = 0;

const HIGH_SCORE_KEY = "quiz_high_score";

// ======================
// データ読み込み
// ======================
fetch("questions.json")
.then(r=>r.json())
.then(data=>{

  questions = data;

  createQuestionList();
  updateProgressRate();
  loadHighScore();

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
// 表示
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
  comboCount = 0;
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
    "⭕️ 正解！！\n🔥コンボ：" + comboCount;

    quizPage.classList.add("correct-flash");

    triggerComboEffect(comboCount);

  }else{

    comboCount = 0;

    resultEl.innerText =
    "❌ 不正解！！\n正解は " + q.answer;

    quizPage.classList.add("wrong-shake");

  }

  saveHistory(q.id, correct);
  createQuestionList();
  updateProgressRate();
  saveProgress();

  setTimeout(()=>{

    quizPage.classList.remove("correct-flash");
    quizPage.classList.remove("wrong-shake");

  },600);
}

// ======================
// コンボエフェクト
// ======================
function triggerComboEffect(combo){

  const page = document.getElementById("quizPage");

  page.classList.remove("combo-5");
  page.classList.remove("combo-20");
  page.classList.remove("combo-100");

  if(combo === 5){
    page.classList.add("combo-5");
  }

  if(combo === 20){
    page.classList.add("combo-20");
  }

  if(combo === 100){
    page.classList.add("combo-100");
  }

  setTimeout(()=>{

    page.classList.remove("combo-5");
    page.classList.remove("combo-20");
    page.classList.remove("combo-100");

  },1200);
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
  comboCount = 0;

  showPage("topPage");
}

// ======================
// 進捗保存
// ======================
function saveProgress(){

  const q = quizQuestions[currentQuestion];
  if(!q) return;

  const globalIndex = questions.indexOf(q);
  localStorage.setItem("quiz_progress_index", globalIndex + 1);

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

  // ハイスコア保存
  let saved = localStorage.getItem(HIGH_SCORE_KEY) || 0;

  if(comboCount > saved){
    localStorage.setItem(HIGH_SCORE_KEY, comboCount);
  }

  loadHighScore();
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

// ======================
// 履歴
// ======================
function saveHistory(id, result){

  let h = JSON.parse(localStorage.getItem(id)) || [];

  h.push(result);

  if(h.length > 3) h.shift();

  localStorage.setItem(id, JSON.stringify(h));
}

function showHistory(id){

  let h = JSON.parse(localStorage.getItem(id)) || [];

  let text = "";

  h.forEach(x=>{
    text += x ? "◯ " : "× ";
  });

  document.getElementById("history").innerText =
  "過去3回 " + text;
}

// ======================
// 正答率
// ======================
function getRate(id){

  let h = JSON.parse(localStorage.getItem(id)) || [];

  if(h.length === 0) return 0;

  return h.filter(x=>x).length / h.length;
}

// ======================
// 一覧
// ======================
function createQuestionList(){

  const list = document.getElementById("questionList");
  list.innerHTML = "";

  questions.forEach(q=>{

    let h = JSON.parse(localStorage.getItem(q.id)) || [];

    let text = "";
    h.forEach(x=> text += x ? "◯ " : "× ");

    const btn = document.createElement("button");

    btn.className = "questionItem";

    btn.innerHTML =
    `<div class="questionRow">
      <div>問題 ${questions.indexOf(q)+1}</div>
      <div class="questionHistory">${text}</div>
    </div>`;

    btn.onclick = ()=>{

      quizQuestions = questions;
      currentQuestion = questions.indexOf(q);

      showPage("quizPage");
      showQuestion();

    };

    list.appendChild(btn);

  });
}

// ======================
// 進捗
// ======================
function updateProgressRate(){

  let complete = 0;

  questions.forEach(q=>{

    let h = JSON.parse(localStorage.getItem(q.id)) || [];

    if(h.length === 3 && h.every(x=>x)){
      complete++;
    }

  });

  let rate = Math.round(complete / questions.length * 100);

  document.getElementById("progressRate").innerText =
  "進捗率：" + rate + "%";

  document.getElementById("progressFill").style.width =
  rate + "%";
}

// ======================
// ハイスコア表示
// ======================
function loadHighScore(){

  let s = localStorage.getItem(HIGH_SCORE_KEY) || 0;

  document.getElementById("highScore").innerText =
  "ハイスコア：" + s;
}

// 初期化
setMode("normal");
setCount(5);