// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBweDtDlwyZCp5LInNw5-5Fr7yQ2tux9Y8",
  authDomain: "marine-b2a52.firebaseapp.com",
  projectId: "marine-b2a52",
  storageBucket: "marine-b2a52.firebasestorage.app",
  messagingSenderId: "268916550139",
  appId: "1:268916550139:web:bfb5c00d498ef4d236c35e",
  measurementId: "G-NTG1NC9385"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);