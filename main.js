import { Timer } from "./timer.js";
import { getAvatarForUid } from "./avatars.js";
import { signAnonUser, loadHiScores, saveHiScores } from "./firebase.js";

import { cellCount } from "./config.js";
import { solve } from "./helpers.js";

// todo(vmyshko): use $ids directly
const $cellGrid = document.querySelector(".cell-grid");
const $timer = document.querySelector(".timer");

$btnReset.addEventListener("click", initGrid);

$btnRestart.addEventListener("click", () => {
  //
  $overlayHiScores.hidden = true;
  $main.classList.remove("blurred");
  initGrid();
});

const $root = document.querySelector(":root");
$root.style.setProperty("--cellCount", cellCount);

$cellGrid.dataset.cellCount = cellCount;
const timer = new Timer();

// todo(vmyshko): cheat for quick auto solve
const [cheat, secondsToSolve] = location.hash.split("/");
if (cheat === "#cheat") {
  console.log("🤥 Cheater detected");
  $clockIcon.textContent = "🤥";
  // todo(vmyshko): get time after click, dynamically
  $clockIcon.addEventListener("click", () => solve(secondsToSolve * 1e3));
}

// $mainAvatar.addEventListener("click", () => {
//   signUser();
// });

signAnonUser().then((user) => {
  $mainAvatar.textContent = getAvatarForUid(user.uid);
});

function initGrid() {
  //remove all
  timer.stop();
  $cellGrid.replaceChildren();

  let currentNum = 1;

  function addLeaderboardsRow({ uid, rank, score, date, isCurrent }) {
    const rowFragment = $tmplLeaderboardsRow.content.cloneNode(true);

    //rank
    const $rank = rowFragment.querySelector(".lb-rank");
    $rank.textContent = rank;
    //player

    const $player = rowFragment.querySelector(".lb-player");
    $player.textContent = getAvatarForUid(uid);
    //score
    const $score = rowFragment.querySelector(".lb-score");
    $score.textContent = formatScore(score);
    //date
    const $date = rowFragment.querySelector(".lb-date");
    $date.textContent = date.toDate().toLocaleString();

    if (isCurrent) {
      const $tr = rowFragment.querySelector("tr");
      $tr.classList.add("current");
    }

    $leaderboardsTableBody.appendChild(rowFragment);
  }

  timer.onUpdate((diff) => {
    const timeStr = new Date(diff).toLocaleTimeString("en-US", {
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    $timer.textContent = timeStr;
  });

  function formatScore(score) {
    return (score / 1000).toString().padEnd(5, 0) + "s";
  }

  async function processWin() {
    timer.stop();

    // todo(vmyshko): show win and leaders

    const user = await signAnonUser();

    $avatar.textContent = getAvatarForUid(user.uid);

    const currentScore = timer.getDiff();

    $score.textContent = "⏱️" + formatScore(currentScore);

    await saveHiScores({
      uid: user.uid,
      score: currentScore,
      date: new Date(),
    });

    $overlayHiScores.hidden = false;
    $main.classList.add("blurred");

    const leaders = await loadHiScores();

    //clear fake data
    $leaderboardsTableBody.replaceChildren();

    let rank = 0;
    let currentRank = 0;
    leaders.forEach((doc) => {
      const userData = {
        uid: doc.id,
        ...doc.data(),
      };
      rank++;

      const isCurrent =
        userData.uid === user.uid && userData.score === currentScore;
      if (isCurrent) {
        currentRank = rank;
      }

      addLeaderboardsRow({ ...userData, rank, isCurrent });
    });

    const rowHeight =
      $leaderboardsContainer.querySelector("tbody>tr").clientHeight;

    $leaderboardsContainer.scrollTo({
      top: rowHeight * (currentRank - 2),
      left: 0,
      behavior: "smooth",
    });
  }

  const animations = {
    disabled: [
      [{}, { backgroundColor: "dimgray", fontSize: "9vmin" }, {}],
      {
        duration: 200,
        iterations: 1,
      },
    ],
    wrong: [
      [{}, { backgroundColor: "red", fontSize: "9vmin" }, {}],
      {
        duration: 200,
        iterations: 1,
      },
    ],
    proper: [
      [{}, { backgroundColor: "greenyellow", fontSize: "9vmin" }, {}],
      {
        duration: 300,
        iterations: 1,
      },
    ],
  };

  async function onClick($cell) {
    if ($cell.classList.contains("checked")) {
      $cell.animate(...animations.disabled);
      return;
    }

    if (+$cell.dataset.number !== currentNum) {
      $cell.animate(...animations.wrong);
      return;
    }

    $cell.animate(...animations.proper);
    $cell.classList.add("checked");
    currentNum++;

    if (currentNum > cellCount) {
      //win

      processWin();
    }
  }

  const preCells = [];
  for (let cellNumber = 1; cellNumber <= cellCount; cellNumber++) {
    //

    const $cell = document.createElement("div");
    $cell.classList.add("cell");

    $cell.dataset.number = cellNumber;

    function handleClickEvent(event) {
      console.log(event.type);
      event.preventDefault(); //prevent both touch and click
      onClick($cell);
    }

    $cell.addEventListener("mousedown", handleClickEvent);
    $cell.addEventListener("touchstart", handleClickEvent);

    preCells.splice(Math.floor(Math.random() * cellNumber), 0, $cell);
  }

  $cellGrid.append(...preCells);

  timer.start();
}

//
initGrid();
