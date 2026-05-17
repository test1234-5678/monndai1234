//////////////////////////////
// 簡易認証
//////////////////////////////

const PASSWORD = "合格";

const inputPassword = prompt(
  "合言葉を入力してください"
);

if(inputPassword !== PASSWORD){

  alert("認証失敗");

  document.body.innerHTML =
  "<h1 style='text-align:center;margin-top:100px;'>アクセスできません</h1>";

  throw new Error("認証失敗");
}

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

});

//////////////////////////////
// モード
//////////////////////////////

function setMode(mode){

  selectedMode = mode;

  ["normal","random","weak"].forEach(m=>{

    const el =
    document.getElementById(
      "mode-" + m
    );

    if(el){
      el.classList.remove("selected");
    }

  });

  const target =
  document.getElementById(
    "mode-" + mode
  );

  if(target){
    target.classList.add("selected");
  }

  updateSettingsSafe();
}

//////////////////////////////
// 問題数
//////////////////////////////

function setCount(count){

  selectedCount = count;

  [5,10,20].forEach(n=>{

    const el =
    document.getElementById(
      "count-" + n
    );

    if(el){
      el.classList.remove("selected");
    }

  });

  const target =
  document.getElementById(
    "count-" + count
  );

  if(target){
    target.classList.add("selected");
  }

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

  const el =
  document.getElementById(
    "settingsText"
  );

  if(el){

    el.innerText =
    modeText + " / " +
    selectedCount + "問";

  }
}

//////////////////////////////
// 開始
//////////////////////////////

function startQuiz(){

  correctCount = 0;
  answered = false;
  currentQuestion = 0;

  let temp = [...questions];

  //////////////////////
  // 順番モード
  //////////////////////

  if(selectedMode === "normal"){

    let saved =
    localStorage.getItem(
      "quiz_progress_index"
    );

    let startIndex =
    saved ? parseInt(saved) : 0;

    if(startIndex >= questions.length){
      startIndex = 0;
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
  // 問題数
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

  if(!q){
    return;
  }

  //////////////////////
  // 順番保存
  //////////////////////

  if(selectedMode === "normal"){

    let nextIndex =
    q.number % questions.length;

    localStorage.setItem(
      "quiz_progress_index",
      nextIndex
    );
  }

  //////////////////////
  // 表示
  //////////////////////

  const progress =
  document.getElementById(
    "progress"
  );

  if(progress){

    progress.innerText =
    (currentQuestion + 1) +
    " / " +
    quizQuestions.length;

  }

  const questionNumber =
  document.getElementById(
    "questionNumber"
  );

  if(questionNumber){

    questionNumber.innerText =
    "問題 " + q.number;

  }

  const question =
  document.getElementById(
    "question"
  );

  if(question){

    question.innerText =
    q.question;

  }

  const result =
  document.getElementById(
    "result"
  );

  if(result){
    result.innerText = "";
  }

  //////////////////////
  // 選択肢
  //////////////////////

  const choicesDiv =
  document.getElementById(
    "choices"
  );

  if(!choicesDiv){
    return;
  }

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

  if(answered){
    return;
  }

  answered = true;

  const q =
  quizQuestions[currentQuestion];

  const result =
  document.getElementById(
    "result"
  );

  const quizPage =
  document.getElementById(
    "quizPage"
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

    updateScoresSafe(comboCount);

    if(result){

      result.innerText =
      "⭕️ 正解！！\n" +
      comboCount +
      "コンボ！";

      result.style.fontSize =
      "24px";

    }

    if(quizPage){

      quizPage.classList.remove(
        "correct-flash"
      );

      void quizPage.offsetWidth;

      quizPage.classList.add(
        "correct-flash"
      );
    }

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

    if(result){

      result.innerText =
      "❌ 不正解！！\n" +
      "正解：" + q.answer;

      result.style.fontSize =
      "20px";

    }

    if(quizPage){

      quizPage.classList.remove(
        "wrong-shake"
      );

      void quizPage.offsetWidth;

      quizPage.classList.add(
        "wrong-shake"
      );
    }
  }

  saveHistorySafe(
    q.id,
    choice === q.answer
  );

  createQuestionListSafe();
  updateProgressRateSafe();
  loadScoresSafe();
}

//////////////////////////////
// 次へ
//////////////////////////////

function nextQuestion(){

  if(currentQuestion >=
     quizQuestions.length - 1){

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
    correctCount /
    quizQuestions.length
    * 100
  );

  const finalResult =
  document.getElementById(
    "finalResult"
  );

  if(finalResult){

    finalResult.innerText =
    correctCount +
    " / " +
    quizQuestions.length +
    " 正解\n正答率 " +
    rate + "%";

  }
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
  ].forEach(p=>{

    const el =
    document.getElementById(p);

    if(el){
      el.classList.add("hidden");
    }

  });

  const target =
  document.getElementById(id);

  if(target){
    target.classList.remove("hidden");
  }
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

  const historyEl =
  document.getElementById(
    "history"
  );

  if(historyEl){

    historyEl.innerText =
    "過去3回：" + text;

  }
}

//////////////////////////////
// 苦手率
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

  let correct =
  history.filter(x=>x).length;

  return correct /
  history.length;
}

//////////////////////////////
// 問題一覧
//////////////////////////////

function createQuestionListSafe(){

  const list =
  document.getElementById(
    "questionList"
  );

  if(!list){
    return;
  }

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

      let index =
      questions.findIndex(
        x => x.id === q.id
      );

      if(index < 0){
        index = 0;
      }

      quizQuestions = [

        ...questions.slice(index),

        ...questions.slice(0,index)

      ];

      currentQuestion = 0;

      showPage("quizPage");

      showQuestionSafe();
    };

    list.appendChild(button);

  });
}

//////////////////////////////
// 進捗
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
    complete /
    questions.length
    * 100
  );

  const progressRate =
  document.getElementById(
    "progressRate"
  );

  if(progressRate){

    progressRate.innerText =
    "進捗率：" +
    rate + "%";

  }

  const progressFill =
  document.getElementById(
    "progressFill"
  );

  if(progressFill){

    progressFill.style.width =
    rate + "%";

  }
}

//////////////////////////////
// スコア更新
//////////////////////////////

function updateScoresSafe(combo){

  let high =
  parseInt(
    localStorage.getItem(
      HIGH_SCORE_KEY
    ) || 0
  );

  if(combo > high){

    localStorage.setItem(
      HIGH_SCORE_KEY,
      combo
    );
  }

  let today =
  parseInt(
    localStorage.getItem(
      TODAY_BEST_KEY
    ) || 0
  );

  if(combo > today){

    localStorage.setItem(
      TODAY_BEST_KEY,
      combo
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

  if(!row1 || !row2){
    return;
  }

  const high =
  parseInt(
    localStorage.getItem(
      HIGH_SCORE_KEY
    ) || 0
  );

  const today =
  parseInt(
    localStorage.getItem(
      TODAY_BEST_KEY
    ) || 0
  );

  row1.innerText =
  "現在の連続正答数：" +
  comboCount +
  "　今日の最高：" +
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