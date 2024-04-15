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
  //   GoogleAuthProvider,
  //   EmailAuthProvider,
  //   linkWithCredential,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { firebaseConfig, hiScoresTableName } from "./config.js";
import { getAvatarForUid } from "./avatars.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function loadLeaderboards() {
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

export async function savePlayerHiScore({ uid, score, date }) {
  const hiScoreRef = doc(db, hiScoresTableName, uid);
  const hiScoreSnap = await getDoc(hiScoreRef);

  const av = getAvatarForUid(uid);

  if (!hiScoreSnap.exists()) {
    console.log(`${av}[CREATE] score for this player not exists -- create`);
    return setDoc(hiScoreRef, {
      score,
      date,
    });
  }

  //hi score exists
  const hiScoreData = hiScoreSnap.data();

  if (hiScoreData.score <= score) {
    console.log(
      `${av}[SKIP] old score: ${hiScoreData.score} is better (<) than ${score}`
    );
    return;
  }

  //do update

  console.log(
    `${av}[UPDATE] old score: ${hiScoreData.score} is worse (>) than ${score}`
  );
  return setDoc(hiScoreRef, {
    score,
    date,
  });
}

export async function saveHiScores({ uid, score, date }) {
  // test
  return savePlayerHiScore({ uid, score, date });
}

export async function getUser() {
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

// todo(vmyshko): convert anon to registered
// https://firebase.google.com/docs/auth/web/anonymous-auth#web-modular-api_3
