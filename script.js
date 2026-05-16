let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;

let selectedMode = "normal";
let selectedCount = 5;
let answered = false;

const PROGRESS_KEY = "quiz_progress_index";

// ======================
// データ読み込み
// ======================
fetch("questions.json")
.then(r=>r.json())
.then(data=>{

  questions = data;

  createQuestionList();
  updateProgressRate();

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

  let temp = [...questions];

  if(selectedMode === "normal"){

    let saved = localStorage.getItem(PROGRESS_KEY);
    let startIndex = saved ? parseInt(saved) : 0;

    temp = questions.slice(startIndex);
  }

  else if(selectedMode === "random"){
    temp.sort(()=>Math.random()-0.5);
  }

  else if(selectedMode === "weak"){
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

    const button = document.createElement("button");
    button.innerText = choice;
    button.onclick = ()=>checkAnswer(choice);
    choicesDiv.appendChild(button);

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

  resultEl.className = "";
  quizPage.classList.remove("correct-flash");
  quizPage.classList.remove("wrong-shake");

  let correct = false;

  if(choice === q.answer){

    correct = true;
    correctCount++;

    resultEl.classList.add("result-correct");
    resultEl.innerText = "⭕️ 正解！！";

    quizPage.classList.add("correct-flash");

  }else{

    resultEl.classList.add("result-wrong");
    resultEl.innerText = "❌ 不正解！！\n正解は " + q.answer;

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
// 次へ（完全安定版）
// ======================
function nextQuestion(){

  console.log("NEXT");

  if(currentQuestion >= quizQuestions.length - 1){
    finishQuiz();
    return;
  }

  currentQuestion++;
  showQuestion();
}

// ======================
// 戻る（完全安定版）
// ======================
function prevQuestion(){

  console.log("PREV");

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

  showPage("topPage");
  window.scrollTo(0,0);
}

// ======================
// 進捗保存
// ======================
function saveProgress(){

  if(selectedMode !== "normal") return;

  const q = quizQuestions[currentQuestion];
  const globalIndex = questions.indexOf(q);

  if(globalIndex >= 0){
    localStorage.setItem(PROGRESS_KEY, globalIndex + 1);
  }
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

  window.scrollTo(0,0);
}

// ======================
// スワイプ（安全版）
// ======================
let touchStartX = 0;

document.addEventListener("touchstart", function(e){

  if(e.target.tagName === "BUTTON") return;

  touchStartX = e.changedTouches[0].screenX;

});

document.addEventListener("touchend", function(e){

  if(e.target.tagName === "BUTTON") return;

  const quizPage = document.getElementById("quizPage");
  if(!quizPage || quizPage.classList.contains("hidden")) return;

  const diff = e.changedTouches[0].screenX - touchStartX;

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

  let history =
  JSON.parse(localStorage.getItem(id)) || [];

  history.push(result);

  if(history.length > 3){
    history.shift();
  }

  localStorage.setItem(id, JSON.stringify(history));
}

function showHistory(id){

  let history =
  JSON.parse(localStorage.getItem(id)) || [];

  let text = "";

  history.forEach(h=>{
    text += h ? "◯ " : "× ";
  });

  document.getElementById("history").innerText =
  "過去3回 " + text;
}

// ======================
// 正答率
// ======================
function getRate(id){

  let history =
  JSON.parse(localStorage.getItem(id)) || [];

  if(history.length === 0) return 0;

  return history.filter(x=>x).length / history.length;
}

// ======================
// 一覧
// ======================
function createQuestionList(){

  const list = document.getElementById("questionList");
  list.innerHTML = "";

  questions.forEach(q=>{

    let history =
    JSON.parse(localStorage.getItem(q.id)) || [];

    let text = "";

    history.forEach(h=>{
      text += h ? "◯ " : "× ";
    });

    const button = document.createElement("button");

    button.className = "questionItem";

    button.innerHTML =
    `<div class="questionRow">
      <div>問題 ${questions.indexOf(q)+1}</div>
      <div class="questionHistory">${text}</div>
    </div>`;

    button.onclick = ()=>{

      quizQuestions = questions;
      currentQuestion = questions.indexOf(q);
      correctCount = 0;

      showPage("quizPage");
      showQuestion();
    };

    list.appendChild(button);
  });
}

// ======================
// 進捗
// ======================
function updateProgressRate(){

  let complete = 0;

  questions.forEach(q=>{

    let history =
    JSON.parse(localStorage.getItem(q.id)) || [];

    if(history.length === 3 && history.every(x=>x)){
      complete++;
    }

  });

  const rate =
  Math.round(complete / questions.length * 100);

  document.getElementById("progressRate").innerText =
  "進捗率：" + rate + "%";

  document.getElementById("progressFill").style.width =
  rate + "%";
}

// 初期化
setMode("normal");
setCount(5);