import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './StudentAssignments.css' // We will add CSS below

function StudentAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetches ALL assignments (ensure you added the /all-assignments route in backend previously)
    axios.get('http://localhost:3000/teacher-api/all-assignments')
      .then(res => {
        setAssignments(res.data.payload)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading assignments:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="sa-container">
      <div className="sa-header">
        <h2 className="sa-title">✍️ Available Assignments</h2>
        {/* No Create Button Here! */}
      </div>

      {loading && <p className="sa-loading">Loading tasks...</p>}

      {!loading && assignments.length === 0 && (
        <div className="sa-empty">
          <p>No assignments available right now.</p>
        </div>
      )}

      <div className="sa-grid">
        {assignments.map(assign => (
          <div key={assign._id} className="sa-card">
            <div className="sa-card-top">
              <span className="sa-badge">{assign.subject}</span>
              <span className="sa-date">
                 Due: {new Date(assign.deadline).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="sa-card-title">{assign.title}</h3>
            
            <div className="sa-meta">
              <span>❓ {assign.questions.length} Questions</span>
              <span>⭐ {assign.totalMarks} Marks</span>
            </div>

            {/* ACTION BUTTON: Points to the Attempt Route */}
            <button 
              className="sa-attempt-btn"
              onClick={() => navigate(`../submit/${assign._id}`)}
            >
              Start Quiz ➜
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentAssignments