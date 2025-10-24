import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { signInWithGoogle, handleGoogleRedirectResult, onAuthStateChange, signOutUser } from '../firebase/auth';

// Context shape
const Ctx = createContext(null);

export const useFirebaseAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
};

// Sync Firebase user with backend and retrieve backend JWT + user
const syncUserWithBackend = async (firebaseUser) => {
  // Ensure axios has baseURL configured (avoid race with AuthProvider)
  if (!axios.defaults.baseURL) {
    if (process.env.REACT_APP_API_URL) {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL;
    } else {
      axios.defaults.baseURL = 'http://localhost:5000';
    }
  }

  const idToken = await firebaseUser.getIdToken();
  const providerId = firebaseUser.providerData[0]?.providerId || 'google';

  // Try login first
  try {
    const res = await axios.post('/api/auth/firebase-login', {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      provider: providerId
    }, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    try { window.dispatchEvent(new Event('auth-token-updated')); } catch {}
    return res.data.user;
  } catch (loginErr) {
    // If login failed, attempt registration
    const res = await axios.post('/api/auth/firebase-register', {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      provider: providerId
    }, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    try { window.dispatchEvent(new Event('auth-token-updated')); } catch {}
    return res.data.user;
  }
};

export const FirebaseAuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const syncingRef = useRef(false); // prevent duplicate syncs

  // Ensure axios baseURL is set early
  useEffect(() => {
    if (!axios.defaults.baseURL) {
      if (process.env.REACT_APP_API_URL) {
        axios.defaults.baseURL = process.env.REACT_APP_API_URL;
      } else {
        axios.defaults.baseURL = 'http://localhost:5000';
      }
    }
  }, []);

  // Handle Google redirect result on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const firebaseUser = await handleGoogleRedirectResult();
        if (!active || !firebaseUser) return;
        setLoading(true);
        setError(null);
        await syncUserWithBackend(firebaseUser);
        // After sync, AuthContext will pick up token and redirect user via routes
      } catch (e) {
        console.error('FirebaseAuthProvider: redirect handling error', e);
        setError(e?.response?.data?.msg || e?.message || 'Google Sign-In failed');
        try { await signOutUser(); } catch {}
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Keep backend session in sync when Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChange(async (firebaseUser) => {
      if (!firebaseUser) return; // signed out handled by AuthContext
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        setError(null);
        await syncUserWithBackend(firebaseUser);
      } catch (e) {
        console.error('FirebaseAuthProvider: auth state sync error', e);
        setError(e?.response?.data?.msg || e?.message || 'Failed to sync with backend');
      } finally {
        syncingRef.current = false;
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Redirect-based sign-in; returns null before redirect
      const user = await signInWithGoogle();
      return user || null;
    } catch (e) {
      console.error('loginWithGoogle error', e);
      setError(e?.message || 'Google Sign-In failed');
      throw e;
    } finally {
      // Keep loading true if redirecting (user === null), but this finally runs before navigation
      setLoading(false);
    }
  }, []);

  const value = { loginWithGoogle, loading, error };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
