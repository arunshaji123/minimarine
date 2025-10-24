const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup Helper for Marine Survey App\n');

console.log('📋 To enable Google Sign-In, you need to:');
console.log('');
console.log('1. 🌐 Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. ➕ Create a new project (or use existing)');
console.log('3. 🔐 Enable Authentication → Sign-in method → Google');
console.log('4. 🔑 Generate service account key:');
console.log('   - Go to Project Settings → Service Accounts');
console.log('   - Click "Generate new private key"');
console.log('   - Download the JSON file');
console.log('   - Rename it to "firebase-service-account-key.json"');
console.log('   - Place it in the backend/ directory');
console.log('');
console.log('5. 📝 Update frontend/.env.local with your Firebase config:');
console.log('   REACT_APP_FIREBASE_API_KEY=your_api_key');
console.log('   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com');
console.log('   REACT_APP_FIREBASE_PROJECT_ID=your_project_id');
console.log('   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com');
console.log('   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id');
console.log('   REACT_APP_FIREBASE_APP_ID=your_app_id');
console.log('');
console.log('6. 🚀 Restart your servers');
console.log('');
console.log('📖 For detailed instructions, see: FIREBASE_SETUP_GUIDE.md');
console.log('');

// Check if Firebase config exists
const firebaseKeyPath = path.join(__dirname, 'firebase-service-account-key.json');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(firebaseKeyPath)) {
  console.log('✅ Firebase service account key found!');
} else {
  console.log('❌ Firebase service account key not found');
  console.log('   Please download and place firebase-service-account-key.json in backend/');
}

if (fs.existsSync(envPath)) {
  console.log('✅ Backend .env file found!');
} else {
  console.log('❌ Backend .env file not found');
  console.log('   Please create backend/.env from env-template.txt');
}

const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
if (fs.existsSync(frontendEnvPath)) {
  console.log('✅ Frontend .env.local file found!');
} else {
  console.log('❌ Frontend .env.local file not found');
  console.log('   Please create frontend/.env.local with Firebase config');
}

console.log('');
console.log('🎯 Once configured, Google Sign-In will work on your login page!');



