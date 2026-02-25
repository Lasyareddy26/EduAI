const exp = require("express")
const studentApp = exp.Router()
const axios = require('axios') // ✅ Import Axios for Python API calls

studentApp.use(exp.json())

const assignmentModel = require("../Models/Assignment")
const submissionModel = require("../Models/submission")
const learningModel = require("../Models/LearningPath")
const questionModel = require("../Models/QuestionBank")
const studentTeacherModel = require('../Models/studentTeacherModel')

// STUDENT → CREATE ACCOUNT
studentApp.post("/student", (req, res) => {
  const { role, firstName, lastName, email, profileImageUrl, isActive, createdAt } = req.body;
  if (role !== "student" && role !== "teacher") {
    return res.status(400).send({ message: "invalid role", payload: null });
  }
  studentTeacherModel.findOne({ email })
    .then(user => {
      if (user) {
        res.status(409).send({ message: "email already registered", payload: null });
        return null; 
      }
      const newUser = new studentTeacherModel({
        role, firstName, lastName, email, profileImageUrl,
        isActive: isActive ?? true, createdAt: createdAt ?? new Date()
      });
      return newUser.save();
    })
    .then(savedUser => {
      if (!savedUser) return; 
      res.status(201).send({ message: "student created successfully", payload: savedUser });
    })
    .catch(err => {
      if (!res.headersSent) {
        res.status(500).send({ message: "error creating student", payload: err.message });
      }
    });
});

// STUDENT → VIEW ALL ASSIGNMENTS
studentApp.get("/assignments", (req, res) => {
  assignmentModel.find()
    .then(assignments => res.send({ message: "Assignments fetched", payload: assignments }))
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }))
})

// STUDENT → VIEW OWN SUBMISSIONS
studentApp.get("/my-submissions/:studentId", (req, res) => {
  submissionModel.find({ studentId: req.params.studentId })
    .populate("assignmentId", "title subject totalMarks") // Correctly populates the unique quiz title
    .sort({ createdAt: -1 }) 
    .then(submissions => res.send({ message: "Submissions fetched", payload: submissions }))
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }))
})

// STUDENT → VIEW AI LEARNING PATHS (all topics)
studentApp.get("/learning-path/:studentId", async (req, res) => {
  try {
    const paths = await learningModel.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 })
    res.send({ message: "Learning paths fetched", payload: paths })
  } catch (err) {
    res.status(500).send({ message: "Error", payload: err.message })
  }
})

// STUDENT → VIEW RESOURCES
studentApp.get("/resources/:subject/:topic", (req, res) => {
  questionModel.find({ subject: req.params.subject, topic: req.params.topic })
    .then(resources => res.send({ message: "Resources fetched", payload: resources }))
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }))
})

// STUDENT → GET SINGLE ASSIGNMENT
studentApp.get("/assignment/:id", (req, res) => {
  assignmentModel.findById(req.params.id)
    .then(assignment => {
      if (!assignment) return res.status(404).send({ message: "Assignment not found" });
      res.send({ message: "Assignment fetched", payload: assignment });
    })
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }));
});

// ✅ STUDENT → SUBMIT ASSIGNMENT & TRIGGER ML (supports all question types)
studentApp.post("/submit-assignment", async (req, res) => {
  const submissionData = req.body;
  
  console.log("📥 Received Submission Data:", submissionData);

  try {
    // 1. Validate Assignment exists and fetch details
    const assignment = await assignmentModel.findById(submissionData.assignmentId);
    if (!assignment) {
      return res.status(404).send({ message: "Assignment not found. Cannot submit." });
    }

    // 2. Auto-evaluate each answer
    let autoScore = 0;
    let manualScore = 0;
    let hasManualQuestions = false;

    const evaluatedAnswers = (submissionData.answers || []).map(ans => {
      const question = assignment.questions.find(q => q._id.toString() === ans.questionId);
      if (!question) {
        return { ...ans, isCorrect: null, marksAwarded: 0 };
      }

      const qType = question.type;
      const studentAnswer = (ans.answer || "").trim().toLowerCase();
      const correctAnswer = (question.correctAnswer || "").trim().toLowerCase();

      // Auto-evaluate: mcq, truefalse, fillblank
      if (qType === "mcq" || qType === "truefalse" || qType === "fillblank") {
        const isCorrect = studentAnswer === correctAnswer;
        const marksAwarded = isCorrect ? (question.marks || 1) : 0;
        autoScore += marksAwarded;
        return { ...ans, isCorrect, marksAwarded };
      }

      // Manual evaluation needed: short, essay
      hasManualQuestions = true;
      return { ...ans, isCorrect: null, marksAwarded: 0, teacherComment: "" };
    });

    const evaluationStatus = hasManualQuestions ? "pending-review" : "auto-complete";
    const finalScore = autoScore; // Will be updated when teacher reviews manual answers

    // 3. Save Submission to MongoDB
    const newSubmission = await submissionModel.create({
      assignmentId: submissionData.assignmentId,
      studentId: submissionData.studentId,
      answers: evaluatedAnswers,
      autoScore,
      manualScore: 0,
      finalScore,
      evaluationStatus,
      status: "submitted"
    });
    console.log(`✅ Submission Saved for ${assignment.title}:`, newSubmission._id);

    // 4. Call Python ML Service using the specific assignment's context
    const mlPayload = {
      subject: assignment.subject,
      topic: assignment.title,
      score: finalScore,
      total_marks: assignment.totalMarks
    };

    console.log("🤖 Sending to Python ML:", mlPayload);

    try {
      const mlResponse = await axios.post('http://127.0.0.1:8000/predict-path', mlPayload);
      const mlResult = mlResponse.data;

      console.log("🤖 AI Prediction:", mlResult.predicted_difficulty);

      // Upsert: update if same student+topic exists, else create new
      await learningModel.findOneAndUpdate(
        { studentId: submissionData.studentId, topic: mlResult.topic },
        {
          studentId: submissionData.studentId,
          subject: mlResult.subject,
          topic: mlResult.topic,
          scorePercentage: mlResult.score_percentage,
          difficultyLevel: mlResult.predicted_difficulty,
          roadmap: mlResult.roadmap || [],
          resources: mlResult.resources || [],
          tip: mlResult.tip || "",
          aiMessage: mlResult.ai_message || "",
          generatedBy: "ml-v2-decision-tree",
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log("✅ ML Learning Path Generated & Saved for topic:", mlResult.topic);

    } catch (mlErr) {
      console.error("⚠️ ML Service Warning:", mlErr.message);
    }

    res.status(201).send({ message: "Assignment submitted successfully", payload: newSubmission });

  } catch (err) {
    console.error("❌ Submission Error:", err.message);
    res.status(400).send({ message: "Submission failed", payload: err.message });
  }
});

// GET USER BY EMAIL (For Clerk Sync)
studentApp.get("/student-by-email/:email", (req, res) => {
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

module.exports = studentApp