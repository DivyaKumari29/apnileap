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
  projectId: {
    type: String,
    default: null
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
  subFaculty: {
    type: TeamMemberSchema,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Team", TeamSchema);
