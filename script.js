let questions = [];
let quizQuestions = [];

let currentQuestion = 0;
let correctCount = 0;
let questionCount = 5;

fetch("questions.json")
.then(r=>r.json())
.then(data=>{
  questions = data;
});

function setQuestionCount(count){

  questionCount = count;

  document.getElementById(
    "selectedCount"
  ).innerText =
  "現在：" + count + "問";

}

function startQuiz(mode){

  currentQuestion = 0;
  correctCount = 0;

  let temp = [...questions];

  if(mode === "random"){

    temp.sort(() => Math.random()-0.5);

  }

  if(mode === "weak"){

    temp.sort((a,b)=>
      getCorrectRate(a.id)
      -
      getCorrectRate(b.id)
    );

  }

  quizQuestions = temp.slice(0,questionCount);

  document.getElementById(
    "topPage"
  ).classList.add("hidden");

  document.getElementById(
    "finishPage"
  ).classList.add("hidden");

  document.getElementById(
    "quizPage"
  ).classList.remove("hidden");

  showQuestion();

}

function showQuestion(){

  const q = quizQuestions[currentQuestion];

  document.getElementById(
    "progress"
  ).innerText =
  (currentQuestion+1)
  + "/"
  + questionCount;

  document.getElementById(
    "question"
  ).innerText =
  q.question;

  showHistory(q.id);

  const choicesDiv =
  document.getElementById("choices");

  choicesDiv.innerHTML = "";

  let choices = [...q.choices];

  choices.sort(()=>Math.random()-0.5);

  choices.forEach(choice=>{

    const button =
    document.createElement("button");

    button.innerText = choice;

    button.onclick =
    ()=>checkAnswer(choice);

    choicesDiv.appendChild(button);

  });

}

function checkAnswer(choice){

  const q = quizQuestions[currentQuestion];

  let correct = false;

  if(choice === q.answer){

    correct = true;

    correctCount++;

    document.getElementById(
      "result"
    ).innerText =
    "⭕ 正解！";

  }else{

    document.getElementById(
      "result"
    ).innerText =
    "❌ 正解：" + q.answer;

  }

  saveHistory(q.id,correct);

  currentQuestion++;

  setTimeout(()=>{

    document.getElementById(
      "result"
    ).innerText = "";

    if(currentQuestion
      < quizQuestions.length){

      showQuestion();

    }else{

      finishQuiz();

    }

  },1000);

}

function finishQuiz(){

  document.getElementById(
    "quizPage"
  ).classList.add("hidden");

  document.getElementById(
    "finishPage"
  ).classList.remove("hidden");

  const rate =
  Math.round(
    correctCount
    /
    questionCount
    *100
  );

  document.getElementById(
    "finalScore"
  ).innerText =
  correctCount
  + " / "
  + questionCount
  + " 正解\n正答率 "
  + rate
  + "%";

}

function goTop(){

  document.getElementById(
    "quizPage"
  ).classList.add("hidden");

  document.getElementById(
    "finishPage"
  ).classList.add("hidden");

  document.getElementById(
    "topPage"
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
  "過去3回：" + text;

}

function getCorrectRate(id){

  let history =
  JSON.parse(
    localStorage.getItem(id)
  ) || [];

  if(history.length === 0){
    return 0;
  }

  let correct =
  history.filter(x=>x).length;

  return correct / history.length;

}