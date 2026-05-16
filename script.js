let questions = [];

let quizQuestions = [];

let currentQuestion = 0;

let correctCount = 0;

let selectedMode = "normal";

let selectedCount = 5;

let answered = false;

fetch("questions.json")
.then(r=>r.json())
.then(data=>{

  questions = data;

  createQuestionList();

  updateProgressRate();

});

function setMode(mode){

  selectedMode = mode;

  document.getElementById(
    "mode-normal"
  ).classList.remove("selected");

  document.getElementById(
    "mode-random"
  ).classList.remove("selected");

  document.getElementById(
    "mode-weak"
  ).classList.remove("selected");

  document.getElementById(
    "mode-" + mode
  ).classList.add("selected");

  updateSettings();

}

function setCount(count){

  selectedCount = count;

  document.getElementById(
    "count-5"
  ).classList.remove("selected");

  document.getElementById(
    "count-10"
  ).classList.remove("selected");

  document.getElementById(
    "count-20"
  ).classList.remove("selected");

  document.getElementById(
    "count-" + count
  ).classList.add("selected");

  updateSettings();

}

function updateSettings(){

  let modeText = "";

  if(selectedMode === "normal"){
    modeText = "順番";
  }

  if(selectedMode === "random"){
    modeText = "ランダム";
  }

  if(selectedMode === "weak"){
    modeText = "苦手";
  }

  document.getElementById(
    "settingsText"
  ).innerText =
  modeText
  + " / "
  + selectedCount
  + "問";

}

function startQuiz(){

  currentQuestion = 0;

  correctCount = 0;

  let temp = [...questions];

  if(selectedMode === "random"){

    temp.sort(()=>Math.random()-0.5);

  }

  if(selectedMode === "weak"){

    temp.sort((a,b)=>
      getRate(a.id)
      -
      getRate(b.id)
    );

  }

  quizQuestions =
  temp.slice(0,selectedCount);

  showPage("quizPage");

  showQuestion();

}

function showQuestion(){

  answered = false;

  const q =
  quizQuestions[currentQuestion];

  document.getElementById(
    "progress"
  ).innerText =
  (currentQuestion+1)
  + " / "
  + quizQuestions.length;

  document.getElementById(
    "questionNumber"
  ).innerText =
  "問題 "
  + q.number;

  document.getElementById(
    "question"
  ).innerText =
  q.question;

  showHistory(q.id);

  document.getElementById(
    "result"
  ).innerText = "";

  const choicesDiv =
  document.getElementById(
    "choices"
  );

  choicesDiv.innerHTML = "";

  let choices =
  [...q.choices];

  choices.sort(
    ()=>Math.random()-0.5
  );

  choices.forEach(choice=>{

    const button =
    document.createElement(
      "button"
    );

    button.innerText =
    choice;

    button.onclick =
    ()=>checkAnswer(choice);

    choicesDiv.appendChild(
      button
    );

  });

}

function checkAnswer(choice){

  if(answered){
    return;
  }

  answered = true;

  const q =
  quizQuestions[currentQuestion];

  let correct = false;

  if(choice === q.answer){

    correct = true;

    correctCount++;

    document.getElementById(
      "result"
    ).innerText =
    "⭕ 正解";

  }else{

    document.getElementById(
      "result"
    ).innerText =
    "❌ 正解：" + q.answer;

  }

  saveHistory(
    q.id,
    correct
  );

  createQuestionList();

  updateProgressRate();

}

function nextQuestion(){

  if(!answered){
    return;
  }

  currentQuestion++;

  if(currentQuestion
    < quizQuestions.length){

    showQuestion();

  }else{

    finishQuiz();

  }

}

function prevQuestion(){

  if(currentQuestion === 0){
    return;
  }

  currentQuestion--;

  showQuestion();

}

function finishQuiz(){

  showPage("finishPage");

  const rate =
  Math.round(
    correctCount
    /
    quizQuestions.length
    *100
  );

  document.getElementById(
    "finalResult"
  ).innerText =
  correctCount
  + " / "
  + quizQuestions.length
  + " 正解\n"
  + "正答率 "
  + rate
  + "%";

}

function goHome(){

  showPage("topPage");

}

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
    id
  ).classList.remove("hidden");

}

function saveHistory(id,result){

  let history =
  JSON.parse(
    localStorage.getItem(id)
  ) || [];

  history.push(result);

  if(history.length > 3){

    history.shift();

  }

  localStorage.setItem(
    id,
    JSON.stringify(history)
  );

}

function showHistory(id){

  let history =
  JSON.parse(
    localStorage.getItem(id)
  ) || [];

  let text = "";

  history.forEach(h=>{

    text += h ? "⭕ " : "❌ ";

  });

  document.getElementById(
    "history"
  ).innerText =
  "過去3回 "
  + text;

}

function getRate(id){

  let history =
  JSON.parse(
    localStorage.getItem(id)
  ) || [];

  if(history.length === 0){

    return 0;

  }

  let correct =
  history.filter(x=>x).length;

  return correct
  /
  history.length;

}

function createQuestionList(){

  const list =
  document.getElementById(
    "questionList"
  );

  list.innerHTML = "";

  questions.forEach(q=>{

    let history =
    JSON.parse(
      localStorage.getItem(q.id)
    ) || [];

    let text = "";

    history.forEach(h=>{

      text += h ? "⭕ " : "❌ ";

    });

    const div =
    document.createElement(
      "div"
    );

    div.className =
    "questionItem";

    div.innerText =
    "問題"
    + q.number
    + " "
    + text;

    list.appendChild(div);

  });

}

function updateProgressRate(){

  let complete = 0;

  questions.forEach(q=>{

    let history =
    JSON.parse(
      localStorage.getItem(q.id)
    ) || [];

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
    /
    questions.length
    *100
  );

  document.getElementById(
    "progressRate"
  ).innerText =
  rate + "%";

}

setMode("normal");

setCount(5);