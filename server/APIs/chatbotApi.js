const exp = require("express")
const chatbotApp = exp.Router()
chatbotApp.use(exp.json())

const { GoogleGenerativeAI } = require("@google/generative-ai")

const learningModel = require("../Models/LearningPath")
const submissionModel = require("../Models/submission")
const assignmentModel = require("../Models/Assignment")

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Store conversation history per student (in-memory, resets on server restart)
const conversationStore = {}

// POST /chatbot-api/chat
chatbotApp.post("/chat", async (req, res) => {
  try {
    const { studentId, message, language } = req.body

    if (!message || !studentId) {
      return res.status(400).send({ message: "Missing studentId or message" })
    }

    // 1. Gather student context from DB
    let contextStr = ""
    try {
      const [paths, submissions] = await Promise.all([
        learningModel.find({ studentId }).lean(),
        submissionModel.find({ studentId })
          .populate("assignmentId", "title topic subject totalMarks")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      ])

      if (paths.length > 0) {
        const pathSummary = paths.map(p =>
          `- Topic: "${p.topic}" (${p.subject}) | Score: ${p.scorePercentage}% | Level: ${p.difficultyLevel} | Roadmap progress: ${p.roadmap ? p.roadmap.filter(r => r.status === 'completed').length : 0}/${p.roadmap ? p.roadmap.length : 0} steps done`
        ).join("\n")
        contextStr += `\n\nStudent's Learning Paths:\n${pathSummary}`
      }

      if (submissions.length > 0) {
        const subSummary = submissions.map(s => {
          const a = s.assignmentId
          return a
            ? `- "${a.title}" (${a.topic || a.subject}) | Score: ${s.finalScore}/${a.totalMarks} | Status: ${s.evaluationStatus}`
            : null
        }).filter(Boolean).join("\n")
        contextStr += `\n\nRecent Submissions:\n${subSummary}`
      }
    } catch (dbErr) {
      console.error("Chatbot DB context error:", dbErr.message)
    }

    // 2. Build system prompt
    const systemPrompt = `You are EduAI Assistant, a friendly and helpful multilingual education chatbot for the EduAI learning platform.

RULES:
- If the student writes in a non-English language (Hindi, Telugu, Tamil, Spanish, etc.), you MUST reply in that SAME language.
- If they write in English, reply in English.
- Keep answers concise (2-4 sentences for simple questions, more for explanations).
- Use emojis to make responses friendly and engaging.
- You help with: explaining concepts, study tips, assignment doubts, learning path guidance, motivation.
- You have access to the student's learning data below. Use it to give personalized advice.
- Never make up scores or data. Only reference what's in the context.
- If asked about something outside academics, politely redirect to studies.
- Format responses nicely with bullet points or numbered lists when appropriate.

STUDENT CONTEXT:${contextStr || "\nNo learning data available yet. The student hasn't submitted any assignments."}

The student's preferred language hint: ${language || "auto-detect from their message"}`

    // 3. Get or create conversation history
    if (!conversationStore[studentId]) {
      conversationStore[studentId] = []
    }
    const history = conversationStore[studentId]

    // Keep last 20 messages to avoid token overflow
    if (history.length > 20) {
      conversationStore[studentId] = history.slice(-20)
    }

    // 4. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      systemInstruction: systemPrompt,
    })

    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    // 5. Save to conversation history
    history.push({ role: "user", text: message })
    history.push({ role: "model", text: reply })
    conversationStore[studentId] = history

    res.send({
      message: "OK",
      payload: {
        reply,
        language: language || "auto"
      }
    })

  } catch (err) {
    console.error("Chatbot error:", err.message)
    res.status(500).send({
      message: "Chatbot error",
      payload: err.message
    })
  }
})

// POST /chatbot-api/clear - Clear conversation history
chatbotApp.post("/clear", (req, res) => {
  const { studentId } = req.body
  if (studentId && conversationStore[studentId]) {
    delete conversationStore[studentId]
  }
  res.send({ message: "Conversation cleared" })
})

module.exports = chatbotApp
