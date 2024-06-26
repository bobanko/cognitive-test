// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  query,
  orderBy,
  limit,
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  //   EmailAuthProvider,
  linkWithCredential,
  linkWithRedirect,
  linkWithPopup,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { firebaseConfig } from "./config.js";
import { getAvatarForUid } from "./avatars.js";

const playerSettingsTableName = "players";
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function loadHiScores({ hiScoresTableName }) {
  const hiScoresRef = collection(db, hiScoresTableName);

  const querySnapshot = getDocs(
    query(
      hiScoresRef,
      orderBy("score")
      //, limit(50)
    )
  );

  return querySnapshot;
}

export async function savePlayerSettings(uid, { avatar, difficulty }) {
  const playerRef = doc(db, playerSettingsTableName, uid);

  return setDoc(playerRef, {
    avatar,
    // difficulty,
  });
}

export async function loadAllPlayerSettings() {
  const settingsRef = collection(db, playerSettingsTableName);

  const querySnapshot = getDocs(query(settingsRef));

  return querySnapshot;
}

export async function loadPlayerSettings(uid) {
  const playerRef = doc(db, playerSettingsTableName, uid);
  const playerSnap = await getDoc(playerRef);

  if (playerSnap.exists()) return await playerSnap.data();

  const avatar = getAvatarForUid(uid);

  //default
  return {
    avatar,
  };
}

export async function savePlayerHiScore({
  uid,
  score,
  date,
  hiScoresTableName,
}) {
  const hiScoreRef = doc(db, hiScoresTableName, uid);
  const hiScoreSnap = await getDoc(hiScoreRef);

  if (!hiScoreSnap.exists()) {
    console.log(`[CREATE] score for this player not exists -- create`);
    return setDoc(hiScoreRef, {
      score,
      date,
    });
  }

  //hi score exists
  const hiScoreData = hiScoreSnap.data();

  if (hiScoreData.score <= score) {
    console.log(
      `[SKIP] old score: ${hiScoreData.score} is better (<) than ${score}`
    );
    return;
  }

  //do update

  console.log(
    `[UPDATE] old score: ${hiScoreData.score} is worse (>) than ${score}`
  );
  return setDoc(hiScoreRef, {
    score,
    date,
  });
}

export function getCurrentUser() {
  return getAuth().currentUser;
}

export function onAuthStateChanged(handler) {
  getAuth().onAuthStateChanged(handler);
}

export async function signAnonUser() {
  const auth = getAuth();

  try {
    const { user } = await signInAnonymously(auth);

    // Signed in..
    console.log("signed anon", user);

    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ...

    console.log(errorMessage, errorCode);
    return null;
  }
}

export function linkAnonUser() {
  const auth = getAuth();

  const provider = new GoogleAuthProvider();

  if (!auth.currentUser.isAnonymous) {
    console.log("cant link, acc is NOT anon", auth.currentUser);
    return;
  }

  linkWithPopup(auth.currentUser, provider)
    .then((result) => {
      // Accounts successfully linked.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      // ...

      console.log("linked", credential, user);
      console.log("Anonymous account successfully upgraded", user);
      //   alert("linked OK");
    })
    .catch((error) => {
      console.log("Error upgrading anonymous account", error);
      //   alert(`linked ERROR \n${JSON.stringify(error)}`);
      // Handle Errors here.
      // ...

      if (error.code === "auth/credential-already-in-use") {
        // todo(vmyshko): propose to merge accounts:

        console.log("todo: propose merge");
        // select which to keep: avatar/ score(best?)
        // delete other one
        // re-login with google?
      }
    });
}
// todo(vmyshko): convert anon to registered
// https://firebase.google.com/docs/auth/web/anonymous-auth#web-modular-api_3
