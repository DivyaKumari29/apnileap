const mongoose = require("mongoose");

const TeamMemberSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    default: ""
  },
  avatarUrl: {
    type: String,
    default: "https://i.pravatar.cc/150"
  }
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  boardId: {
    type: String,
    required: true
  },
  members: [TeamMemberSchema],
  mentor: {
    type: TeamMemberSchema,
    default: null
  },
  teamLeader: {
    type: TeamMemberSchema,
    default: null
  },
  projectId: {
    type: String,
    default: null
  },
  subMentor: {
    type: TeamMemberSchema,
    default: null
  },
  finalProgress: {
    reportUrl: { type: String, default: "" },
    facultyComments: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    status: { 
      type: String, 
      enum: ["Pending", "Submitted", "Evaluated"], 
      default: "Pending" 
    },
    rating: { type: Number, default: 0 },
    companyFeedback: { type: String, default: "" },
    evaluatedAt: { type: Date, default: null },
    evaluatedBy: { type: String, default: "" }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Team", TeamSchema);
