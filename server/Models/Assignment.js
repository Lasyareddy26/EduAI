const mongoose = require("mongoose")
const teacherSchema=new mongoose.Schema({
  NameOfTeacher: {
    type: String,
    required: true
  },

  subject: String
},{"strict":"throw"})

const assignmentSchema = new mongoose.Schema({
  teacherdata:teacherSchema,
  title: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  topic: String,

  questions: [
    {
      questionText: String,
      type: {
        type: String,
        enum: ["mcq", "short", "essay"]
      },
      options: [String],       // for MCQs
      correctAnswer: String,   // for MCQs / reference
      marks: Number
    }
  ],

  totalMarks: Number,

  deadline: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
})

const assignmentModel=mongoose.model("assignment",assignmentSchema)
module.exports=assignmentModel
