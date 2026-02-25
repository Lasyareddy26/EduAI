import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './AssignmentSubmissions.css'

function AssignmentSubmissions() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ average: 0, highest: 0 })

  useEffect(() => {
    // Fetch submissions for this specific assignment
    axios.get(`http://localhost:3000/teacher-api/view-submissions/${assignmentId}`)
      .then(res => {
        const data = res.data.payload;
        setSubmissions(data)
        calculateStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching submissions:", err)
        setLoading(false)
      })
  }, [assignmentId])

  // Helper to calculate class performance
  const calculateStats = (data) => {
    if (data.length === 0) return;
    
    // Assuming submission has a 'score' or 'marks' field. 
    // If your schema uses a different name, update 's.score' below.
    const totalScore = data.reduce((acc, s) => acc + (s.score || 0), 0)
    const maxScore = Math.max(...data.map(s => s.score || 0))
    
    setStats({
      average: (totalScore / data.length).toFixed(1),
      highest: maxScore
    })
  }

  // Helper to format date
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="as-container">
      {/* HEADER SECTION */}
      <div className="as-header">
        <button className="as-back-btn" onClick={() => navigate(-1)}>
          ← Back to Assignments
        </button>
        <h2 className="as-title">Student Submissions</h2>
      </div>

      {/* STATS CARDS */}
      <div className="as-stats-row">
        <div className="as-stat-card">
          <span className="as-stat-label">Total Submissions</span>
          <span className="as-stat-value">{submissions.length}</span>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Class Average</span>
          <span className="as-stat-value">{stats.average}</span>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Highest Score</span>
          <span className="as-stat-value text-green">{stats.highest}</span>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div className="as-table-wrapper">
        {loading ? (
          <p className="as-loading">Loading submission data...</p>
        ) : submissions.length === 0 ? (
          <div className="as-empty">
            <p>No students have submitted this assignment yet.</p>
          </div>
        ) : (
          <table className="as-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email ID</th>
                <th>Date Submitted</th>
                <th className="text-right">Score Received</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id}>
                  <td>
                    <div className="as-student-info">
                      <div className="as-avatar">
                        {sub.studentId?.firstName?.charAt(0) || "S"}
                      </div>
                      <span className="as-name">
                        {sub.studentId?.firstName} {sub.studentId?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="as-email">{sub.studentId?.email}</td>
                  <td className="as-date">{formatDate(sub.createdAt)}</td>
                  <td className="as-score text-right">
                    <span className="as-score-badge">
                      {sub.score !== undefined ? sub.score : "N/A"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button className="as-view-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AssignmentSubmissions