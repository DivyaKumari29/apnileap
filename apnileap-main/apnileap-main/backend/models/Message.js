const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
