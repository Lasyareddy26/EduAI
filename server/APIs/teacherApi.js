const exp = require("express")
const teacherApp = exp.Router()
teacherApp.use(exp.json())

const assignmentModel = require("../Models/Assignment")
const submissionModel = require("../Models/submission")
const learningModel = require("../Models/LearningPath")
const studentTeacherModel=require("../Models/studentTeacherModel")
require('dotenv').config()
//post teacher
// TEACHER → CREATE ACCOUNT
teacherApp.post("/teacher", (req, res) => {
  const {
    role,
    firstName,
    lastName,
    email,
    profileImageUrl,
    isActive,
    createdAt
  } = req.body;

  // 1️⃣ Role validation
  if (role !== "teacher") {
    return res.status(400).send({
      message: "invalid role",
      payload: null
    });
  }

  // 2️⃣ Check email → create → save
  studentTeacherModel.findOne({ email })
    .then(user => {
      if (user) {
        // ✅ FIX: Send response, then explicitly return NULL to stop the chain
        res.status(409).send({
          message: "email already registered",
          payload: null
        });
        return null; 
      }

      const newTeacher = new studentTeacherModel({
        role: "teacher", // Force role to teacher
        firstName,
        lastName,
        email,
        profileImageUrl,
        isActive: isActive ?? true,
        createdAt: createdAt ?? new Date()
      });

      return newTeacher.save();
    })
    .then(savedTeacher => {
      // ✅ Check if the previous step returned null (meaning email existed)
      if (!savedTeacher) return;

      res.status(201).send({
        message: "teacher created successfully",
        payload: savedTeacher
      });
    })
    .catch(err => {
      // Safety check: ensure we don't send a response if one was already sent
      if (!res.headersSent) {
        res.status(500).send({
          message: "error creating teacher",
          payload: err.message
        });
      }
    });
});
// teacherApi.js
// server/APIs/teacherApi.js

const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// 🤖 ROUTE: GENERATE QUESTIONS WITH GROQ
// 🤖 ROUTE: GENERATE QUESTIONS USING GROQ
teacherApp.post("/generate-questions", async (req, res) => {
  const { subject, topic, count } = req.body;

  try {
    const prompt = `
      You are an exam setter. Generate ${count || 5} multiple-choice questions (MCQ) on the subject "${subject}" and topic "${topic}".
      
      Strictly return ONLY a raw JSON array. Do not use Markdown code blocks or introduction text.
      
      The JSON structure for each question must be:
      {
        "questionText": "Question string",
        "type": "mcq",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option string (must match one of the options exactly)",
        "marks": 1
      }
    `;

    // 2. CALL GROQ API
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // ✅ UPDATED: Using the 'llama-3.1-8b-instant' model as requested
      model: "llama-3.1-8b-instant", 
      temperature: 0.5, 
    });

    const text = completion.choices[0]?.message?.content || "";

    // 3. CLEAN UP AND PARSE
    // Find the first '[' and the last ']' to ignore any extra text the AI might add
    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      throw new Error("AI did not return a valid array");
    }

    const cleanedText = text.substring(jsonStartIndex, jsonEndIndex);
    const questions = JSON.parse(cleanedText);

    res.send({ message: "Questions generated", payload: questions });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).send({ message: "AI Generation Failed", payload: err.message });
  }
});


// TEACHER → GET ALL STUDENTS
teacherApp.get("/students", (req, res) => {
  studentTeacherModel.find({ role: "student" }) // Find all users with role 'student'
    .then(students => {
      res.send({ message: "Students fetched", payload: students })
    })
    .catch(err => {
      res.status(500).send({ message: "Error", payload: err.message })
    })
})



// TEACHER → CREATE ASSIGNMENT
teacherApp.post("/create-assignment", (req, res) => {
  assignmentModel.create(req.body)
    .then(assignment =>
      res.status(201).send({ message: "Assignment created", payload: assignment })
    )
    .catch(err =>
      res.status(400).send({ message: "Assignment creation failed", payload: err.message })
    )
})

// TEACHER → VIEW ALL SUBMISSIONS FOR ASSIGNMENT
teacherApp.get("/view-submissions/:assignmentId", (req, res) => {
  submissionModel.find({ assignmentId: req.params.assignmentId })
    .populate("studentId", "firstName lastName email")
    .then(submissions =>
      res.send({ message: "Submissions fetched", payload: submissions })
    )
    .catch(err =>
      res.status(500).send({ message: "Error", payload: err.message })
    )
})

// TEACHER → VIEW AI LEARNING PATH OF STUDENT
teacherApp.get("/ai-suggestion/:studentId", (req, res) => {
  learningModel.find({ studentId: req.params.studentId })
    .then(path =>
      res.send({ message: "AI suggestions fetched", payload: path })
    )
    .catch(err =>
      res.status(500).send({ message: "Error", payload: err.message })
    )
})

// server/APIs/teacherApi.js

// ... inside teacherApp ...

// 1. GET ASSIGNMENTS BY TEACHER NAME
teacherApp.get("/assignments/:teacherName", (req, res) => {
  // Matches the 'teacherdata.NameOfTeacher' field in your specific schema structure
  assignmentModel.find({ "teacherdata.NameOfTeacher": req.params.teacherName })
    .sort({ createdAt: -1 }) // Newest first
    .then(assignments => {
      res.send({ message: "Assignments fetched", payload: assignments })
    })
    .catch(err => {
      res.status(500).send({ message: "Error fetching assignments", payload: err.message })
    })
})

// 2. GET SUBMISSION COUNT (For the "Expand" stats)
teacherApp.get("/submission-count/:assignmentId", (req, res) => {
  submissionModel.countDocuments({ assignmentId: req.params.assignmentId })
    .then(count => {
      res.send({ message: "Count fetched", payload: { count } })
    })
    .catch(err => {
      res.status(500).send({ message: "Error", payload: err.message })
    })
})



// 🆕 STUDENT ROUTE: GET ALL ASSIGNMENTS
teacherApp.get("/all-assignments", (req, res) => {
  assignmentModel.find() // Fetches EVERYTHING
    .sort({ createdAt: -1 })
    .then(assignments => {
      res.send({ message: "All assignments fetched", payload: assignments })
    })
    .catch(err => {
      res.status(500).send({ message: "Error fetching assignments", payload: err.message })
    })
})
teacherApp.get("/teacher-by-email/:email", (req, res) => {
  studentTeacherModel.findOne({ email: req.params.email })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User not found in MongoDB", payload: null });
      }
      res.send({ message: "User found", payload: user });
    })
    .catch(err => {
      res.status(500).send({ message: "Error fetching user", payload: err.message });
    });
});

module.exports = teacherApp
