const mongoose = require("mongoose")

const roadmapNodeSchema = new mongoose.Schema({
  step: Number,
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["completed", "current", "upcoming"],
    default: "upcoming"
  }
}, { _id: false })

const resourceSchema = new mongoose.Schema({
  title: String,
  type: { type: String },       // article, video, quiz, practice, project
  url: { type: String, default: "#" },
  duration: String
}, { _id: false })

const learningPathSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "studentteacher",
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  topic: {
    type: String,
    required: true
  },

  scorePercentage: Number,

  difficultyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"]
  },

  roadmap: [roadmapNodeSchema],

  resources: [resourceSchema],

  tip: String,

  aiMessage: String,

  generatedBy: {
    type: String,
    default: "ml-v2-decision-tree"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Compound index: one path per student per topic (latest wins)
learningPathSchema.index({ studentId: 1, topic: 1 })

const learningModel = mongoose.model("learningpath", learningPathSchema)
module.exports = learningModel
