// Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  fromUsername: { type: String, required: true },
  toUsername:   { type: String, required: true },
  car:          { type: mongoose.Schema.Types.ObjectId, ref: 'Car' }, // אופציונלי, עוזר לקשר לרכב
  text:         { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt:    { type: Date, default: Date.now },
  read:         { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
