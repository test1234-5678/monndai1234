let questions = [];
let currentQuestion = 0;
let correctCount = 0;

fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;

    // ランダム並び替え
    questions.sort(() => Math.random() - 0.5);

    showQuestion();
  });

function showQuestion() {

  const q = questions[currentQuestion];

  document.getElementById("question").innerText =
    q.question;

  const choicesDiv =
    document.getElementById("choices");

  choicesDiv.innerHTML = "";

  q.choices.forEach(choice => {

    const button =
      document.createElement("button");

    button.innerText = choice;

    button.onclick = () => checkAnswer(choice);

    choicesDiv.appendChild(button);

  });

}

function checkAnswer(choice) {

  const q = questions[currentQuestion];

  const result =
    document.getElementById("result");

  if (choice === q.answer) {

    result.innerText = "⭕ 正解！";

    correctCount++;

  } else {

    result.innerText =
      "❌ 不正解！ 正解は " + q.answer;

  }

  currentQuestion++;

  updateScore();

  if (currentQuestion < questions.length) {

    setTimeout(showQuestion, 1000);

  } else {

    document.getElementById("question")
      .innerText = "終了！";

    document.getElementById("choices")
      .innerHTML = "";

  }

}

function updateScore() {

  document.getElementById("score")
    .innerText =
    currentQuestion +
    "問中" +
    correctCount +
    "問正解";

}