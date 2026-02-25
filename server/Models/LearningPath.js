const mongoose = require("mongoose")

const learningPathSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  weakTopics: [String],
  recommendedTopics: [String],

  difficultyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"]
  },

  generatedBy: {
    type: String, // ML model version
    default: "v1"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})
const learningModel=mongoose.model("learningpath",learningPathSchema)
module.exports=learningModel
