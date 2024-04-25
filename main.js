import { Timer } from "./timer.js";
import { avatars, getAvatarForUid } from "./avatars.js";
import {
  signAnonUser,
  linkAnonUser,
  loadHiScores,
  getCurrentUser,
  onAuthStateChanged,
  savePlayerHiScore,
  savePlayerSettings,
  loadPlayerSettings,
  loadAllPlayerSettings,
} from "./firebase.js";

import { difficultyLevels } from "./config.js";
import { solve } from "./helpers.js";

$btnReset.addEventListener("click", initGrid);
$btnSettings.addEventListener("click", openSettings);
$btnSettingsBack.addEventListener("click", closeSettings);

// todo(vmyshko): use history api?
$btnRestart.addEventListener("click", () => {
  $overlayHiScores.hidden = true;
  $main.classList.remove("blur-2");

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
  $main.classList.add("blur-2");
  timer.stop();
}

function closeSettings() {
  $overlaySettings.hidden = true;
  $main.classList.remove("blur-2");

  // todo(vmyshko): update with new settings

  initGrid();
}

function setAvatar(avatar) {
  $mainAvatar.textContent = avatar;
  $hiScoresAvatar.textContent = avatar;
  $settingsAvatar.textContent = avatar;
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
//cheat modes

$btnLinkAccount.addEventListener("click", () => {
  linkAnonUser();
});

// todo(vmyshko): init difficulty options
function initDifficultyOptions() {
  $difficultyOptions.replaceChildren();

  difficultyLevels.forEach((difLevel, index) => {
    const optionFragment = $tmplDifficultyOption.content.cloneNode(true);

    //caption
    const $optionCaption = optionFragment.querySelector(".difficulty-caption");
    $optionCaption.textContent = difLevel.text;

    //value
    const $optionValue = optionFragment.querySelector(".difficulty-value");
    $optionValue.value = difLevel.id;

    // todo(vmyshko): check current level
    if (index === 0) {
      $optionValue.checked = true;
    }

    $difficultyOptions.appendChild(optionFragment);
  });
}

// avatar

$btnChooseAvatar.addEventListener("click", () => {
  $overlaySettings.classList.add("blur-2");
  $overlayAvatar.hidden = false;
});

$btnCloseAvatarList.addEventListener("click", () => {
  // todo(vmyshko): extract to fn
  $overlaySettings.classList.remove("blur-2");
  $overlayAvatar.hidden = true;
  const selectedAvatar = $overlayAvatar.querySelector(
    "input[name=avatar]:checked"
  ).value;

  // todo(vmyshko): apply new avatar/save
  console.log("new av", selectedAvatar);

  setAvatar(selectedAvatar);

  const user = getCurrentUser();

  savePlayerSettings(user.uid, {
    avatar: selectedAvatar,
  });
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

onAuthStateChanged(async (user) => {
  //extract to fn
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
    $btnChooseAvatar.disabled = user.isAnonymous;

    if (location.hash === "#free-av") {
      $btnChooseAvatar.disabled = false;
    }

    const settings = await loadPlayerSettings(user.uid);

    const { avatar } = settings;

    setAvatar(avatar);

    //for settings
    const $selectedAvatar = $overlayAvatar.querySelector(
      `input[name=avatar][data-value=${avatar}`
    );
    if ($selectedAvatar) {
      $selectedAvatar.checked = true;
    }
  }
});

$btnHiScores.addEventListener("click", () => {
  timer.stop();
  console.log("show hiscores");
  $main.classList.add("blur-2");
  showHiScores({ currentScore: NaN });
});

async function showHiScores({ currentScore }) {
  $overlayHiScores.hidden = false;

  $score.textContent = "⏱️" + formatScore(currentScore);

  $hiScoresTableBody.classList.add("blur-1");

  const allPlayers = await loadAllPlayerSettings();

  const dbAvatars = new Map();
  allPlayers.forEach((doc) => {
    const playerData = {
      uid: doc.id,
      ...doc.data(),
    };

    dbAvatars.set(playerData.uid, playerData.avatar);
  });

  const { tableName } = getCurrentDifLevel();

  const leaders = await loadHiScores({
    hiScoresTableName: tableName,
  });

  const user = getCurrentUser();

  $hiScoresTableBody.replaceChildren();

  let rank = 0;
  let currentRank = 0;
  const newLeaders = [];
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

    const $leaderRow = getHiScoresRow({
      ...userData,
      rank,
      isCurrentScore,
      isCurrentUser,
      dbAvatars,
    });

    newLeaders.push($leaderRow);
  });

  $hiScoresTableBody.replaceChildren(...newLeaders);

  $hiScoresTableBody.classList.remove("blur-1");

  const rowHeight = $hiScoresContainer.querySelector("tbody>tr").clientHeight;

  $hiScoresContainer.scrollTo({
    top: rowHeight * (currentRank - 2),
    left: 0,
    behavior: "smooth",
  });
}

function formatScore(score) {
  if (isNaN(score)) return "n/a";

  // todo(vmyshko): make progressive
  if (score >= 100) return (score / 1000).toFixed(2) + "s";
  //less than 100
  return (score / 1000).toFixed(3) + "s";
}

function getHiScoresRow({
  uid,
  rank,
  score,
  date,
  isCurrentScore,
  isCurrentUser,
  dbAvatars,
}) {
  const rowFragment = $tmplHiScoresRow.content.cloneNode(true);

  //rank
  const $rank = rowFragment.querySelector(".lb-rank");
  $rank.textContent = rank;

  //player
  const $player = rowFragment.querySelector(".lb-player");

  $player.textContent = dbAvatars.has(uid)
    ? dbAvatars.get(uid)
    : getAvatarForUid(uid);

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

  return rowFragment;
}

function initGrid() {
  // todo(vmyshko): REFAC remove all nested fns if possible
  const { cellCount, tableName } = getCurrentDifLevel();
  //remove all
  timer.stop();
  $cellGrid.replaceChildren();

  // todo(vmyshko): on init new settings
  const $root = document.querySelector(":root");
  $root.style.setProperty("--cellCount", cellCount);

  let currentNum = 1;

  timer.onUpdate((diff) => {
    const timeStr = new Date(diff).toLocaleTimeString("en-US", {
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    $timer.textContent = timeStr;
  });

  async function processWin() {
    $main.classList.add("blur-2");

    timer.stop();

    const currentScore = timer.getDiff();

    //save hi-score
    const user = getCurrentUser();
    await savePlayerHiScore({
      uid: user.uid,
      score: currentScore,
      date: new Date(),
      hiScoresTableName: tableName,
    });

    showHiScores({ currentScore });
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
    // todo(vmyshko): get from tmpl
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
