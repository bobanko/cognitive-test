// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  query,
  orderBy,
  limit,
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  //   GoogleAuthProvider,
  //   EmailAuthProvider,
  //   linkWithCredential,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvdAyCXjT8-rxTgx-_Hza6qivdwzrjW3s",
  authDomain: "cognitive-test-83d3f.firebaseapp.com",
  projectId: "cognitive-test-83d3f",
  storageBucket: "cognitive-test-83d3f.appspot.com",
  messagingSenderId: "84067554932",
  appId: "1:84067554932:web:5404e84daa589863866321",
  measurementId: "G-LM7L0F5E3N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// todo(vmyshko): switch between modes?
// const leaderboardsTableName = "leaderboards";
const leaderboardsTableName = "leaderboards-5x5";

export async function loadLeaderboards() {
  //read list

  const leaderboardsRef = collection(db, leaderboardsTableName);

  const querySnapshot = getDocs(
    query(leaderboardsRef, orderBy("score"), limit(50))
  );

  return querySnapshot;
}

export async function saveHiScores({ uid, score, date }) {
  //write
  try {
    const docRef = await addDoc(collection(db, leaderboardsTableName), {
      uid,
      score,
      date,
    });

    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
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

// const email = "test@test.com";
// const password = "qwerty";

// const credential = GoogleAuthProvider.credential(
//     googleUser.getAuthResponse().id_token);

// const credential = EmailAuthProvider.credential(email, password);

// console.log(credential);

// linkWithCredential(auth.currentUser, credential)
//   .then((usercred) => {
//     const user = usercred.user;
//     console.log("Anonymous account successfully upgraded", user);
//   })
//   .catch((error) => {
//     console.log("Error upgrading anonymous account", error);
//   });
