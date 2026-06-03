const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  comments: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Awaiting Review", "Approved", "Re-work Requested"],
    default: "Awaiting Review"
  },
  feedback: {
    type: String,
    default: ""
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Submission", SubmissionSchema);
