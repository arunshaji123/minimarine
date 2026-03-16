const mongoose = require('mongoose');

const CustomReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['premium', 'hull-inspection'],
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

CustomReportSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('CustomReport', CustomReportSchema);
