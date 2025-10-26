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
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set, using default');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

const app = express();

// Configure CORS for local development and Render deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite development server
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Add FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  console.log('Adding FRONTEND_URL to allowed origins:', process.env.FRONTEND_URL);
}

console.log('All allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Allowing origin', origin);
      callback(null, true);
    } else {
      console.log('CORS: Blocking origin', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(null, true); // Temporarily allow all for development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form data

// Serve static files for vessel media
app.use('/uploads/vessels', express.static(path.join(__dirname, 'uploads/vessels')));

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