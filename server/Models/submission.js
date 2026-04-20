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

  answers: [
    {
      questionId: String,
      answer: String,
      isCorrect: { type: Boolean, default: null },    // null = not evaluated yet
      marksAwarded: { type: Number, default: 0 },
      teacherComment: { type: String, default: "" },
      aiMarksAwarded: { type: Number, default: null },  // AI-suggested score
      aiFeedback: { type: String, default: "" }          // AI evaluation feedback
    }
  ],

  // Auto-evaluated score (MCQ + T/F + FillBlank)
  autoScore: {
    type: Number,
    default: 0
  },

  // Teacher-graded score (Short + Essay)
  manualScore: {
    type: Number,
    default: 0
  },

  // Combined final score
  finalScore: {
    type: Number,
    default: 0
  },

  // Whether manual grading is needed
  evaluationStatus: {
    type: String,
    enum: ["auto-complete", "pending-review", "reviewed"],
    default: "auto-complete"
  },

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