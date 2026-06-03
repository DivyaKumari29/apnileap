const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  campusId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  agenda: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Meeting", MeetingSchema);
