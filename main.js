import { Timer } from "./timer.js";
import { avatars } from "./avatars.js";
import { getUser, loadLeaderboards, saveHiScores } from "./firebase.js";
import { getHashNum } from "./helpers.js";

// const cellCount = 25;
const cellCount = 4;
const $cellGrid = document.querySelector(".cell-grid");
const $timer = document.querySelector(".timer");
const $resetBtn = document.querySelector(".reset");

$resetBtn.addEventListener("click", initGrid);

const $root = document.querySelector(":root");
$root.style.setProperty("--cellCount", cellCount);

$cellGrid.dataset.cellCount = cellCount;

function initGrid() {
  //remove all
  $cellGrid.replaceChildren();

  let currentNum = 1;

  function addLeaderboardsRow({ uid, rank, score, date, isCurrent }) {
    const rowFragment = $tmplLeaderboardsRow.content.cloneNode(true);

    //rank
    const $rank = rowFragment.querySelector(".lb-rank");
    $rank.textContent = rank;
    //player
    const avatarId = getHashNum(uid, avatars.length);
    const $player = rowFragment.querySelector(".lb-player");
    $player.textContent = avatars[avatarId];
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

  const timer = new Timer();

  timer.onUpdate((diff) => {
    const timeStr = new Date(diff).toLocaleTimeString("en-US", {
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    $timer.textContent = timeStr;
  });

  function getAvatarForUid(uid) {
    const avatarId = getHashNum(uid, avatars.length);
    return avatars[avatarId];
  }

  function formatScore(score) {
    return `${score / 1000}s`;
  }

  async function onClick($cell) {
    if ($cell.classList.contains("checked")) return;

    if (+$cell.dataset.number !== currentNum) return;

    $cell.classList.add("checked");
    currentNum++;

    if (currentNum > cellCount) {
      //win

      timer.stop();

      // todo(vmyshko): show win and leaders

      const user = await getUser();

      $avatar.textContent = getAvatarForUid(user.uid);

      const currentScore = timer.getDiff();

      $score.textContent = formatScore(currentScore);

      saveHiScores({
        uid: user.uid,
        score: currentScore,
        date: new Date(),
      });

      $overlay.hidden = false;
      const leaders = await loadLeaderboards();

      //clear fake data
      $leaderboardsTableBody.replaceChildren();

      let rank = 0;
      leaders.forEach((doc) => {
        const userData = doc.data();

        console.log(doc.id, userData);

        const isCurrent =
          userData.uid === user.uid && userData.score === currentScore;
        rank++;
        addLeaderboardsRow({ ...userData, rank, isCurrent });
      });
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

  timer.start();
}

//
initGrid();
