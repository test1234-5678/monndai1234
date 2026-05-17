//////////////////////////////
// グローバル変数
//////////////////////////////

let questions = [];
let quizQuestions = [];
let currentQuestion = 0;
let correctCount = 0;
let answered = false;

let comboCount =
parseInt(localStorage.getItem("comboCount") || 0);

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

  questions = data;

  createQuestionListSafe();
  updateProgressRateSafe();
  loadScoresSafe();

})
.catch(err => {

  console.error(err);

  alert("questions.json 読み込み失敗");
});

//////////////////////////////
// モード
//////////////////////////////

function setMode(mode){

  selectedMode = mode;

  ["normal","random","weak"].forEach(m=>{

    document
    .getElementById("mode-" + m)
    .classList.remove("selected");

  });

  document
  .getElementById("mode-" + mode)
  .classList.add("selected");

  updateSettingsSafe();
}

//////////////////////////////
// 問題数
//////////////////////////////

function setCount(count){

  selectedCount = count;

  [5,10,20].forEach(n=>{

    document
    .getElementById("count-" + n)
    .classList.remove("selected");

  });

  document
  .getElementById("count-" + count)
  .classList.add("selected");

  updateSettingsSafe();
}

//////////////////////////////
// 設定表示
//////////////////////////////

function updateSettingsSafe(){

  let modeText = "順番";

  if(selectedMode === "random"){
    modeText = "ランダム";
  }

  if(selectedMode === "weak"){
    modeText = "苦手";
  }

  document.getElementById(
    "settingsText"
  ).innerText =
  modeText + " / " + selectedCount + "問";
}

//////////////////////////////
// クイズ開始
//////////////////////////////

function startQuiz(){

  correctCount = 0;
  answered = false;
  currentQuestion = 0;

  let temp = [...questions];

  //////////////////////
  // 順番
  //////////////////////

  if(selectedMode === "normal"){

    let saved =
    localStorage.getItem(
      "quiz_progress_index"
    );

    let startIndex =
    saved ? parseInt(saved) : 0;

    // 最後まで行ったら1問目へ戻す
    if(startIndex >= questions.length){

      startIndex = 0;

      localStorage.setItem(
        "quiz_progress_index",
        0
      );
    }

    temp = [

      ...questions.slice(startIndex),

      ...questions.slice(0, startIndex)

    ];
  }

  //////////////////////
  // ランダム
  //////////////////////

  if(selectedMode === "random"){

    temp.sort(()=>{
      return Math.random() - 0.5;
    });
  }

  //////////////////////
  // 苦手
  //////////////////////

  if(selectedMode === "weak"){

    temp.sort((a,b)=>{
      return getRateSafe(a.id)
      - getRateSafe(b.id);
    });
  }

  //////////////////////
  // 問題数制限
  //////////////////////

  quizQuestions =
  temp.slice(0, selectedCount);

  if(quizQuestions.length === 0){

    alert("問題がありません");
    return;
  }

  showPage("quizPage");

  showQuestionSafe();
}

//////////////////////////////
// 問題表示
//////////////////////////////

function showQuestionSafe(){

  answered = false;

  const q =
  quizQuestions[currentQuestion];

  document.getElementById(
    "progress"
  ).innerText =
  (currentQuestion + 1)
  + " / "
  + quizQuestions.length;

  document.getElementById(
    "questionNumber"
  ).innerText =
  "問題 " + q.number;

  document.getElementById(
    "question"
  ).innerText =
  q.question;

  const choicesDiv =
  document.getElementById(
    "choices"
  );

  choicesDiv.innerHTML = "";

  let choices = [...q.choices];

  choices.sort(()=>{
    return Math.random() - 0.5;
  });

  choices.forEach(choice=>{

    const button =
    document.createElement(
      "button"
    );

    button.innerText = choice;

    button.onclick = ()=>{
      checkAnswerSafe(choice);
    };

    choicesDiv.appendChild(button);

  });

  showHistorySafe(q.id);
}

//////////////////////////////
// 回答
//////////////////////////////

function checkAnswerSafe(choice){

  if(answered) return;

  answered = true;

  const q =
  quizQuestions[currentQuestion];

  const result =
  document.getElementById(
    "result"
  );

  const questionArea =
  document.getElementById(
    "question"
  );

  //////////////////////
  // 正解
  //////////////////////

  if(choice === q.answer){

    correctCount++;
    comboCount++;

    localStorage.setItem(
      "comboCount",
      comboCount
    );

    updateHighScores();

    result.innerText =
    "⭕️ 正解！！\nコンボ：" +
    comboCount;

    questionArea.classList.add(
      "correct-flash"
    );

    if(comboCount >= 2){

      questionArea.classList.add(
        "combo-5"
      );
    }

    setTimeout(()=>{

      questionArea.classList.remove(
        "correct-flash"
      );

      questionArea.classList.remove(
        "combo-5"
      );

    },500);

  }

  //////////////////////
  // 不正解
  //////////////////////

  else{

    comboCount = 0;

    localStorage.setItem(
      "comboCount",
      comboCount
    );

    result.innerText =
    "❌ 不正解！！\n正解：" +
    q.answer;

    questionArea.classList.add(
      "wrong-shake"
    );

    setTimeout(()=>{

      questionArea.classList.remove(
        "wrong-shake"
      );

    },500);
  }

  //////////////////////
  // 順番保存
  //////////////////////

  if(selectedMode === "normal"){

    let nextIndex =
    quizQuestions[currentQuestion].number;

    if(nextIndex >= questions.length){
      nextIndex = 0;
    }

    localStorage.setItem(
      "quiz_progress_index",
      nextIndex
    );
  }

  saveHistorySafe(
    q.id,
    choice === q.answer
  );

  updateProgressRateSafe();

  loadScoresSafe();
}

