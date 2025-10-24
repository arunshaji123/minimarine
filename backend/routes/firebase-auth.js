const express = require('express');
const admin = require('firebase-admin');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  let serviceAccount;
  
  // Try to load service account key file first
  try {
    serviceAccount = require('../firebase-service-account-key.json');
    console.log('✅ Firebase service account key loaded from file');
  } catch (error) {
    // Fall back to environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
      console.log('✅ Firebase service account loaded from environment variables');
    } else {
      throw new Error('Firebase configuration not found');
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.log('⚠️ Firebase Admin SDK not initialized:', error.message);
  console.log('📝 To enable Google Sign-In, please set up Firebase configuration');
  firebaseInitialized = false;
}

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  if (!firebaseInitialized) {
    return res.status(503).json({ 
      msg: 'Firebase authentication not configured. Please set up Firebase to use Google Sign-In.' 
    });
  }

  try {
    // Robustly parse Authorization header: "Bearer <token>"
    const authHeader = req.header('Authorization') || req.header('authorization');
    let token = authHeader && authHeader.split(' ')[0].toLowerCase() === 'bearer'
      ? authHeader.split(' ').slice(1).join(' ').trim()
      : null;

    // Remove accidental surrounding quotes
    if (token && ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))) {
      token = token.slice(1, -1);
    }
    
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// @route   POST api/auth/firebase-login
// @desc    Login with Firebase token
// @access  Public
router.post('/firebase-login', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, name, email, photoURL, provider } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify the Firebase token matches the request
    if (firebaseUser.uid !== uid) {
      return res.status(401).json({ msg: 'Token mismatch' });
    }

    // Find or create user in your database
    let user = await User.findOne({ email: email });

    if (!user) {
      // Create new user
      user = new User({
        name: name || firebaseUser.name,
        email: email || firebaseUser.email,
        password: 'firebase-auth', // Dummy password for Firebase users
        role: 'ship_management', // Default role
        firebaseUid: uid,
        photoURL: photoURL,
        provider: provider || 'google'
      });

      await user.save();
    } else {
      // Update existing user with Firebase info
      user.firebaseUid = uid;
      user.photoURL = photoURL;
      user.provider = provider || 'google';
      await user.save();
    }

    // Generate JWT token for your backend (match /routes/auth.js structure)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/firebase-register
// @desc    Register with Firebase token
// @access  Public
router.post('/firebase-register', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, name, email, photoURL, provider } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify the Firebase token matches the request
    if (firebaseUser.uid !== uid) {
      return res.status(401).json({ msg: 'Token mismatch' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name: name || firebaseUser.name,
      email: email || firebaseUser.email,
      password: 'firebase-auth', // Dummy password for Firebase users
      role: 'surveyor', // Default role
      firebaseUid: uid,
      photoURL: photoURL,
      provider: provider || 'google'
    });

    await user.save();

    // Generate JWT token for your backend (match /routes/auth.js structure)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Firebase register error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/auth/firebase-user
// @desc    Get current Firebase user
// @access  Private
router.get('/firebase-user', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;
    
    // Find user in your database
    const user = await User.findOne({ firebaseUid: firebaseUser.uid });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Get Firebase user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
