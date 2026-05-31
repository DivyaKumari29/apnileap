const mongoose = require("mongoose");

const AllocationSchema = new mongoose.Schema({
  targetCampusId: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Proposed", "Declined"],
    default: "Proposed"
  },
  proposedDueDate: {
    type: String,
    required: true
  },
  assignedKey: {
    type: String,
    default: null
  }
});

const CorporateProjectSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  logoUrl: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  budget: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Proposed", "Pending Assignment", "Assigned (BREACHED - Incomplete)"],
    default: "Pending Assignment"
  },
  assignedTo: {
    type: String,
    default: null
  },
  targetCampusId: {
    type: String,
    default: null
  },
  proposedDueDate: {
    type: String,
    required: true
  },
  assignedKey: {
    type: String,
    default: null
  },
  dateAdded: {
    type: String,
    default: () => new Date().toISOString().split("T")[0]
  },
  problemStatementUrl: {
    type: String,
    default: ""
  },
  allocations: [AllocationSchema]
});

module.exports = mongoose.model("CorporateProject", CorporateProjectSchema);
