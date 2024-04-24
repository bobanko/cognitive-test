import { Timer } from "./timer.js";
import { avatars, getAvatarForUid } from "./avatars.js";
import {
  signAnonUser,
  linkAnonUser,
  loadHiScores,
  getCurrentUser,
  onAuthStateChanged,
  savePlayerHiScore,
} from "./firebase.js";

import { difficultyLevels } from "./config.js";
import { solve } from "./helpers.js";

$btnReset.addEventListener("click", initGrid);
$btnSettings.addEventListener("click", openSettings);
$btnSettingsBack.addEventListener("click", closeSettings);

// todo(vmyshko): use history api?
$btnRestart.addEventListener("click", () => {
  $overlayHiScores.hidden = true;
  $main.classList.remove("blurred");

  initGrid();
});

function getCurrentDifLevel() {
  const selectedDifficultyLevelId = $difficultyOptions.querySelector(
    ".difficulty-value:checked"
  ).value;

  const currentDifLevel =
    difficultyLevels.find(
      (difLevel) => difLevel.id === selectedDifficultyLevelId
    ) || difficultyLevels[0];

  return currentDifLevel;
}

function openSettings() {
  $overlaySettings.hidden = false;
  $main.classList.add("blurred");
  timer.stop();
}

function closeSettings() {
  $overlaySettings.hidden = true;
  $main.classList.remove("blurred");

  // todo(vmyshko): update with new settings

  initGrid();
}

const timer = new Timer();

// todo(vmyshko): cheat for quick auto solve
const [cheat, secondsToSolve] = location.hash.split("/");
if (cheat === "#cheat") {
  console.log("🤥 Cheater detected");
  $clockIcon.textContent = "🤥";
  // todo(vmyshko): get time after click, dynamically
  $clockIcon.addEventListener("click", () => solve(secondsToSolve * 1e3));
}

$btnLinkAccount.addEventListener("click", () => {
  linkAnonUser();
});

// todo(vmyshko): init difficulty options
function initDifficultyOptions() {
  $difficultyOptions.replaceChildren();

  difficultyLevels.forEach((difLevel) => {
    const optionFragment = $tmplDifficultyOption.content.cloneNode(true);

    //caption
    const $optionCaption = optionFragment.querySelector(".difficulty-caption");
    $optionCaption.textContent = difLevel.text;

    //value
    const $optionValue = optionFragment.querySelector(".difficulty-value");
    $optionValue.value = difLevel.id;

    // todo(vmyshko): check current level
    if (difLevel.id === "2x2") {
      $optionValue.checked = true;
    }

    $difficultyOptions.appendChild(optionFragment);
  });
}

// avatar

$btnChooseAvatar.addEventListener("click", () => {
  $overlaySettings.classList.add("blurred");
  $overlayAvatar.hidden = false;
});

$btnCloseAvatarList.addEventListener("click", () => {
  $overlaySettings.classList.remove("blurred");
  $overlayAvatar.hidden = true;
  const selectedAvatar = $overlayAvatar.querySelector(
    "input[name=avatar]:checked"
  ).value;

  // todo(vmyshko): apply new avatar/save
  console.log("new av", selectedAvatar);
  //debug
  $mainAvatar.textContent = selectedAvatar;
  $hiScoresAvatar.textContent = selectedAvatar;
  $settingsAvatar.textContent = selectedAvatar;
});

function initAvatarList() {
  $avatarList.replaceChildren();

  avatars.forEach((avatar) => {
    const avatarFragment = $tmplAvatar.content.cloneNode(true);

    const $avatar = avatarFragment.querySelector(".avatar");

    $avatar.value = avatar;
    $avatar.dataset.value = avatar;

    $avatarList.appendChild(avatarFragment);
  });
}

initAvatarList();

initDifficultyOptions();

onAuthStateChanged((user) => {
  console.log("user changed", user);

  if (!user) {
    //no user logged
    //show splash
    $main.hidden = true;
    $splash.hidden = false;
    signAnonUser();
  } else {
    //user exists/logged
    //show main
    $main.hidden = false;
    $splash.hidden = true;

    $btnLinkAccount.disabled = !user.isAnonymous;

    const av = getAvatarForUid(user.uid);
    $mainAvatar.textContent = av;
    $hiScoresAvatar.textContent = av;
    $settingsAvatar.textContent = av;

    const $selectedAvatar = $overlayAvatar.querySelector(
      `input[name=avatar][data-value=${av}`
    );
    if ($selectedAvatar) {
      $selectedAvatar.checked = true;
    }
  }
});

function initGrid() {
  const { cellCount, tableName } = getCurrentDifLevel();
  //remove all
  timer.stop();
  $cellGrid.replaceChildren();

  // todo(vmyshko): on init new settings
  const $root = document.querySelector(":root");
  $root.style.setProperty("--cellCount", cellCount);

  let currentNum = 1;

  function addLeaderboardsRow({
    uid,
    rank,
    score,
    date,
    isCurrentScore,
    isCurrentUser,
  }) {
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

    const $tr = rowFragment.querySelector("tr");

    if (isCurrentUser) {
      $tr.classList.add("current-user");
    }

    if (isCurrentScore) {
      $tr.classList.add("current-score");
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

    const currentScore = timer.getDiff();

    $score.textContent = "⏱️" + formatScore(currentScore);

    const user = getCurrentUser();

    await savePlayerHiScore({
      uid: user.uid,
      score: currentScore,
      date: new Date(),
      hiScoresTableName: tableName,
    });

    $overlayHiScores.hidden = false;
    $main.classList.add("blurred");

    const leaders = await loadHiScores({
      hiScoresTableName: tableName,
    });

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

      const isCurrentUser = userData.uid === user.uid;

      const isCurrentScore = isCurrentUser && userData.score === currentScore;

      if (isCurrentScore || isCurrentUser) {
        currentRank = rank;
      }

      addLeaderboardsRow({
        ...userData,
        rank,
        isCurrentScore,
        isCurrentUser,
      });
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
      [{}, { backgroundColor: "dimgray", fontSize: "1.5rem" }, {}],
      {
        duration: 200,
        iterations: 1,
      },
    ],
    wrong: [
      [{}, { backgroundColor: "red", fontSize: "1.5rem" }, {}],
      {
        duration: 200,
        iterations: 1,
      },
    ],
    proper: [
      [{}, { backgroundColor: "greenyellow", fontSize: "1.5rem" }, {}],
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

  //create cells
  const preCells = [];
  for (let cellNumber = 1; cellNumber <= cellCount; cellNumber++) {
    const $cell = document.createElement("div");
    $cell.classList.add("cell");

    $cell.dataset.number = cellNumber;

    // todo(vmyshko): extract handler
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
