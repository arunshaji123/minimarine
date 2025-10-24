# 🔥 Firebase Authentication Setup Guide

## 🎯 **Quick Setup Steps**

### **1. Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `marine-survey-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### **2. Enable Authentication**

1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider:
   - Click on "Google"
   - Toggle "Enable"
   - Add your project support email
   - Click "Save"

### **3. Get Firebase Configuration**

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Register app with nickname: `marine-survey-web`
5. Copy the Firebase configuration object

### **4. Update Environment Variables**

#### **Frontend (.env.local)**
Create `frontend/.env.local`:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### **Backend (.env)**
Create `backend/.env` (copy from `env-template.txt`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/marine_survey?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production_make_it_long_and_random

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

### **5. Generate Firebase Service Account Key**

1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `firebase-service-account-key.json`
5. Place it in the `backend/` directory

**⚠️ Security Note**: Never commit this file to version control!

---

## 🗄️ **MongoDB Setup**

### **Option 1: MongoDB Atlas (Recommended)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster (M0 Sandbox - Free)
4. Create database user
5. Whitelist your IP address
6. Get connection string
7. Update `MONGODB_URI` in `backend/.env`

### **Option 2: Local MongoDB**

1. Download MongoDB Community Server
2. Install and start MongoDB service
3. Use: `MONGODB_URI=mongodb://localhost:27017/marine_survey`

---

## 🚀 **Testing the Setup**

### **1. Start the Application**
```bash
# From project root
npm run dev
```

### **2. Test Google Sign-In**
1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete Google authentication
4. You should be redirected to the dashboard

### **3. Verify Database**
- Check MongoDB Atlas/Compass for new user document
- User should have `firebaseUid` and `provider: 'google'`

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **"Firebase: Error (auth/configuration-not-found)"**
- Check Firebase config in `frontend/.env.local`
- Ensure all environment variables are set correctly

#### **"Firebase: Error (auth/unauthorized-domain)"**
- Add `localhost:3000` to authorized domains in Firebase Console
- Go to Authentication → Settings → Authorized domains

#### **"MongoDB connection error"**
- Check `MONGODB_URI` in `backend/.env`
- Ensure MongoDB Atlas cluster is running
- Verify IP whitelist includes your current IP

#### **"Firebase Admin SDK error"**
- Check service account key file path
- Verify environment variables in `backend/.env`
- Ensure private key format is correct (with `\n` for line breaks)

### **Debug Steps:**

1. **Check Console Logs**
   - Frontend: Browser Developer Tools → Console
   - Backend: Terminal output

2. **Verify Environment Variables**
   ```bash
   # Frontend
   echo $REACT_APP_FIREBASE_API_KEY
   
   # Backend
   echo $FIREBASE_PROJECT_ID
   ```

3. **Test Firebase Connection**
   ```javascript
   // Add to any component for testing
   import { auth } from './firebase/config';
   console.log('Firebase Auth:', auth);
   ```

---

## 📱 **Production Deployment**

### **Environment Variables for Production:**

#### **Frontend (Vercel/Netlify)**
```env
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### **Backend (Heroku/Railway)**
```env
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

### **Security Checklist:**
- ✅ Use strong JWT secret (32+ characters)
- ✅ Enable HTTPS in production
- ✅ Set up proper CORS origins
- ✅ Use environment variables for all secrets
- ✅ Never commit `.env` files or service account keys
- ✅ Set up Firebase security rules
- ✅ Enable MongoDB authentication

---

## 🎉 **Success!**

Once everything is set up correctly, you should have:

- ✅ Google Sign-In working on login page
- ✅ Users automatically created in MongoDB
- ✅ JWT tokens generated for backend authentication
- ✅ Seamless integration with existing auth system
- ✅ User profiles with Google profile pictures
- ✅ Role-based access control maintained

Your marine survey application now supports both traditional email/password authentication and modern Google Sign-In! 🌊⚓



