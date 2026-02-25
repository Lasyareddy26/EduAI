import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentLearningPath.css'

function StudentLearningPath() {
  const { users } = useContext(studentTeacherContextObj)
  const [paths, setPaths] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [loading, setLoading] = useState(true)

  const userId = users?._id || (() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored)._id : null
  })()

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    axios.get(`http://localhost:3000/student-api/learning-path/${userId}`)
      .then(res => {
        const data = res.data.payload || []
        setPaths(data)
        if (data.length > 0) setSelectedTopic(data[0].topic)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching learning paths:", err)
        setLoading(false)
      })
  }, [userId])

  const activePath = paths.find(p => p.topic === selectedTopic)

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
      <div className="lp-loading-container">
        <div className="lp-loading-spinner"></div>
        <p>🤖 AI is preparing your learning paths...</p>
      </div>
    )
  }

  if (paths.length === 0) {
    return (
      <div className="lp-empty">
        <div className="lp-empty-icon">🎯</div>
        <h3>No Learning Paths Yet</h3>
        <p>Submit an assignment first! The AI will analyze your performance and generate a personalized study roadmap for each topic.</p>
      </div>
    )
  }

  const levelInfo = activePath ? getLevelInfo(activePath.difficultyLevel) : {}

  return (
    <div className="lp-container">
      {/* Header */}
      <div className="lp-header">
        <div>
          <h2 className="lp-title">🤖 AI Learning Roadmap</h2>
          <p className="lp-subtitle">Personalized study plans based on your quiz performance</p>
        </div>
      </div>

      {/* Topic Selector Tabs */}
      <div className="lp-topic-tabs">
        {paths.map(p => {
          const info = getLevelInfo(p.difficultyLevel)
          return (
            <button
              key={p._id}
              className={`lp-topic-tab ${selectedTopic === p.topic ? 'active' : ''}`}
              onClick={() => setSelectedTopic(p.topic)}
              style={selectedTopic === p.topic ? { borderColor: info.color, color: info.color } : {}}
            >
              <span className="lp-tab-icon">{info.icon}</span>
              <span className="lp-tab-text">{p.topic}</span>
              <span className="lp-tab-badge" style={{ background: info.bg, color: info.color }}>
                {Math.round(p.scorePercentage || 0)}%
              </span>
            </button>
          )
        })}
      </div>

      {activePath && (
        <>
          {/* Hero Card */}
          <div className="lp-hero" style={{ background: `linear-gradient(135deg, ${levelInfo.color}22, ${levelInfo.color}08)`, borderColor: `${levelInfo.color}33` }}>
            <div className="lp-hero-left">
              <div className="lp-hero-badge" style={{ background: levelInfo.bg, color: levelInfo.color }}>
                {levelInfo.icon} {levelInfo.label} Level
              </div>
              <h3 className="lp-hero-topic">{activePath.topic}</h3>
              <p className="lp-hero-subject">{activePath.subject}</p>
              <p className="lp-hero-message">{activePath.aiMessage}</p>
            </div>
            <div className="lp-hero-right">
              <div className="lp-score-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={levelInfo.color}
                    strokeWidth="8"
                    strokeDasharray={`${(activePath.scorePercentage / 100) * 264} 264`}
                    strokeDashoffset="66"
                    strokeLinecap="round"
                    className="lp-ring-anim"
                  />
                </svg>
                <div className="lp-score-center">
                  <span className="lp-score-value">{Math.round(activePath.scorePercentage)}%</span>
                  <span className="lp-score-label">Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          {activePath.tip && (
            <div className="lp-tip">
              {activePath.tip}
            </div>
          )}

          {/* Visual Roadmap */}
          <div className="lp-roadmap-section">
            <h3 className="lp-section-title">🗺️ Your Learning Roadmap</h3>
            <div className="lp-roadmap">
              {(activePath.roadmap || []).map((node, i) => (
                <div key={i} className={`lp-roadmap-node ${node.status}`}>
                  <div className="lp-node-line">
                    <div className={`lp-node-dot ${node.status}`}>
                      {getStepIcon(node.status)}
                    </div>
                    {i < activePath.roadmap.length - 1 && <div className={`lp-node-connector ${node.status}`}></div>}
                  </div>
                  <div className="lp-node-content">
                    <div className="lp-node-step">Step {node.step}</div>
                    <h4 className="lp-node-title">{node.title}</h4>
                    <p className="lp-node-desc">{node.description}</p>
                    <span className={`lp-node-status-badge ${node.status}`}>
                      {node.status === 'completed' ? '✅ Completed' : node.status === 'current' ? '🔵 In Progress' : '⏳ Upcoming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="lp-resources-section">
            <h3 className="lp-section-title">📚 Recommended Resources</h3>
            <div className="lp-resources-grid">
              {(activePath.resources || []).map((res, i) => (
                <div key={i} className="lp-resource-card">
                  <div className="lp-resource-icon">{getResourceIcon(res.type)}</div>
                  <div className="lp-resource-info">
                    <h4 className="lp-resource-title">{res.title}</h4>
                    <div className="lp-resource-meta">
                      <span className="lp-resource-type">{res.type}</span>
                      {res.duration && <span className="lp-resource-duration">⏱ {res.duration}</span>}
                    </div>
                  </div>
                  <button className="lp-resource-btn">Start →</button>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-footer">
            Generated by AI ({activePath.generatedBy}) on {new Date(activePath.createdAt).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  )
}

export default StudentLearningPath