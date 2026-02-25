import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './TeacherDashboard.css'

function TeacherDashboard() {
  const { users } = useContext(studentTeacherContextObj)
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    totalStudents: 0,
    pendingReview: 0,
    reviewed: 0,
  })
  const [recentAssignments, setRecentAssignments] = useState([])
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [typeDistribution, setTypeDistribution] = useState({})
  const [scoreDistribution, setScoreDistribution] = useState([0, 0, 0, 0, 0]) // 0-20, 21-40, 41-60, 61-80, 81-100
  const [loading, setLoading] = useState(true)

  const teacherName = users?.firstName || ''

  useEffect(() => {
    if (!teacherName) return
    fetchDashboardData()
  }, [teacherName])

  const fetchDashboardData = async () => {
    try {
      // Fetch assignments, students, and all submissions in parallel
      const [assignRes, studentRes] = await Promise.all([
        axios.get(`http://localhost:3000/teacher-api/assignments/${teacherName}`),
        axios.get('http://localhost:3000/teacher-api/students'),
      ])

      const assignments = assignRes.data.payload || []
      const students = studentRes.data.payload || []

      setRecentAssignments(assignments.slice(0, 5))

      // Fetch submissions for all assignments
      let allSubmissions = []
      let pendingCount = 0
      let reviewedCount = 0
      const typeCounts = {}
      const scoreBuckets = [0, 0, 0, 0, 0]

      const subPromises = assignments.map(a =>
        axios.get(`http://localhost:3000/teacher-api/view-submissions/${a._id}`).catch(() => ({ data: { payload: [] } }))
      )
      const subResults = await Promise.all(subPromises)

      subResults.forEach(res => {
        const subs = res.data.payload || []
        allSubmissions = allSubmissions.concat(subs)
      })

      // Process submissions
      allSubmissions.forEach(sub => {
        if (sub.evaluationStatus === 'pending-review') pendingCount++
        if (sub.evaluationStatus === 'reviewed' || sub.evaluationStatus === 'auto-complete') reviewedCount++
      })

      // Process assignments for type distribution
      assignments.forEach(a => {
        (a.questions || []).forEach(q => {
          const t = q.type || 'other'
          typeCounts[t] = (typeCounts[t] || 0) + 1
        })
      })

      // Score distribution based on percentage
      allSubmissions.forEach(sub => {
        const assignment = assignments.find(a => a._id === (sub.assignmentId?._id || sub.assignmentId))
        if (assignment && assignment.totalMarks > 0) {
          const pct = (sub.finalScore / assignment.totalMarks) * 100
          if (pct <= 20) scoreBuckets[0]++
          else if (pct <= 40) scoreBuckets[1]++
          else if (pct <= 60) scoreBuckets[2]++
          else if (pct <= 80) scoreBuckets[3]++
          else scoreBuckets[4]++
        }
      })

      // Sort recent submissions
      const sortedSubs = [...allSubmissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setRecentSubmissions(sortedSubs.slice(0, 6))

      setStats({
        totalAssignments: assignments.length,
        totalSubmissions: allSubmissions.length,
        totalStudents: students.length,
        pendingReview: pendingCount,
        reviewed: reviewedCount,
      })

      setTypeDistribution(typeCounts)
      setScoreDistribution(scoreBuckets)
      setLoading(false)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      setLoading(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }

  const typeLabels = {
    mcq: { label: 'MCQ', color: '#7b2cbf', bg: '#f3e8ff' },
    truefalse: { label: 'True/False', color: '#2563eb', bg: '#dbeafe' },
    fillblank: { label: 'Fill Blank', color: '#d97706', bg: '#fef3c7' },
    short: { label: 'Short', color: '#059669', bg: '#d1fae5' },
    essay: { label: 'Essay', color: '#dc2626', bg: '#fee2e2' },
  }

  const scoreLabels = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%']
  const scoreColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
  const maxScoreBucket = Math.max(...scoreDistribution, 1)

  const totalQuestions = Object.values(typeDistribution).reduce((a, b) => a + b, 0) || 1

  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="td-container">
      {/* GREETING */}
      <div className="td-greeting">
        <div>
          <h1 className="td-greeting-title">
            Welcome back, {users?.firstName || 'Teacher'} 👋
          </h1>
          <p className="td-greeting-sub">Here's an overview of your classroom activity.</p>
        </div>
        <div className="td-greeting-actions">
          <button className="td-action-btn primary" onClick={() => navigate('create-assignment')}>
            ✨ Create Assignment
          </button>
          <button className="td-action-btn secondary" onClick={() => navigate('assignments')}>
            📂 View All
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="td-stats-grid">
        <div className="td-stat-card" style={{ '--accent': '#7b2cbf' }}>
          <div className="td-stat-icon">📝</div>
          <div className="td-stat-info">
            <span className="td-stat-number">{stats.totalAssignments}</span>
            <span className="td-stat-label">Assignments</span>
          </div>
        </div>
        <div className="td-stat-card" style={{ '--accent': '#2563eb' }}>
          <div className="td-stat-icon">📤</div>
          <div className="td-stat-info">
            <span className="td-stat-number">{stats.totalSubmissions}</span>
            <span className="td-stat-label">Submissions</span>
          </div>
        </div>
        <div className="td-stat-card" style={{ '--accent': '#059669' }}>
          <div className="td-stat-icon">👩‍🎓</div>
          <div className="td-stat-info">
            <span className="td-stat-number">{stats.totalStudents}</span>
            <span className="td-stat-label">Students</span>
          </div>
        </div>
        <div className="td-stat-card" style={{ '--accent': '#d97706' }}>
          <div className="td-stat-icon">⏳</div>
          <div className="td-stat-info">
            <span className="td-stat-number">{stats.pendingReview}</span>
            <span className="td-stat-label">Pending Review</span>
          </div>
        </div>
        <div className="td-stat-card" style={{ '--accent': '#10b981' }}>
          <div className="td-stat-icon">✅</div>
          <div className="td-stat-info">
            <span className="td-stat-number">{stats.reviewed}</span>
            <span className="td-stat-label">Graded</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="td-charts-row">
        {/* Score Distribution Bar Chart */}
        <div className="td-chart-card">
          <h3 className="td-chart-title">📈 Score Distribution</h3>
          <p className="td-chart-subtitle">Student performance across all assignments</p>
          <div className="td-bar-chart">
            {scoreDistribution.map((count, i) => (
              <div key={i} className="td-bar-group">
                <div className="td-bar-wrapper">
                  <div
                    className="td-bar"
                    style={{
                      height: `${(count / maxScoreBucket) * 100}%`,
                      background: `linear-gradient(180deg, ${scoreColors[i]}, ${scoreColors[i]}88)`
                    }}
                  >
                    {count > 0 && <span className="td-bar-value">{count}</span>}
                  </div>
                </div>
                <span className="td-bar-label">{scoreLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question Type Distribution */}
        <div className="td-chart-card">
          <h3 className="td-chart-title">🧩 Question Types</h3>
          <p className="td-chart-subtitle">Breakdown of question types used</p>
          <div className="td-donut-chart">
            {Object.entries(typeDistribution).length > 0 ? (
              <>
                <div className="td-donut-ring">
                  <svg viewBox="0 0 120 120" className="td-donut-svg">
                    {(() => {
                      let cumulative = 0
                      const entries = Object.entries(typeDistribution)
                      return entries.map(([type, count], i) => {
                        const pct = (count / totalQuestions) * 100
                        const dashArray = `${pct * 3.14} ${314 - pct * 3.14}`
                        const dashOffset = -cumulative * 3.14
                        cumulative += pct
                        const color = typeLabels[type]?.color || '#999'
                        return (
                          <circle
                            key={type}
                            cx="60" cy="60" r="50"
                            fill="none"
                            stroke={color}
                            strokeWidth="18"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="td-donut-segment"
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className="td-donut-center">
                    <span className="td-donut-total">{totalQuestions}</span>
                    <span className="td-donut-label">Questions</span>
                  </div>
                </div>
                <div className="td-donut-legend">
                  {Object.entries(typeDistribution).map(([type, count]) => {
                    const info = typeLabels[type] || { label: type, color: '#999', bg: '#f3f4f6' }
                    return (
                      <div key={type} className="td-legend-item">
                        <span className="td-legend-dot" style={{ background: info.color }}></span>
                        <span className="td-legend-text">{info.label}</span>
                        <span className="td-legend-count" style={{ background: info.bg, color: info.color }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '30px 0' }}>No questions created yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="td-bottom-row">
        {/* Recent Assignments */}
        <div className="td-list-card">
          <div className="td-list-header">
            <h3 className="td-chart-title">📋 Recent Assignments</h3>
            <button className="td-see-all" onClick={() => navigate('assignments')}>See all →</button>
          </div>
          {recentAssignments.length === 0 ? (
            <p className="td-empty">No assignments yet. Create your first one!</p>
          ) : (
            <div className="td-assignment-list">
              {recentAssignments.map((a) => (
                <div key={a._id} className="td-assignment-row" onClick={() => navigate(`submissions/${a._id}`)}>
                  <div className="td-asg-left">
                    <div className="td-asg-icon-wrap">📝</div>
                    <div>
                      <p className="td-asg-title">{a.title}</p>
                      <p className="td-asg-meta">{a.subject} • {a.questions?.length || 0} questions • {a.totalMarks} marks</p>
                    </div>
                  </div>
                  <div className="td-asg-right">
                    <span className="td-asg-date">{formatDate(a.deadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="td-list-card">
          <div className="td-list-header">
            <h3 className="td-chart-title">🕐 Recent Submissions</h3>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="td-empty">No submissions received yet.</p>
          ) : (
            <div className="td-submission-list">
              {recentSubmissions.map((sub) => (
                <div key={sub._id} className="td-sub-row">
                  <div className="td-sub-avatar">
                    {sub.studentId?.firstName?.charAt(0) || 'S'}
                  </div>
                  <div className="td-sub-info">
                    <p className="td-sub-name">{sub.studentId?.firstName} {sub.studentId?.lastName}</p>
                    <p className="td-sub-meta">{formatDate(sub.createdAt)}</p>
                  </div>
                  <div className="td-sub-score-wrap">
                    <span className="td-sub-score">{sub.finalScore}</span>
                    <span className={`td-sub-status ${sub.evaluationStatus === 'pending-review' ? 'pending' : 'done'}`}>
                      {sub.evaluationStatus === 'pending-review' ? '⏳' : '✅'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
