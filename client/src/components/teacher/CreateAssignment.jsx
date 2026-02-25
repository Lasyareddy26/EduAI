import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './CreateAssignment.css'

function CreateAssignment() {
  const navigate = useNavigate()
  const { users } = useContext(studentTeacherContextObj)

 
  const [isGenerating, setIsGenerating] = useState(false)

  // RAG states
  const [pdfFile, setPdfFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [ragSessionId, setRagSessionId] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [ragQuestionType, setRagQuestionType] = useState('Multiple Choice')
  const [ragCount, setRagCount] = useState(5)

  const [basicInfo, setBasicInfo] = useState({
    title: '',
    subject: '',
    topic: '',
    deadline: '',
    NameOfTeacher: users?.firstName || '' 
  })

  const [questions, setQuestions] = useState([
    { questionText: '', type: 'short', marks: 0, options: [''], correctAnswer: '' }
  ])

  const totalMarks = questions.reduce((acc, q) => acc + Number(q.marks || 0), 0)

  // --- PDF UPLOAD HANDLER ---
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file')
      return
    }
    setPdfFile(file)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post('http://localhost:3000/teacher-api/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setRagSessionId(res.data.session_id)
      setUploadedFileName(res.data.filename)
      alert(`✅ PDF "${res.data.filename}" uploaded and processed!`)
    } catch (err) {
      console.error(err)
      alert('Failed to upload PDF. Make sure the RAG service is running.')
      setPdfFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  // --- RAG AI GENERATION HANDLER ---
  const handleAIGenerate = async () => {
    if (!ragSessionId) {
      alert("Please upload a PDF first!")
      return
    }
    if (!basicInfo.topic) {
      alert("Please enter a Topic first!")
      return
    }

    setIsGenerating(true)
    try {
      const res = await axios.post('http://localhost:3000/teacher-api/rag-generate-questions', {
        session_id: ragSessionId,
        topic: basicInfo.topic,
        count: ragCount,
        question_type: ragQuestionType
      })

      const generated = res.data.payload
      if (Array.isArray(generated)) {
        setQuestions([...questions, ...generated])
      } else {
        alert("AI returned text instead of structured questions. Check the console.")
        console.log("RAG response:", generated)
      }

    } catch (err) {
      console.error(err)
      alert("Failed to generate questions. Try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // ... (Keep all existing handlers: handleInfoChange, addQuestion, handleSubmit, etc.) ...
  const handleInfoChange = (e) => {
    setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value })
  }

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions]
    newQuestions[index][field] = value
    setQuestions(newQuestions)
  }

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', type: 'short', marks: 0, options: [''], correctAnswer: '' }])
  }

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    setQuestions(newQuestions)
  }

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options[oIndex] = value
    setQuestions(newQuestions)
  }

  const addOption = (qIndex) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options.push('')
    setQuestions(newQuestions)
  }

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex)
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      teacherdata: {
        NameOfTeacher: basicInfo.NameOfTeacher,
        subject: basicInfo.subject
      },
      title: basicInfo.title,
      subject: basicInfo.subject,
      topic: basicInfo.topic,
      totalMarks: totalMarks,
      deadline: basicInfo.deadline,
      questions: questions.map(q => {
        if (q.type !== 'mcq') {
          const { options, correctAnswer, ...rest } = q
          return rest
        }
        return q
      })
    }

    try {
      const res = await axios.post('http://localhost:3000/teacher-api/create-assignment', payload)
      if (res.status === 201) {
        alert('Assignment Created Successfully!')
        navigate('../assignments') 
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create assignment')
    }
  }

  return (
    <div className="create-assignment-container">
      <div className="form-header">
        <h2>📝 Create New Assignment</h2>
        <p>Design a task manually or let AI generate it for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="assignment-form">
        
        {/* SECTION 1: BASIC DETAILS */}
        <div className="form-section">
          <h3>Basic Details</h3>
          <div className="input-grid">
            <div className="input-group">
              <label>Assignment Title</label>
              <input type="text" name="title" required placeholder="e.g. Algebra Quiz 1" value={basicInfo.title} onChange={handleInfoChange} />
            </div>
            <div className="input-group">
              <label>Subject</label>
              <input type="text" name="subject" required placeholder="e.g. Mathematics" value={basicInfo.subject} onChange={handleInfoChange} />
            </div>
            <div className="input-group">
              <label>Topic</label>
              <input type="text" name="topic" required placeholder="e.g. Calculus" value={basicInfo.topic} onChange={handleInfoChange} />
            </div>
            <div className="input-group">
              <label>Deadline</label>
              <input type="date" name="deadline" required value={basicInfo.deadline} onChange={handleInfoChange} />
            </div>
             <div className="input-group">
              <label>Teacher Name</label>
              <input type="text" name="NameOfTeacher" required value={basicInfo.NameOfTeacher} onChange={handleInfoChange} />
            </div>
          </div>
        </div>

        {/* SECTION 2: RAG - PDF UPLOAD & AI CONFIG */}
        <div className="form-section">
          <h3>📄 AI Question Generator (RAG)</h3>
          <p style={{color:'#666', marginBottom:'15px', marginTop:'-10px'}}>Upload a PDF, select options, then generate questions from it.</p>

          <div className="input-grid">
            <div className="input-group">
              <label>Upload PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                disabled={isUploading}
                style={{padding:'10px', border:'1px dashed #9d4edd', borderRadius:'8px', background:'#f8f5fc', cursor:'pointer'}}
              />
              {isUploading && <span style={{color:'#7b2cbf', fontSize:'0.85rem'}}>⏳ Processing PDF...</span>}
              {uploadedFileName && !isUploading && <span style={{color:'#2d8a4e', fontSize:'0.85rem'}}>✅ {uploadedFileName} ready</span>}
            </div>

            <div className="input-group">
              <label>Question Type</label>
              <select value={ragQuestionType} onChange={(e) => setRagQuestionType(e.target.value)}>
                <option value="Multiple Choice">Multiple Choice (MCQ)</option>
                <option value="Short Answer">Short Answer</option>
                <option value="True/False">True / False</option>
                <option value="Essay">Essay</option>
                <option value="Fill in the Blanks">Fill in the Blanks</option>
              </select>
            </div>

            <div className="input-group">
              <label>Number of Questions</label>
              <input type="number" min="1" max="20" value={ragCount} onChange={(e) => setRagCount(e.target.value)} />
            </div>
          </div>
        </div>

        {/* SECTION 3: QUESTIONS BUILDER */}
        <div className="form-section">
          <div className="section-header">
             <h3>Questions</h3>
             
             {/* ✨ AI GENERATE BUTTON ✨ */}
             <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <button 
                  type="button" 
                  className={`ai-btn ${isGenerating ? 'pulsing' : ''}`} 
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !ragSessionId}
                  title={!ragSessionId ? 'Upload a PDF first' : ''}
                >
                  {isGenerating ? 'Generating...' : '✨ Generate from PDF'}
                </button>
                <span className="total-badge">Total Marks: {totalMarks}</span>
             </div>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <span className="q-number">Q{qIndex + 1}</span>
                <button type="button" className="remove-btn" onClick={() => removeQuestion(qIndex)}>×</button>
              </div>

              <div className="question-row">
                <div className="input-group flex-grow">
                  <label>Question Text</label>
                  <input type="text" required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} />
                </div>
                <div className="input-group small-width">
                  <label>Type</label>
                  <select value={q.type} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}>
                    <option value="short">Short Answer</option>
                    <option value="essay">Essay</option>
                    <option value="mcq">Multiple Choice</option>
                  </select>
                </div>
                <div className="input-group small-width">
                  <label>Marks</label>
                  <input type="number" min="1" required value={q.marks} onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)} />
                </div>
              </div>

              {q.type === 'mcq' && (
                <div className="mcq-section">
                  <label>Options:</label>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="option-row">
                      <div className={`radio-circle ${q.correctAnswer === opt && opt !== '' ? 'selected' : ''}`}></div>
                      <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} required />
                      {q.options.length > 2 && <button type="button" className="text-danger" onClick={() => removeOption(qIndex, oIndex)}>Remove</button>}
                    </div>
                  ))}
                  <button type="button" className="add-opt-btn" onClick={() => addOption(qIndex)}>+ Add Option</button>
                  <div className="input-group mt-2">
                    <label>Correct Answer</label>
                    <input type="text" value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} required />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" className="add-question-btn" onClick={addQuestion}>+ Add New Question Manualy</button>
        </div>

        <div className="form-actions">
           <button type="button" className="cancel-btn" onClick={() => navigate('../assignments')}>Cancel</button>
           <button type="submit" className="submit-btn">🚀 Publish Assignment</button>
        </div>
      </form>
    </div>
  )
}

export default CreateAssignment