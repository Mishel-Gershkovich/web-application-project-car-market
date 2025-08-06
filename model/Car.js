const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  manufacturer: String,
  model: String,
  year: Number,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', CarSchema);