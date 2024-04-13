const cellCount = 25;
const $cellGrid = document.querySelector(".cell-grid");
const $timer = document.querySelector(".timer");
const $resetBtn = document.querySelector(".reset");

$resetBtn.addEventListener("click", initGrid);

const $root = document.querySelector(":root");
$root.style.setProperty("--cellCount", cellCount);

$cellGrid.dataset.cellCount = cellCount;
var interval = null;

function initGrid() {
  //remove all
  $cellGrid.replaceChildren();

  let currentNum = 1;

  function onClick($cell) {
    if ($cell.classList.contains("checked")) return;

    if (+$cell.dataset.number !== currentNum) return;

    $cell.classList.add("checked");
    currentNum++;

    if (currentNum > cellCount) {
      //win
      clearInterval(interval);
    }
  }

  const preCells = [];
  for (let cellNumber = 1; cellNumber <= cellCount; cellNumber++) {
    //

    const $cell = document.createElement("div");
    $cell.classList.add("cell");

    $cell.dataset.number = cellNumber;
    $cell.addEventListener("click", () => onClick($cell));

    preCells.splice(Math.floor(Math.random() * cellNumber), 0, $cell);
  }

  $cellGrid.append(...preCells);

  const timeStart = new Date().getTime();

  clearInterval(interval);
  timerInterval();
  function timerInterval() {
    const timeNow = new Date().getTime();
    const diff = timeNow - timeStart;

    var timeStr = new Date(diff).toLocaleTimeString("en-US", {
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    $timer.textContent = timeStr;
  }

  interval = setInterval(timerInterval, 1000);
}

//
initGrid();
