# 🚀 Quick Firebase Setup for Google Sign-In

## ⚡ **5-Minute Setup**

### **Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: `marine-survey-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### **Step 2: Enable Google Authentication**
1. Click "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Click "Google" → Toggle "Enable"
4. Add your email as support email
5. Click "Save"

### **Step 3: Get Firebase Config**
1. Click ⚙️ → "Project settings"
2. Scroll to "Your apps" → Click "Add app" → Web (</>)
3. Register app: `marine-survey-web`
4. **Copy the config object** (you'll need this!)

### **Step 4: Create Frontend Environment File**
Create `frontend/.env.local`:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_from_step_3
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### **Step 5: Generate Service Account Key**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Rename to `firebase-service-account-key.json`
5. Place in `backend/` folder

### **Step 6: Create Backend Environment File**
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/marine_survey?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_change_in_production_make_it_long_and_random
```

### **Step 7: Restart Servers**
```bash
# Stop current servers (Ctrl+C)
# Then restart:
npm run dev
```

## 🎯 **Test Google Sign-In**

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete Google authentication
4. You should be redirected to dashboard!

## 🔧 **Troubleshooting**

### **"Firebase not configured" Error**
- Check `frontend/.env.local` exists and has correct values
- Restart frontend server

### **"Firebase authentication not configured" Error**
- Check `backend/firebase-service-account-key.json` exists
- Restart backend server

### **"Unauthorized domain" Error**
- Add `localhost:3000` to authorized domains in Firebase Console
- Authentication → Settings → Authorized domains

## 🎉 **Success!**

Once configured, you'll have:
- ✅ Google Sign-In button on login page
- ✅ Users automatically created in MongoDB
- ✅ Profile pictures from Google accounts
- ✅ Same role-based access as email users

**Your marine survey app now supports modern Google authentication!** 🌊⚓



