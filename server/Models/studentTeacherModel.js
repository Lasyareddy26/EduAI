const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },

  firstName: {
    type: String,
    required: true
  },

  lastName: String,

  email: {
    type: String,
    required: true,
    unique: true
  },

  profileImageUrl: String,

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})
const studentTeacherModel=mongoose.model("studentteacher",userSchema)
module.exports=studentTeacherModel
