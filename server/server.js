const exp=require('express')
const app=exp()
const mongoose=require("mongoose")
const cors=require("cors")

require("dotenv").config()
app.use(exp.json())
app.use(cors())
mongoose.connect(process.env.DBURL)
.then(()=>{
    console.log("connected to mongodb")
    app.listen(process.env.PORT,()=>{
        console.log("server listening on port",process.env.PORT)
    })
})
.catch(err=>console.log(err))
const studentApp = require('./APIs/studentApi')
const teacherApp=require('./APIs/teacherApi')
const chatbotApp = require('./APIs/chatbotApi')
app.use("/student-api",studentApp)
app.use("/teacher-api",teacherApp)
app.use("/chatbot-api", chatbotApp)
module.exports=app;
