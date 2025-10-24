# MongoDB Setup Guide

Since MongoDB is not installed locally, you have two options:

## Option 1: Use MongoDB Atlas (Cloud) - Recommended

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Verify your email address

### Step 2: Create a Cluster
1. After logging in, click "Build a Database"
2. Choose "FREE" tier (M0 Sandbox)
3. Select a cloud provider and region (choose closest to you)
4. Name your cluster (e.g., "marine-survey-cluster")
5. Click "Create Cluster"

### Step 3: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (remember these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `marine_survey`

### Step 6: Update Environment File
1. Open `backend/.env`
2. Replace the MONGODB_URI with your connection string:
```
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/marine_survey?retryWrites=true&w=majority
```

## Option 2: Install MongoDB Locally

### For Windows:
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Install MongoDB as a Windows Service
4. MongoDB will start automatically

### For macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### For Linux (Ubuntu):
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### After Local Installation:
1. Open `backend/.env`
2. Uncomment the local MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/marine_survey
```
3. Comment out the Atlas URI

## Verify Connection

After setting up MongoDB (either option), you can test the connection by starting the backend server:

```bash
cd backend
npm run dev
```

You should see: "MongoDB connected successfully" in the console.

## Troubleshooting

### Atlas Connection Issues:
- Check your username/password in the connection string
- Ensure your IP is whitelisted in Network Access
- Verify the database name is correct

### Local MongoDB Issues:
- Ensure MongoDB service is running
- Check if port 27017 is available
- Verify MongoDB is properly installed

## Next Steps

Once MongoDB is set up, you can start the full application:

```bash
# From the root directory
npm run dev
```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000).