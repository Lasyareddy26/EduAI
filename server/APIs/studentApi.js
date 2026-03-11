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
    .populate("assignmentId", "title topic subject totalMarks") // Correctly populates the unique quiz title
    .sort({ createdAt: -1 }) 
    .then(submissions => res.send({ message: "Submissions fetched", payload: submissions }))
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }))
})

// STUDENT → VIEW SINGLE SUBMISSION WITH FEEDBACK
studentApp.get("/submission-detail/:submissionId", (req, res) => {
  submissionModel.findById(req.params.submissionId)
    .populate("assignmentId", "title topic subject totalMarks questions")
    .populate("studentId", "firstName lastName email")
    .then(submission => {
      if (!submission) {
        return res.status(404).send({ message: "Submission not found", payload: null })
      }
      res.send({ message: "Submission fetched", payload: submission })
    })
    .catch(err => res.status(500).send({ message: "Error", payload: err.message }))
})

// STUDENT → GET BADGES (computed from submissions + learning paths)
studentApp.get("/badges/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId
    const submissions = await submissionModel.find({ studentId })
      .populate("assignmentId", "title topic subject totalMarks createdAt")
      .sort({ createdAt: 1 }) // oldest first for streak calc

    const learningPaths = await learningModel.find({ studentId })
    const badges = []

    console.log(`[Badges] Student ${studentId}: ${submissions.length} submissions, ${learningPaths.length} learning paths`)

    // --- 1. FIRST STEPS ---
    if (submissions.length >= 1) {
      badges.push({
        id: 'first-submission',
        name: 'First Steps',
        description: 'Submitted your very first assignment',
        icon: '🚀',
        tier: 'bronze',
        earnedAt: submissions[0].createdAt
      })
    }

    // --- 2. QUIZ MACHINE (3, 5, 10, 25 submissions) ---
    const subCounts = [
      { count: 3, name: 'Getting Started', desc: 'Completed 3 assignments', tier: 'bronze' },
      { count: 5, name: 'Quiz Taker', desc: 'Completed 5 assignments', tier: 'bronze' },
      { count: 10, name: 'Quiz Machine', desc: 'Completed 10 assignments', tier: 'silver' },
      { count: 25, name: 'Unstoppable', desc: 'Completed 25 assignments', tier: 'gold' },
    ]
    for (const sc of subCounts) {
      if (submissions.length >= sc.count) {
        badges.push({
          id: `submissions-${sc.count}`,
          name: sc.name,
          description: sc.desc,
          icon: '📝',
          tier: sc.tier,
          earnedAt: submissions[sc.count - 1].createdAt
        })
      }
    }

    // --- 3. PERFECT SCORE ---
    const perfectSubs = submissions.filter(s => {
      const total = s.assignmentId?.totalMarks
      return total && total > 0 && s.finalScore >= total
    })
    if (perfectSubs.length >= 1) {
      badges.push({
        id: 'perfect-score',
        name: 'Perfectionist',
        description: 'Scored 100% on an assignment',
        icon: '💯',
        tier: 'gold',
        earnedAt: perfectSubs[0].createdAt
      })
    }
    if (perfectSubs.length >= 3) {
      badges.push({
        id: 'triple-perfect',
        name: 'Flawless',
        description: 'Scored 100% on 3 different assignments',
        icon: '👑',
        tier: 'platinum',
        earnedAt: perfectSubs[2].createdAt
      })
    }

    // --- 4. HIGH SCORER (80%+ on 3 assignments) ---
    const highScoreSubs = submissions.filter(s => {
      const total = s.assignmentId?.totalMarks
      return total && total > 0 && (s.finalScore / total) >= 0.8
    })
    if (highScoreSubs.length >= 3) {
      badges.push({
        id: 'high-scorer',
        name: 'Honor Roll',
        description: 'Scored 80%+ on 3 assignments',
        icon: '🏅',
        tier: 'gold',
        earnedAt: highScoreSubs[2].createdAt
      })
    }

    // --- 5. SUBJECT EXPLORER (submitted in 3+ different subjects) ---
    const subjectSet = new Set()
    submissions.forEach(s => {
      if (s.assignmentId?.subject) subjectSet.add(s.assignmentId.subject)
    })
    if (subjectSet.size >= 3) {
      badges.push({
        id: 'subject-explorer',
        name: 'Explorer',
        description: `Attempted assignments in ${subjectSet.size} different subjects`,
        icon: '🧭',
        tier: 'silver',
        earnedAt: submissions.find((s, i) => {
          const seen = new Set()
          for (let j = 0; j <= i; j++) {
            if (submissions[j].assignmentId?.subject) seen.add(submissions[j].assignmentId.subject)
          }
          return seen.size >= 3
        })?.createdAt
      })
    }
    if (subjectSet.size >= 5) {
      badges.push({
        id: 'renaissance',
        name: 'Renaissance Mind',
        description: `Mastered ${subjectSet.size} different subjects`,
        icon: '🎨',
        tier: 'gold',
        earnedAt: new Date()
      })
    }

    // --- 6. STREAK (submissions on consecutive days) ---
    const daySet = new Set()
    submissions.forEach(s => {
      daySet.add(new Date(s.createdAt).toISOString().slice(0, 10))
    })
    const sortedDays = [...daySet].sort()
    let maxStreak = 1, currentStreak = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1])
      const curr = new Date(sortedDays[i])
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak) }
      else { currentStreak = 1 }
    }
    if (maxStreak >= 3) {
      badges.push({
        id: 'streak-3',
        name: 'On Fire',
        description: `${maxStreak}-day submission streak!`,
        icon: '🔥',
        tier: maxStreak >= 7 ? 'gold' : 'silver',
        earnedAt: new Date()
      })
    }

    // --- 7. NIGHT OWL (submitted after 10 PM) ---
    const nightSubs = submissions.filter(s => {
      const hour = new Date(s.createdAt).getHours()
      return hour >= 22 || hour < 5
    })
    if (nightSubs.length >= 1) {
      badges.push({
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Submitted an assignment late at night 🌙',
        icon: '🦉',
        tier: 'bronze',
        earnedAt: nightSubs[0].createdAt
      })
    }

    // --- 8. EARLY BIRD (submitted before 7 AM) ---
    const earlySubs = submissions.filter(s => {
      const hour = new Date(s.createdAt).getHours()
      return hour >= 5 && hour < 7
    })
    if (earlySubs.length >= 1) {
      badges.push({
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Submitted an assignment before 7 AM ☀️',
        icon: '🐦',
        tier: 'bronze',
        earnedAt: earlySubs[0].createdAt
      })
    }

    // --- 9. COMEBACK KID (scored <40% then >80% in same subject) ---
    const subjectHistory = {}
    submissions.forEach(s => {
      const subj = s.assignmentId?.subject
      const total = s.assignmentId?.totalMarks
      if (!subj || !total || total === 0) return
      const pct = (s.finalScore / total) * 100
      if (!subjectHistory[subj]) subjectHistory[subj] = []
      subjectHistory[subj].push({ pct, date: s.createdAt })
    })
    for (const subj of Object.keys(subjectHistory)) {
      const hist = subjectHistory[subj]
      let hadLow = false
      for (const entry of hist) {
        if (entry.pct < 40) hadLow = true
        if (hadLow && entry.pct >= 80) {
          badges.push({
            id: 'comeback-kid',
            name: 'Comeback Kid',
            description: `Went from failing to acing in ${subj}!`,
            icon: '⚡',
            tier: 'platinum',
            earnedAt: entry.date
          })
          break
        }
      }
      if (badges.find(b => b.id === 'comeback-kid')) break
    }

    // --- 10. LEARNING PATH HERO ---
    const completedSteps = learningPaths.reduce((acc, lp) => {
      return acc + (lp.roadmap || []).filter(s => s.status === 'completed').length
    }, 0)
    if (completedSteps >= 5) {
      badges.push({
        id: 'path-walker',
        name: 'Path Walker',
        description: `Completed ${completedSteps} learning path steps`,
        icon: '🗺️',
        tier: completedSteps >= 15 ? 'gold' : 'silver',
        earnedAt: new Date()
      })
    }

    // --- 11. SPEED DEMON (submitted within first day of assignment creation) ---
    const speedSubs = submissions.filter(s => {
      if (!s.assignmentId?.createdAt) return false
      const diff = new Date(s.createdAt) - new Date(s.assignmentId.createdAt)
      return diff >= 0 && diff < 24 * 60 * 60 * 1000 // within 24 hours
    })
    if (speedSubs.length >= 1) {
      badges.push({
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Submitted within 24 hours of assignment creation',
        icon: '⚡',
        tier: 'silver',
        earnedAt: speedSubs[0].createdAt
      })
    }

    // --- 12. BRAVE HEART (scored <50% but kept submitting — at least 2 subs) ---
    const lowSubs = submissions.filter(s => {
      const total = s.assignmentId?.totalMarks
      return total && total > 0 && (s.finalScore / total) < 0.5
    })
    if (lowSubs.length >= 1 && submissions.length >= 2) {
      badges.push({
        id: 'brave-heart',
        name: 'Brave Heart',
        description: 'Kept going even when scores were tough 💪',
        icon: '🦁',
        tier: 'bronze',
        earnedAt: submissions[submissions.length - 1].createdAt
      })
    }

    // --- 13. MULTI-SUBJECT (submitted in 2+ different subjects) ---
    if (subjectSet.size >= 2) {
      badges.push({
        id: 'multi-subject',
        name: 'Well-Rounded',
        description: `Explored ${subjectSet.size} subjects so far`,
        icon: '📚',
        tier: 'bronze',
        earnedAt: submissions.find((s, i) => {
          const seen = new Set()
          for (let j = 0; j <= i; j++) {
            if (submissions[j].assignmentId?.subject) seen.add(submissions[j].assignmentId.subject)
          }
          return seen.size >= 2
        })?.createdAt || new Date()
      })
    }

    // --- 14. CONSISTENT (all submissions scored above 50%) ---
    if (submissions.length >= 3) {
      const allAbove50 = submissions.every(s => {
        const total = s.assignmentId?.totalMarks
        if (!total || total === 0) return true
        return (s.finalScore / total) >= 0.5
      })
      if (allAbove50) {
        badges.push({
          id: 'consistent',
          name: 'Steady Performer',
          description: 'Never dropped below 50% on any assignment!',
          icon: '📈',
          tier: 'silver',
          earnedAt: submissions[submissions.length - 1].createdAt
        })
      }
    }

    // Sort: platinum > gold > silver > bronze, then by date
    const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 }
    badges.sort((a, b) => (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0))

    res.send({
      message: "Badges computed",
      payload: {
        badges,
        stats: {
          totalBadges: badges.length,
          totalSubmissions: submissions.length,
          maxStreak,
          subjectsAttempted: subjectSet.size,
          perfectScores: perfectSubs.length,
          completedLearningSteps: completedSteps,
        }
      }
    })
  } catch (err) {
    console.error("Badge computation error:", err)
    res.status(500).send({ message: "Error computing badges", payload: err.message })
  }
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
      topic: assignment.topic || assignment.title,
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