//////////////////////////////
// 次へ
//////////////////////////////

function nextQuestion(){

  if(currentQuestion
  >= quizQuestions.length - 1){

    finishQuizSafe();
    return;
  }

  currentQuestion++;

  showQuestionSafe();
}

//////////////////////////////
// 戻る
//////////////////////////////

function prevQuestion(){

  if(currentQuestion <= 0){
    return;
  }

  currentQuestion--;

  showQuestionSafe();
}

//////////////////////////////
// ホーム
//////////////////////////////

function goHome(){

  showPage("topPage");

  loadScoresSafe();
}

//////////////////////////////
// 終了
//////////////////////////////

function finishQuizSafe(){

  showPage("finishPage");

  const rate =
  Math.round(
    correctCount
    / quizQuestions.length
    * 100
  );

  document.getElementById(
    "finalResult"
  ).innerText =
  correctCount
  + " / "
  + quizQuestions.length
  + " 正解\n正答率 "
  + rate + "%";
}

//////////////////////////////
// 画面切替
//////////////////////////////

function showPage(id){

  [
    "topPage",
    "quizPage",
    "finishPage",
    "listPage"
  ].forEach(page=>{

    document
    .getElementById(page)
    .classList.add("hidden");

  });

  document
  .getElementById(id)
  .classList.remove("hidden");
}

//////////////////////////////
// 履歴保存
//////////////////////////////

function saveHistorySafe(id,result){

  let history =
  JSON.parse(
    localStorage.getItem(id)
    || "[]"
  );

  history.push(result);

  if(history.length > 3){
    history.shift();
  }

  localStorage.setItem(
    id,
    JSON.stringify(history)
  );

  createQuestionListSafe();
}

//////////////////////////////
// 履歴表示
//////////////////////////////

function showHistorySafe(id){

  let history =
  JSON.parse(
    localStorage.getItem(id)
    || "[]"
  );

  let text = "";

  history.forEach(h=>{

    text += h ? "◯ " : "× ";

  });

  document.getElementById(
    "history"
  ).innerText =
  "過去3回 "
  + text;
}

//////////////////////////////
// 苦手判定
//////////////////////////////

function getRateSafe(id){

  let history =
  JSON.parse(
    localStorage.getItem(id)
    || "[]"
  );

  if(history.length === 0){
    return 0;
  }

  let ok =
  history.filter(x=>x).length;

  return ok / history.length;
}

//////////////////////////////
// 問題一覧
//////////////////////////////

function createQuestionListSafe(){

  const list =
  document.getElementById(
    "questionList"
  );

  list.innerHTML = "";

  questions.forEach(q=>{

    let history =
    JSON.parse(
      localStorage.getItem(q.id)
      || "[]"
    );

    let text = "";

    history.forEach(h=>{

      text += h ? "◯ " : "× ";

    });

    const button =
    document.createElement(
      "button"
    );

    button.className =
    "questionItem";

    button.innerHTML =

    `<div class="questionRow">

      <div>
      問題 ${q.number}
      </div>

      <div class="questionHistory">
      ${text}
      </div>

    </div>`;

    button.onclick = ()=>{

      const index =
      questions.findIndex(
        x => x.id === q.id
      );

      quizQuestions =
      questions.slice(index);

      currentQuestion = 0;

      showPage("quizPage");

      showQuestionSafe();
    };

    list.appendChild(button);

  });
}

//////////////////////////////
// 進捗率
//////////////////////////////

function updateProgressRateSafe(){

  let complete = 0;

  questions.forEach(q=>{

    let history =
    JSON.parse(
      localStorage.getItem(q.id)
      || "[]"
    );

    if(
      history.length === 3
      &&
      history.every(x=>x)
    ){
      complete++;
    }

  });

  const rate =
  Math.round(
    complete
    / questions.length
    * 100
  );

  document.getElementById(
    "progressRate"
  ).innerText =
  "進捗率：" + rate + "%";

  document.getElementById(
    "progressFill"
  ).style.width =
  rate + "%";
}

//////////////////////////////
// ハイスコア
//////////////////////////////

function updateHighScores(){

  let high =
  parseInt(
    localStorage.getItem(
      HIGH_SCORE_KEY
    ) || 0
  );

  if(comboCount > high){

    localStorage.setItem(
      HIGH_SCORE_KEY,
      comboCount
    );
  }

  let today =
  parseInt(
    localStorage.getItem(
      TODAY_BEST_KEY
    ) || 0
  );

  if(comboCount > today){

    localStorage.setItem(
      TODAY_BEST_KEY,
      comboCount
    );
  }
}

//////////////////////////////
// スコア表示
//////////////////////////////

function loadScoresSafe(){

  const row1 =
  document.getElementById(
    "row1"
  );

  const row2 =
  document.getElementById(
    "row2"
  );

  let high =
  parseInt(
    localStorage.getItem(
      HIGH_SCORE_KEY
    ) || 0
  );

  let today =
  parseInt(
    localStorage.getItem(
      TODAY_BEST_KEY
    ) || 0
  );

  row1.innerText =
  "連続正答：" +
  comboCount +
  " / 今日最高：" +
  today;

  row2.innerText =
  "ハイスコア：" +
  high;
}

//////////////////////////////
// 初期設定
//////////////////////////////

setMode("normal");
setCount(5);