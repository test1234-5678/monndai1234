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
  "進捗率：" + rate + "%";

  document.getElementById(
    "progressFill"
  ).style.width =
  rate + "%";

}