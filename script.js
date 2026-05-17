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

  questions = data;

  createQuestionListSafe();
  updateProgressRateSafe();
  loadScoresSafe();

})
.catch(err => {

  console.error(err);
  alert("questions.json の読み込み失敗");

});

//////////////////////////////
// モード
//////////////////////////////

function setMode(mode){

  selectedMode = mode;

  document.getElementById("mode-normal")
  .classList.remove("selected");

  document.getElementById("mode-random")
  .classList.remove("selected");

  document.getElementById("mode-weak")
  .classList.remove("selected");

  document.getElementById("mode-" + mode)
  .classList.add("selected");

  updateSettingsSafe();
}

//////////////////////////////
// 問題数
//////////////////////////////

function setCount(count){

  selectedCount = count;

  document.getElementById("count-5")
  .classList.remove("selected");

  document.getElementById("count-10")
  .classList.remove("selected");

  document.getElementById("count-20")
  .classList.remove("selected");

  document.getElementById("count-" + count)
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

  document.getElementById("settingsText")
  .innerText =
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

    temp = temp.slice(startIndex);
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
  // 問題セット
  //////////////////////

  quizQuestions = [...temp];

  quizQuestions =
  quizQuestions.slice(0, selectedCount);

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

  if(!q) return;

  //////////////////////
  // 順番保存
  //////////////////////

  if(selectedMode === "normal"){

    let nextIndex =
    questions.findIndex(x=>x.id === q.id);

    localStorage.setItem(
      "quiz_progress_index",
      nextIndex + 1
    );
  }

  //////////////////////
  // 問題番号
  //////////////////////

  document.getElementById(
    "questionNumber"
  ).innerText =
  "問題 " + q.number;

  //////////////////////
  // 問題文
  //////////////////////

  document.getElementById(
    "question"
  ).innerText =
  q.question;

  //////////////////////
  // 進捗
  //////////////////////

  document.getElementById(
    "progress"
  ).innerText =
  (currentQuestion + 1)
  + " / " +
  quizQuestions.length;

  //////////////////////
  // 選択肢
  //////////////////////

  const choicesDiv =
  document.getElementById("choices");

  choicesDiv.innerHTML = "";

  let choices = [...q.choices];

  choices.sort(()=>{
    return Math.random() - 0.5;
  });

  for(let i=0; i<choices.length; i++){

    const choice = choices[i];

    const btn =
    document.createElement("button");

    btn.innerText = choice;

    btn.addEventListener(
      "click",
      function(){

        checkAnswerSafe(choice);

      }
    );

    choicesDiv.appendChild(btn);
  }

  //////////////////////
  // 履歴
  //////////////////////

  showHistorySafe(q.id);

  //////////////////////
  // 結果初期化
  //////////////////////

  document.getElementById(
    "result"
  ).innerText = "";

  //////////////////////
  // アニメーションリセット
  //////////////////////

  document.getElementById("choices")
  .classList.remove("correct-flash");

  document.getElementById("choices")
  .classList.remove("wrong-shake");
}

//////////////////////////////
// 回答
//////////////////////////////

function checkAnswerSafe(choice){

  if(answered) return;

  answered = true;

  const q =
  quizQuestions[currentQuestion];

  let correct =
  choice === q.answer;

  const result =
  document.getElementById("result");

  //////////////////////
  // 正解
  //////////////////////

  if(correct){

    correctCount++;

    comboCount++;

    result.innerText =
    "⭕️ 正解！！\nコンボ：" +
    comboCount;

    // 正解フラッシュ
    const choices =
    document.getElementById("choices");

    choices.classList.remove(
      "correct-flash"
    );

    void choices.offsetWidth;

    choices.classList.add(
      "correct-flash"
    );

  }

  //////////////////////
  // 不正解
  //////////////////////

  else{

    comboCount = 0;

    result.innerText =
    "❌ 不正解！！\n正解：" +
    q.answer;

    // 不正解シェイク
    const choices =
    document.getElementById("choices");

    choices.classList.remove(
      "wrong-shake"
    );

    void choices.offsetWidth;

    choices.classList.add(
      "wrong-shake"
    );
  }

  //////////////////////
  // 保存
  //////////////////////

  saveHistorySafe(
    q.id,
    correct
  );

  updateScoresSafe(
    comboCount
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

  createQuestionListSafe();

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

  document.getElementById(
    "topPage"
  ).classList.add("hidden");

  document.getElementById(
    "quizPage"
  ).classList.add("hidden");

  document.getElementById(
    "finishPage"
  ).classList.add("hidden");

  document.getElementById(
    "listPage"
  ).classList.add("hidden");

  document.getElementById(id)
  .classList.remove("hidden");
}

//////////////////////////////
// 履歴保存
//////////////////////////////

function saveHistorySafe(
  id,
  result
){

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

    text += h
    ? "◯ "
    : "× ";

  });

  document.getElementById(
    "history"
  ).innerText =
  "過去3回：" + text;
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

  return correct
  / history.length;
}

//////////////////////////////
// スコア保存
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
  document.getElementById("row1");

  const row2 =
  document.getElementById("row2");

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
  "現在の連続正答数：" +
  comboCount +
  "　今日の最高：" +
  today;

  row2.innerText =
  "ハイスコア：" +
  high;
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
  "進捗率：" +
  rate + "%";

  document.getElementById(
    "progressFill"
  ).style.width =
  rate + "%";
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

      text += h
      ? "◯ "
      : "× ";

    });

    const btn =
    document.createElement("button");

    btn.className =
    "questionItem";

    btn.innerHTML =
    `
    <div class="questionRow">

      <div>
        問題 ${q.number}
      </div>

      <div class="questionHistory">
        ${text}
      </div>

    </div>
    `;

    btn.onclick = ()=>{

      const index =
      questions.findIndex(
        x=>x.id === q.id
      );

      quizQuestions =
      [...questions];

      currentQuestion =
      index;

      showPage("quizPage");

      showQuestionSafe();
    };

    list.appendChild(btn);

  });
}

//////////////////////////////
// 初期設定
//////////////////////////////

setMode("normal");
setCount(5);