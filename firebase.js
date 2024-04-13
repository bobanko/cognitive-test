// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const analytics = getAnalytics(app);
