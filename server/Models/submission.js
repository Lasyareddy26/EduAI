const mongoose = require("mongoose")

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "assignment",
    required: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "studentteacher",
    required: true
  },

  // ✅ FIX 1: Change 'Map' to 'Array' (matches your frontend payload)
  answers: [
    {
      questionId: String,
      answer: String
    }
  ],

  // ✅ FIX 2: Rename 'score' to 'finalScore' (matches your frontend payload)
  finalScore: {
    type: Number,
    required: true
  },

  // Optional fields
  aiFeedback: String,
  teacherFeedback: String,
  
  status: {
    type: String,
    enum: ["submitted", "reviewed"],
    default: "submitted"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

const submissionModel = mongoose.model("submission", submissionSchema)
module.exports = submissionModel