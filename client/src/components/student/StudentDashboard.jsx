import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentDashboard.css'

function StudentDashboard() {
  const { users } = useContext(studentTeacherContextObj)
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalAssignments: 0,
    mySubmissions: 0,
    graded: 0,
    pendingReview: 0,
    avgPercent: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [upcomingAssignments, setUpcomingAssignments] = useState([])
  const [subjectScores, setSubjectScores] = useState({})
  const [performanceBuckets, setPerformanceBuckets] = useState([0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)

  const userId = users?._id || (() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored)._id : null
  })()

  useEffect(() => {
    if (!userId) return
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        axios.get('http://localhost:3000/student-api/assignments'),
        axios.get(`http://localhost:3000/student-api/my-submissions/${userId}`),
      ])

      const assignments = assignRes.data.payload || []
      const submissions = subRes.data.payload || []

      // Upcoming assignments (deadline in the future)
      const now = new Date()
      const upcoming = assignments
        .filter(a => a.deadline && new Date(a.deadline) > now)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5)
      setUpcomingAssignments(upcoming)

      // Recent submissions
      const sorted = [...submissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setRecentSubmissions(sorted.slice(0, 6))

      // Process stats
      let gradedCount = 0
      let pendingCount = 0
      let totalPct = 0
      let pctCount = 0
      const buckets = [0, 0, 0, 0, 0]
      const subjectMap = {}

      submissions.forEach(sub => {
        if (sub.evaluationStatus === 'pending-review') pendingCount++
        if (sub.evaluationStatus === 'reviewed' || sub.evaluationStatus === 'auto-complete') gradedCount++

        const totalMarks = sub.assignmentId?.totalMarks || 0
        const subject = sub.assignmentId?.subject || 'Other'

        if (totalMarks > 0) {
          const pct = (sub.finalScore / totalMarks) * 100
          totalPct += pct
          pctCount++

          // Buckets
          if (pct <= 20) buckets[0]++
          else if (pct <= 40) buckets[1]++
          else if (pct <= 60) buckets[2]++
          else if (pct <= 80) buckets[3]++
          else buckets[4]++

          // Subject-wise aggregation
          if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 }
          subjectMap[subject].total += pct
          subjectMap[subject].count++
        }
      })

      // Average per subject
      const subjectAvg = {}
      Object.entries(subjectMap).forEach(([subj, data]) => {
        subjectAvg[subj] = Math.round(data.total / data.count)
      })

      setStats({
        totalAssignments: assignments.length,
        mySubmissions: submissions.length,
        graded: gradedCount,
        pendingReview: pendingCount,
        avgPercent: pctCount > 0 ? Math.round(totalPct / pctCount) : 0,
      })

      setSubjectScores(subjectAvg)
      setPerformanceBuckets(buckets)
      setLoading(false)
    } catch (err) {
      console.error("Student dashboard fetch error:", err)
      setLoading(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const daysUntil = (iso) => {
    if (!iso) return ''
    const diff = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Due today'
    if (diff === 1) return '1 day left'
    return `${diff} days left`
  }

  const scoreLabels = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%']
  const scoreColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
  const maxBucket = Math.max(...performanceBuckets, 1)

  const subjectColors = ['#7b2cbf', '#2563eb', '#059669', '#d97706', '#dc2626', '#ec4899', '#6366f1', '#14b8a6']

  // Performance ring (avg percent)
  const avgDash = (stats.avgPercent / 100) * 283
  const avgColor = stats.avgPercent >= 80 ? '#10b981' : stats.avgPercent >= 60 ? '#22c55e' : stats.avgPercent >= 40 ? '#eab308' : stats.avgPercent >= 20 ? '#f97316' : '#ef4444'

  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="sd-container">
      {/* GREETING */}
      <div className="sd-greeting">
        <div>
          <h1 className="sd-greeting-title">
            Hey, {users?.firstName || 'Student'} 🎓
          </h1>
          <p className="sd-greeting-sub">Here's a snapshot of your academic journey.</p>
        </div>
        <div className="sd-greeting-actions">
          <button className="sd-action-btn primary" onClick={() => navigate('available-assignments')}>
            ✍️ Take a Quiz
          </button>
          <button className="sd-action-btn secondary" onClick={() => navigate('my-submissions')}>
            📊 My Results
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="sd-stats-grid">
        <div className="sd-stat-card" style={{ '--accent': '#7b2cbf' }}>
          <div className="sd-stat-icon">📚</div>
          <div className="sd-stat-info">
            <span className="sd-stat-number">{stats.totalAssignments}</span>
            <span className="sd-stat-label">Available</span>
          </div>
        </div>
        <div className="sd-stat-card" style={{ '--accent': '#2563eb' }}>
          <div className="sd-stat-icon">📝</div>
          <div className="sd-stat-info">
            <span className="sd-stat-number">{stats.mySubmissions}</span>
            <span className="sd-stat-label">Submitted</span>
          </div>
        </div>
        <div className="sd-stat-card" style={{ '--accent': '#10b981' }}>
          <div className="sd-stat-icon">✅</div>
          <div className="sd-stat-info">
            <span className="sd-stat-number">{stats.graded}</span>
            <span className="sd-stat-label">Graded</span>
          </div>
        </div>
        <div className="sd-stat-card" style={{ '--accent': '#d97706' }}>
          <div className="sd-stat-icon">⏳</div>
          <div className="sd-stat-info">
            <span className="sd-stat-number">{stats.pendingReview}</span>
            <span className="sd-stat-label">Pending</span>
          </div>
        </div>
        <div className="sd-stat-card" style={{ '--accent': avgColor }}>
          <div className="sd-stat-icon">🎯</div>
          <div className="sd-stat-info">
            <span className="sd-stat-number">{stats.avgPercent}%</span>
            <span className="sd-stat-label">Avg. Score</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="sd-charts-row">
        {/* Performance Bar Chart */}
        <div className="sd-chart-card">
          <h3 className="sd-chart-title">📈 My Performance</h3>
          <p className="sd-chart-subtitle">Score distribution across all your attempts</p>
          <div className="sd-bar-chart">
            {performanceBuckets.map((count, i) => (
              <div key={i} className="sd-bar-group">
                <div className="sd-bar-wrapper">
                  <div
                    className="sd-bar"
                    style={{
                      height: `${(count / maxBucket) * 100}%`,
                      background: `linear-gradient(180deg, ${scoreColors[i]}, ${scoreColors[i]}88)`
                    }}
                  >
                    {count > 0 && <span className="sd-bar-value">{count}</span>}
                  </div>
                </div>
                <span className="sd-bar-label">{scoreLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="sd-chart-card">
          <h3 className="sd-chart-title">🧩 Subject Scores</h3>
          <p className="sd-chart-subtitle">Average percentage per subject</p>
          <div className="sd-subject-chart">
            {Object.entries(subjectScores).length > 0 ? (
              <>
                {/* Performance Ring */}
                <div className="sd-perf-ring">
                  <svg viewBox="0 0 100 100" className="sd-ring-svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke={avgColor}
                      strokeWidth="8"
                      strokeDasharray={`${avgDash} ${283 - avgDash}`}
                      strokeDashoffset="70.75"
                      strokeLinecap="round"
                      className="sd-ring-progress"
                    />
                  </svg>
                  <div className="sd-ring-center">
                    <span className="sd-ring-value">{stats.avgPercent}%</span>
                    <span className="sd-ring-label">Overall</span>
                  </div>
                </div>
                {/* Subject Legend */}
                <div className="sd-subject-legend">
                  {Object.entries(subjectScores).map(([subj, avg], i) => (
                    <div key={subj} className="sd-subject-item">
                      <span className="sd-subject-dot" style={{ background: subjectColors[i % subjectColors.length] }}></span>
                      <span className="sd-subject-name">{subj}</span>
                      <div className="sd-subject-bar-track">
                        <div
                          className="sd-subject-bar-fill"
                          style={{
                            width: `${avg}%`,
                            background: subjectColors[i % subjectColors.length]
                          }}
                        ></div>
                      </div>
                      <span className="sd-subject-pct" style={{ color: subjectColors[i % subjectColors.length] }}>{avg}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="sd-empty-msg">No submissions yet to analyze.</p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="sd-bottom-row">
        {/* Upcoming Assignments */}
        <div className="sd-list-card">
          <div className="sd-list-header">
            <h3 className="sd-chart-title">⏰ Upcoming Deadlines</h3>
            <button className="sd-see-all" onClick={() => navigate('available-assignments')}>See all →</button>
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="sd-empty">No upcoming deadlines. You're all caught up! 🎉</p>
          ) : (
            <div className="sd-upcoming-list">
              {upcomingAssignments.map((a) => {
                const urgency = (() => {
                  const d = Math.ceil((new Date(a.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                  if (d <= 1) return 'urgent'
                  if (d <= 3) return 'soon'
                  return 'normal'
                })()
                return (
                  <div key={a._id} className={`sd-upcoming-row ${urgency}`} onClick={() => navigate(`../submit/${a._id}`)}>
                    <div className="sd-upcoming-left">
                      <div className="sd-upcoming-icon">📋</div>
                      <div>
                        <p className="sd-upcoming-title">{a.title}</p>
                        <p className="sd-upcoming-meta">{a.subject} • {a.questions?.length || 0} Q • {a.totalMarks} marks</p>
                      </div>
                    </div>
                    <div className="sd-upcoming-right">
                      <span className={`sd-deadline-badge ${urgency}`}>{daysUntil(a.deadline)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="sd-list-card">
          <div className="sd-list-header">
            <h3 className="sd-chart-title">🕐 Recent Results</h3>
            <button className="sd-see-all" onClick={() => navigate('my-submissions')}>See all →</button>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="sd-empty">No results yet. Attempt your first quiz!</p>
          ) : (
            <div className="sd-results-list">
              {recentSubmissions.map((sub) => {
                const totalMarks = sub.assignmentId?.totalMarks || 0
                const pct = totalMarks > 0 ? Math.round((sub.finalScore / totalMarks) * 100) : 0
                const grade = pct >= 80 ? 'excellent' : pct >= 60 ? 'good' : pct >= 40 ? 'average' : 'low'
                return (
                  <div key={sub._id} className={`sd-result-row ${grade}`}>
                    <div className="sd-result-left">
                      <div className={`sd-result-badge ${grade}`}>
                        {pct >= 80 ? '🌟' : pct >= 60 ? '👍' : pct >= 40 ? '📝' : '💪'}
                      </div>
                      <div>
                        <p className="sd-result-title">{sub.assignmentId?.title || 'Assignment'}</p>
                        <p className="sd-result-meta">{sub.assignmentId?.subject || ''} • {formatDate(sub.createdAt)}</p>
                      </div>
                    </div>
                    <div className="sd-result-right">
                      <span className="sd-result-score">{sub.finalScore}/{totalMarks}</span>
                      <span className={`sd-result-pct ${grade}`}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
