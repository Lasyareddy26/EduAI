import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './StudentAnalytics.css'

function StudentAnalytics() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [paths, setPaths] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    fetchData()
  }, [studentId])

  const fetchData = async () => {
    try {
      const [pathRes, studentsRes] = await Promise.all([
        axios.get(`http://localhost:3000/teacher-api/ai-suggestion/${studentId}`),
        axios.get('http://localhost:3000/teacher-api/students'),
      ])

      let allPaths = pathRes.data?.payload
      if (!Array.isArray(allPaths)) {
        allPaths = allPaths ? [allPaths] : []
      }
      setPaths(allPaths)
      if (allPaths.length > 0) setSelectedTopic(allPaths[0].topic)

      // Find the student info
      const students = studentsRes.data?.payload || []
      const found = students.find(s => s._id === studentId)
      setStudent(found || null)

      setLoading(false)
    } catch (err) {
      console.error("Error:", err)
      setPaths([])
      setLoading(false)
    }
  }

  const activePath = Array.isArray(paths) ? paths.find(p => p.topic === selectedTopic) : null

  const getLevelInfo = (level) => {
    switch (level) {
      case 'beginner': return { color: '#10b981', bg: '#d1fae5', icon: '🌱', label: 'Beginner' }
      case 'intermediate': return { color: '#2563eb', bg: '#dbeafe', icon: '📈', label: 'Intermediate' }
      case 'advanced': return { color: '#7b2cbf', bg: '#f3e8ff', icon: '🚀', label: 'Advanced' }
      default: return { color: '#6b7280', bg: '#f3f4f6', icon: '📊', label: level }
    }
  }

  const getStepIcon = (status) => {
    if (status === 'completed') return '✅'
    if (status === 'current') return '🔵'
    return '⚪'
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎬'
      case 'article': return '📖'
      case 'quiz': return '📝'
      case 'practice': return '🧪'
      case 'project': return '🏗️'
      default: return '📚'
    }
  }

  if (loading) {
    return (
      <div className="sa-loading-wrap">
        <div className="sa-loading-spinner"></div>
        <p>Loading student analytics...</p>
      </div>
    )
  }

  return (
    <div className="sa-container">
      {/* Back Button + Header */}
      <div className="sa-top-bar">
        <button className="sa-back-btn" onClick={() => navigate('../student-directory')}>← Back to Students</button>
      </div>

      {/* Student Info Card */}
      <div className="sa-student-card">
        <img
          src={student?.profileImageUrl || "https://via.placeholder.com/60"}
          alt="avatar"
          className="sa-student-avatar"
        />
        <div className="sa-student-info">
          <h2 className="sa-student-name">{student?.firstName} {student?.lastName}</h2>
          <p className="sa-student-email">{student?.email}</p>
        </div>
        <div className="sa-student-stats">
          <div className="sa-mini-stat">
            <span className="sa-mini-num">{paths.length}</span>
            <span className="sa-mini-label">Topics</span>
          </div>
          <div className="sa-mini-stat">
            <span className="sa-mini-num">
              {paths.length > 0 ? Math.round(paths.reduce((s, p) => s + (p.scorePercentage || 0), 0) / paths.length) : 0}%
            </span>
            <span className="sa-mini-label">Avg Score</span>
          </div>
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="sa-empty">
          <p>📊 No learning path data yet. This student hasn't submitted any assignments.</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="sa-overview-grid">
            {paths.map(p => {
              const info = getLevelInfo(p.difficultyLevel)
              return (
                <div
                  key={p._id}
                  className={`sa-overview-card ${selectedTopic === p.topic ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(p.topic)}
                  style={selectedTopic === p.topic ? { borderColor: info.color } : {}}
                >
                  <div className="sa-ov-header">
                    <span className="sa-ov-subject">{p.subject}</span>
                    <span className="sa-ov-badge" style={{ background: info.bg, color: info.color }}>
                      {info.icon} {info.label}
                    </span>
                  </div>
                  <h4 className="sa-ov-topic">{p.topic}</h4>
                  <div className="sa-ov-score-bar">
                    <div className="sa-ov-bar-track">
                      <div className="sa-ov-bar-fill" style={{ width: `${p.scorePercentage || 0}%`, background: info.color }}></div>
                    </div>
                    <span className="sa-ov-pct" style={{ color: info.color }}>{Math.round(p.scorePercentage || 0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed View for Selected Topic */}
          {activePath && (() => {
            const levelInfo = getLevelInfo(activePath.difficultyLevel)
            return (
              <div className="sa-detail-section">
                <h3 className="sa-detail-title">
                  🗺️ Roadmap for <span style={{ color: levelInfo.color }}>{activePath.topic}</span>
                </h3>

                {activePath.tip && (
                  <div className="sa-tip">{activePath.tip}</div>
                )}

                {/* Roadmap Timeline */}
                <div className="sa-roadmap">
                  {(activePath.roadmap || []).map((node, i) => (
                    <div key={i} className={`sa-rm-node ${node.status}`}>
                      <div className="sa-rm-line">
                        <div className={`sa-rm-dot ${node.status}`}>{getStepIcon(node.status)}</div>
                        {i < activePath.roadmap.length - 1 && <div className={`sa-rm-connector ${node.status}`}></div>}
                      </div>
                      <div className="sa-rm-content">
                        <span className="sa-rm-step">Step {node.step}</span>
                        <h4 className="sa-rm-title">{node.title}</h4>
                        <p className="sa-rm-desc">{node.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resources */}
                <h3 className="sa-detail-title" style={{ marginTop: '24px' }}>📚 Recommended Resources</h3>
                <div className="sa-resources-list">
                  {(activePath.resources || []).map((res, i) => (
                    <div key={i} className="sa-res-row">
                      <span className="sa-res-icon">{getResourceIcon(res.type)}</span>
                      <span className="sa-res-name">{res.title}</span>
                      <span className="sa-res-type">{res.type}</span>
                      {res.duration && <span className="sa-res-dur">⏱ {res.duration}</span>}
                    </div>
                  ))}
                </div>

                <p className="sa-footer-note">
                  Generated by AI ({activePath.generatedBy}) on {new Date(activePath.createdAt).toLocaleDateString()}
                </p>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

export default StudentAnalytics