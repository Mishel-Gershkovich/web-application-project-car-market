const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  username: { type: String, required: true },                  // שם המשתמש שהגיב
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text:     { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt:{ type: Date, default: Date.now }
});

const CarSchema = new mongoose.Schema({
  manufacturer: String,
  model: String,
  year: Number,
  description: String,
  ownerUsername: { type: String, required: true },
  ownerName:     { type: String, required: true },
  ownerPhone:    { type: String, required: true },
  imageUrl:      { type: String },
  comments:      { type: [CommentSchema], default: [] },       // ← חדש
  createdAt:     { type: Date, default: Date.now },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', CarSchema);