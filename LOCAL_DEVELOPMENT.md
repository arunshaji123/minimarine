# Local Development Guide

This guide will help you run the Marine Survey application locally for development and testing without needing to deploy to Render.

## Prerequisites

1. Node.js (v14 or higher)
2. MongoDB (local or Atlas)
3. Git

## Setup Instructions

### 1. Environment Configuration

#### Backend (.env file in backend directory)
Make sure your `backend/.env` file is properly configured:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here_change_in_production
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marine_survey?retryWrites=true&w=majority

# Firebase Configuration (optional for local development)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

#### Frontend (.env.development file in frontend directory)
The `frontend/.env.development` file should be:

```env
# Development environment variables
REACT_APP_API_URL=http://localhost:5000
```

### 2. Install Dependencies

From the root directory, run:

```bash
npm run install-all
```

This will install dependencies for the root project, backend, and frontend.

### 3. Create Upload Directories

The application now supports uploading vessel photos and videos. Create the necessary directories:

```bash
mkdir -p backend/uploads/vessels
mkdir -p backend/uploads/documents
```

### 4. Run the Application

#### Option 1: Run Both Services Together (Recommended)
From the root directory:

```bash
npm run dev
```

This will start both the backend (on port 5000) and frontend (on port 3000) simultaneously using `concurrently`.

#### Option 2: Run Services Separately

In one terminal, start the backend:
```bash
cd backend
npm run dev
```

In another terminal, start the frontend:
```bash
cd frontend
npm start
```

### 4. Access the Application

Once both services are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 5. Testing API Endpoints

You can test the API directly:
- Test endpoint: http://localhost:5000/api/test
- Auth endpoint: http://localhost:5000/api/auth/test

## New Feature: Vessel Media Upload

### How to Use
1. Navigate to the Owner Dashboard
2. Go to the "Ships" tab
3. Click "Add New Ship" or "Edit" on an existing ship
4. In the modal, scroll to the "Ship Media" section
5. Select photos (up to 10, 5MB each) and videos (up to 5, 50MB each)
6. The media will be uploaded when you save the vessel

### Supported File Types
- **Photos**: JPEG, PNG, GIF
- **Videos**: MP4, AVI, MOV

### Viewing Media
- Uploaded media is displayed as thumbnails in the vessel cards
- Click on a vessel to see all associated media

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend server.js has the correct CORS configuration for localhost.

2. **MongoDB Connection Issues**: 
   - Verify your MONGODB_URI in backend/.env
   - Check your internet connection if using MongoDB Atlas
   - Ensure your IP is whitelisted in MongoDB Atlas

3. **Port Conflicts**: 
   - If port 5000 or 3000 is in use, you can change the PORT in backend/.env
   - Update the REACT_APP_API_URL in frontend/.env.development accordingly

4. **Environment Variables Not Loading**: 
   - Make sure .env files are in the correct directories
   - Restart the development servers after making changes to .env files

5. **File Upload Issues**:
   - Ensure the `backend/uploads/vessels` directory exists
   - Check file size limits (5MB for photos, 50MB for videos)
   - Verify file types are supported

### Testing Changes Locally

1. Make your code changes
2. Save the files (both backend and frontend will automatically reload)
3. Refresh your browser to see the changes
4. No need to redeploy to Render for local testing

## Development Workflow

1. Make changes to your code
2. Test locally at http://localhost:3000
3. Once satisfied, commit and push to GitHub
4. Render will automatically deploy the changes

This local development setup will allow you to test all new functionalities without having to deploy to Render every time.