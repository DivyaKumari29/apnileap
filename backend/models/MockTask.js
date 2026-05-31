const mongoose = require("mongoose");

const MockTaskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  boardId: {
    type: String,
    required: true,
    index: true
  },
  fields: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("MockTask", MockTaskSchema);
