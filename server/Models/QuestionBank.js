const mongoose = require("mongoose")

const questionBankSchema = new mongoose.Schema({
  subject: String,
  topic: String,
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"]
  },

  questions: Array,

  generatedBy: {
    type: String,
    default: "gemini"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

const questionModel=mongoose.model("question",questionBankSchema)
module.exports=questionModel