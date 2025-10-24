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

// Explicitly set CORS headers (before other middleware)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
  
  // Set CORS headers
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  } else if (!origin || origin === 'http://localhost:3000') {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  } else {
    // For debugging, allow the requesting origin
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Configure CORS for Render deployment
const allowedOrigins = [
  'http://localhost:3000'
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
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware (this will work with our explicit headers above)
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