// STUDENT → REGENERATE LEARNING PATH (re-calls ML for a topic)
studentApp.post("/regenerate-learning-path", async (req, res) => {
  try {
    const { studentId, subject, topic, scorePercentage } = req.body
    if (!studentId || !subject || !topic) {
      return res.status(400).send({ message: "Missing required fields" })
    }

    // Calculate score and totalMarks from percentage
    const score = scorePercentage || 0
    const totalMarks = 100

    const mlPayload = {
      subject,
      topic,
      score,
      total_marks: totalMarks
    }

    console.log("🔄 Regenerating learning path for:", mlPayload)

    const mlResponse = await axios.post('http://127.0.0.1:8000/predict-path', mlPayload)
    const mlResult = mlResponse.data

    const updated = await learningModel.findOneAndUpdate(
      { studentId, topic },
      {
        studentId,
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
    )

    console.log("✅ Learning path regenerated for topic:", topic)
    res.send({ message: "Learning path regenerated", payload: updated })
  } catch (err) {
    console.error("❌ Regeneration error:", err.message)
    res.status(500).send({ message: "Regeneration failed", payload: err.message })
  }
})

// STUDENT → TOGGLE ROADMAP STEP STATUS (mark as completed / undo)
studentApp.put("/learning-path/:pathId/toggle-step/:stepIndex", async (req, res) => {
  try {
    const { pathId, stepIndex } = req.params
    const idx = parseInt(stepIndex)

    const path = await learningModel.findById(pathId)
    if (!path) return res.status(404).send({ message: "Learning path not found" })
    if (!path.roadmap || idx < 0 || idx >= path.roadmap.length) {
      return res.status(400).send({ message: "Invalid step index" })
    }

    // Toggle: if completed → upcoming, else → completed
    const currentStatus = path.roadmap[idx].status
    path.roadmap[idx].status = currentStatus === "completed" ? "upcoming" : "completed"

    // Auto-set "current" on the first non-completed step
    let foundCurrent = false
    for (let i = 0; i < path.roadmap.length; i++) {
      if (path.roadmap[i].status !== "completed" && !foundCurrent) {
        path.roadmap[i].status = "current"
        foundCurrent = true
      } else if (path.roadmap[i].status === "current" && foundCurrent) {
        // Demote any extra "current" to "upcoming"
        path.roadmap[i].status = "upcoming"
      }
    }

    await path.save()
    console.log(`✅ Step ${idx + 1} toggled for path: ${path.topic}`)
    res.send({ message: "Step toggled", payload: path })
  } catch (err) {
    console.error("❌ Toggle step error:", err.message)
    res.status(500).send({ message: "Toggle failed", payload: err.message })
  }
})

// STUDENT → BULK REGENERATE ALL LEARNING PATHS FROM SUBMISSIONS
studentApp.post("/regenerate-all-learning-paths/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params
    if (!studentId) {
      return res.status(400).send({ message: "Missing studentId" })
    }

    // 1. Get all submissions for this student
    const submissions = await submissionModel.find({ studentId })
      .populate("assignmentId", "title topic subject totalMarks")
      .sort({ createdAt: -1 })

    if (!submissions || submissions.length === 0) {
      return res.status(404).send({ message: "No submissions found for this student" })
    }

    // 2. Group by assignment topic (actual topic field), keep the latest/best score per topic
    const topicMap = {}
    for (const sub of submissions) {
      const assignment = sub.assignmentId
      if (!assignment) continue
      const topic = assignment.topic || assignment.title
      const subject = assignment.subject
      const totalMarks = assignment.totalMarks || 1
      const score = sub.finalScore || 0

      // Keep the latest submission per topic
      if (!topicMap[topic]) {
        topicMap[topic] = { subject, topic, score, totalMarks }
      }
    }

    // 3. Call ML for each topic and upsert learning paths
    const results = []
    for (const key of Object.keys(topicMap)) {
      const { subject, topic, score, totalMarks } = topicMap[key]
      const mlPayload = { subject, topic, score, total_marks: totalMarks }

      try {
        const mlResponse = await axios.post('http://127.0.0.1:8000/predict-path', mlPayload)
        const mlResult = mlResponse.data

        const updated = await learningModel.findOneAndUpdate(
          { studentId, topic: mlResult.topic },
          {
            studentId,
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
        )
        results.push(updated)
        console.log(`✅ Learning path generated for: ${topic}`)
      } catch (mlErr) {
        console.error(`⚠️ ML failed for ${topic}:`, mlErr.message)
      }
    }

    // 4. Delete any old-schema learning paths that don't have a topic field
    await learningModel.deleteMany({ studentId, topic: { $exists: false } })
    await learningModel.deleteMany({ studentId, topic: null })
    await learningModel.deleteMany({ studentId, topic: "" })

    console.log(`✅ Bulk regeneration complete: ${results.length} paths generated`)
    res.send({ message: `${results.length} learning paths generated`, payload: results })
  } catch (err) {
    console.error("❌ Bulk regeneration error:", err.message)
    res.status(500).send({ message: "Bulk regeneration failed", payload: err.message })
  }
})

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