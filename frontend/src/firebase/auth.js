import { 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from './config';

// Google Sign-In using redirect
export const signInWithGoogle = async () => {
  console.log('Firebase auth.js: signInWithGoogle called');
  try { localStorage.removeItem('token'); } catch (e) {}
  try { await signOut(auth); } catch (e) {}

  console.log('Firebase auth.js: Starting redirect to Google...');
  await signInWithRedirect(auth, googleProvider);
  return null; // Redirect will occur
};

// Handle redirect result after Google Sign-In
export const handleGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user; // return raw firebase user
    }
    return null;
  } catch (error) {
    console.error('Google Redirect Result Error:', error);
    throw error;
  }
};

// Email/Password Sign-Up
export const signUpWithEmail = async (email, password, name) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    await updateProfile(user, { displayName: name });
    return user; // return raw firebase user
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
};

// Email/Password Sign-In
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user; // return raw firebase user
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
};

// Auth State Listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user); // return raw firebase user
  });
};

// Get Current User
export const getCurrentUser = () => {
  return auth.currentUser;
};
