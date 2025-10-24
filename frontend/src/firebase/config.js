import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your Firebase configuration
// Using actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBweDtDlwyZCp5LInNw5-5Fr7yQ2tux9Y8",
  authDomain: "marine-b2a52.firebaseapp.com",
  projectId: "marine-b2a52",
  storageBucket: "marine-b2a52.appspot.com",
  messagingSenderId: "268916550139",
  appId: "1:268916550139:web:bfb5c00d498ef4d236c35e",
  measurementId: "G-NTG1NC9385"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
