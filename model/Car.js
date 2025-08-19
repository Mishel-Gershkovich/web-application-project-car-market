const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  manufacturer: String,
  model: String,
  year: Number,
  description: String,
  ownerUsername: { type: String, required: true },
  ownerName:     { type: String, required: true },
  ownerPhone:    { type: String, required: true },
  imageUrl:      { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', CarSchema);