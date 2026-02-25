import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentSubmissions.css'

function StudentSubmissions() {
  const { users } = useContext(studentTeacherContextObj)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Safety check for user session
    let userId = users?._id;
    if (!userId) {
      const stored = localStorage.getItem("user");
      if (stored) userId = JSON.parse(stored)._id;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    // 2. Fetch Submissions
    // Ensure your backend route populates 'assignmentId' so we get the title!
    axios.get(`http://localhost:3000/student-api/my-submissions/${userId}`)
      .then(res => {
        setSubmissions(res.data.payload)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching submissions:", err)
        setLoading(false)
      })
  }, [users])

  // Helper to format date cleanly
  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="sub-container">
      <div className="sub-header">
        <h2>📊 My Submission History</h2>
        <p>Track your past test scores and performance.</p>
      </div>

      {loading && <div className="sub-loading">Loading records...</div>}

      {!loading && submissions.length === 0 && (
        <div className="sub-empty">
          <p>You haven't attempted any assignments yet.</p>
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div className="sub-table-wrapper">
          <table className="sub-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Date Attempted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                // Safety check: handle if assignment was deleted
                const title = sub.assignmentId?.title || "Unknown Assignment";
                const subject = sub.assignmentId?.subject || "N/A";
                const totalMarks = sub.assignmentId?.totalMarks || 0;
                
                return (
                  <tr key={sub._id}>
                    <td className="fw-bold text-dark">{title}</td>
                    <td>
                      <span className="sub-badge">{subject}</span>
                    </td>
                    <td>
                      <div className="score-display">
                        <span className="score-val">{sub.finalScore}</span>
                        {totalMarks > 0 && <span className="score-total"> / {totalMarks}</span>}
                      </div>
                    </td>
                    <td className="text-muted">{formatDate(sub.createdAt)}</td>
                    <td>
                      <span className="status-badge success">Completed</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StudentSubmissions