import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './ViewAssignments.css'

function ViewAssignments() {
  const { users } = useContext(studentTeacherContextObj)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!users || !users.firstName) {
      setLoading(false)
      setError("Teacher profile not loaded. Please re-login.")
      return
    }

    const teacherName = users.firstName;
    
    axios.get(`http://localhost:3000/teacher-api/assignments/${teacherName}`)
      .then(res => {
        setAssignments(res.data.payload)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching assignments:", err)
        setError("Failed to load assignments.")
        setLoading(false)
      })
  }, [users])

  return (
    <div className="va-page-container">
      <div className="va-header-section">
        <h2 className="va-page-title">📚 Assignment Repository</h2>
        <button className="va-btn-create" onClick={() => navigate('../create-assignment')}>
          + Create New
        </button>
      </div>

      {error && <div className="va-error-msg">{error}</div>}

      {loading && !error && <p className="va-loading-msg">Loading your assignments...</p>}

      {!loading && !error && assignments.length === 0 && (
        <div className="va-empty-state">
          <p>You haven't posted any assignments yet.</p>
        </div>
      )}

      <div className="va-grid-layout">
        {assignments.map(assign => (
          <AssignmentCard key={assign._id} assignment={assign} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

function AssignmentCard({ assignment, navigate }) {
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState({ count: null, loading: false })

  const toggleExpand = () => {
    if (!expanded && stats.count === null) {
      setStats({ ...stats, loading: true })
      axios.get(`http://localhost:3000/teacher-api/submission-count/${assignment._id}`)
        .then(res => {
          setStats({ count: res.data.payload.count, loading: false })
        })
        .catch(err => setStats({ count: 0, loading: false }))
    }
    setExpanded(!expanded)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No Deadline";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    })
  }

  return (
    <div className={`va-card ${expanded ? 'va-card-expanded' : ''}`}>
      {/* HEADER */}
      <div className="va-card-header">
        <span className="va-badge-subject">{assignment.subject}</span>
        <span className="va-text-deadline">Due: {formatDate(assignment.deadline)}</span>
      </div>

      {/* BODY */}
      <div className="va-card-body">
        <h3 className="va-text-title">{assignment.title}</h3>
        <p className="va-text-topic">Topic: {assignment.topic}</p>
        
        <div className="va-meta-tags">
          <span className="va-tag">❓ {assignment.questions.length} Qs</span>
          <span className="va-tag">⭐ {assignment.totalMarks} Marks</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="va-card-footer">
        <button className="va-btn-expand" onClick={toggleExpand}>
          {expanded ? 'Hide Stats ▲' : 'View Stats ▼'}
        </button>
        <button 
          className="va-btn-submissions" 
          onClick={() => navigate(`../submissions/${assignment._id}`)}
        >
          Submissions ➜
        </button>
      </div>

      {/* EXPANDED STATS */}
      {expanded && (
        <div className="va-stats-panel">
          <div className="va-stats-row">
            <div className="va-stat-item">
              <span className="va-stat-label">Submitted</span>
              <span className="va-stat-value">
                {stats.loading ? '...' : stats.count}
              </span>
            </div>
            <div className="va-stat-item">
               <span className="va-stat-label">Avg. Score</span>
               <span className="va-stat-value">-</span>
            </div>
          </div>
          
          <div className="va-preview-section">
            <h4>Preview:</h4>
            <ul>
              {assignment.questions.slice(0, 2).map((q, i) => (
                <li key={i}>{i+1}. {q.questionText}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewAssignments