const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Supported roles
const ROLES = ['admin', 'ship_management', 'owner', 'surveyor', 'cargo_manager', 'user'];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Only required if not using Firebase auth
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'user' // legacy default; mapped to Owner dashboard on frontend
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date
  },
  // Firebase authentication fields
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  photoURL: {
    type: String
  },
  provider: {
    type: String,
    enum: ['google', 'email', 'facebook', 'twitter'],
    default: 'email'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (skip for Firebase users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.firebaseUid) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Export both the model and roles list for validation use
User.ROLES = ROLES;
module.exports = User;