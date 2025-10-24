const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not found');
console.log('PORT:', process.env.PORT || 'Not set, using default 5000');

const app = express();

// Configure CORS for Render deployment
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/firebase-auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vessels', require('./routes/vessels'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/cargo', require('./routes/cargo'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/crew', require('./routes/crew'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/user-management', require('./routes/user-management'));
app.use('/api/surveyor-bookings', require('./routes/surveyor-bookings'));
app.use('/api/cargo-manager-bookings', require('./routes/cargo-manager-bookings'));
app.use('/api/service-requests', require('./routes/service-requests'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI environment variable not set!');
  console.log('🔧 Please check your .env file');
} else {
  console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI);
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('');
    console.log('🔧 Please check your MongoDB setup:');
    console.log('   1. For MongoDB Atlas: Update MONGODB_URI in backend/.env with your connection string');
    console.log('   2. For local MongoDB: Install MongoDB and use mongodb://localhost:27017/marine_survey');
    console.log('   3. See MONGODB_SETUP.md for detailed instructions');
    console.log('');
  });
}

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Marine Survey API is running!' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API test successful!', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});