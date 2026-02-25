import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentLearningPath.css'

function StudentLearningPath() {
  const { users } = useContext(studentTeacherContextObj)
  const [paths, setPaths] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [togglingStep, setTogglingStep] = useState(null) // step index being toggled

  const userId = users?._id || (() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored)._id : null
  })()

  const fetchPaths = () => {
    if (!userId) { setLoading(false); return }
    axios.get(`http://localhost:3000/student-api/learning-path/${userId}`)
      .then(res => {
        let data = res.data?.payload
        if (!Array.isArray(data)) data = data ? [data] : []
        data = data.filter(p => p.topic && p.subject && p.scorePercentage !== undefined)
        setPaths(data)
        if (data.length > 0 && !selectedTopic) setSelectedTopic(data[0].topic)
        setLoading(false)
      })
      .catch(() => { setPaths([]); setLoading(false) })
  }

  useEffect(() => { fetchPaths() }, [userId])

  // Bulk generate all learning paths from submissions
  const handleBulkGenerate = async () => {
    if (!userId || bulkGenerating) return
    setBulkGenerating(true)
    try {
      await axios.post(`http://localhost:3000/student-api/regenerate-all-learning-paths/${userId}`)
      setSelectedTopic(null)
      fetchPaths()
    } catch (err) {
      alert("Failed to generate. Make sure you have submitted at least one assignment and the ML service is running.")
    } finally { setBulkGenerating(false) }
  }

  // Regenerate single topic
  const handleRegenerate = async (path) => {
    if (!path || regenerating) return
    setRegenerating(true)
    try {
      await axios.post(`http://localhost:3000/student-api/regenerate-learning-path`, {
        studentId: userId, subject: path.subject, topic: path.topic, scorePercentage: path.scorePercentage
      })
      fetchPaths()
    } catch (err) { console.error("Regeneration error:", err) }
    finally { setRegenerating(false) }
  }

  // Toggle a roadmap step completed/upcoming
  const handleToggleStep = async (pathId, stepIndex) => {
    if (togglingStep !== null) return
    setTogglingStep(stepIndex)
    try {
      const res = await axios.put(`http://localhost:3000/student-api/learning-path/${pathId}/toggle-step/${stepIndex}`)
      const updated = res.data?.payload
      if (updated) {
        setPaths(prev => prev.map(p => p._id === pathId ? updated : p))
      }
    } catch (err) { console.error("Toggle step error:", err) }
    finally { setTogglingStep(null) }
  }

  const activePath = Array.isArray(paths) ? paths.find(p => p.topic === selectedTopic) : null

  const getLevelInfo = (level) => {
    switch (level) {
      case 'beginner': return { color: '#10b981', bg: '#d1fae5', icon: '🌱', label: 'Beginner' }
      case 'intermediate': return { color: '#2563eb', bg: '#dbeafe', icon: '📈', label: 'Intermediate' }
      case 'advanced': return { color: '#7b2cbf', bg: '#f3e8ff', icon: '🚀', label: 'Advanced' }
      default: return { color: '#6b7280', bg: '#f3f4f6', icon: '📊', label: level || 'Unknown' }
    }
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

  // Calculate roadmap progress
  const getRoadmapProgress = (roadmap) => {
    if (!roadmap || roadmap.length === 0) return 0
    const completed = roadmap.filter(n => n.status === 'completed').length
    return Math.round((completed / roadmap.length) * 100)
  }

  // --- LOADING ---
  if (loading) {
    return (
      <div className="lp-loading-container">
        <div className="lp-loading-spinner"></div>
        <p>🤖 AI is preparing your learning paths...</p>
      </div>
    )
  }

  // --- EMPTY STATE ---
  if (paths.length === 0) {
    return (
      <div className="lp-empty">
        <div className="lp-empty-icon">🎯</div>
        <h3>No Learning Paths Yet</h3>
        <p>Submit assignments first, then click below to generate AI-powered learning paths!</p>
        <button className="lp-bulk-generate-btn" onClick={handleBulkGenerate} disabled={bulkGenerating}>
          {bulkGenerating ? '⏳ Generating All Paths...' : '🚀 Generate My Learning Paths'}
        </button>
        {bulkGenerating && <p className="lp-generating-hint">Analyzing your submissions and building personalized roadmaps...</p>}
      </div>
    )
  }

  // --- MAIN VIEW ---
  const levelInfo = activePath ? getLevelInfo(activePath.difficultyLevel) : {}
  const hasRoadmap = activePath && Array.isArray(activePath.roadmap) && activePath.roadmap.length > 0
  const hasResources = activePath && Array.isArray(activePath.resources) && activePath.resources.length > 0
  const scoreVal = activePath ? Math.round(activePath.scorePercentage || 0) : 0
  const roadmapProgress = hasRoadmap ? getRoadmapProgress(activePath.roadmap) : 0

  return (
    <div className="lp-container">
      {/* Header */}
      <div className="lp-header">
        <div>
          <h2 className="lp-title">🤖 AI Learning Roadmap</h2>
          <p className="lp-subtitle">Personalized study plans based on your quiz performance</p>
        </div>
        <button className="lp-bulk-refresh-btn" onClick={handleBulkGenerate} disabled={bulkGenerating}>
          {bulkGenerating ? '⏳ Refreshing...' : '🔄 Refresh All Paths'}
        </button>
      </div>

      {/* Topic Selector Tabs */}
      <div className="lp-topic-tabs">
        {paths.map(p => {
          const info = getLevelInfo(p.difficultyLevel)
          const progress = getRoadmapProgress(p.roadmap)
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
                {progress === 100 ? '✅' : `${Math.round(p.scorePercentage || 0)}%`}
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
              {activePath.aiMessage && <p className="lp-hero-message">{activePath.aiMessage}</p>}
            </div>
            <div className="lp-hero-right">
              <div className="lp-score-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={levelInfo.color} strokeWidth="8"
                    strokeDasharray={`${(scoreVal / 100) * 264} 264`} strokeDashoffset="66"
                    strokeLinecap="round" className="lp-ring-anim" />
                </svg>
                <div className="lp-score-center">
                  <span className="lp-score-value">{scoreVal}%</span>
                  <span className="lp-score-label">Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          {activePath.tip && <div className="lp-tip">{activePath.tip}</div>}

          {/* ═══════ VISUAL ROADMAP (clickable steps) ═══════ */}
          <div className="lp-roadmap-section">
            <div className="lp-section-header">
              <h3 className="lp-section-title">🗺️ Your Learning Roadmap</h3>
              {hasRoadmap && (
                <div className="lp-progress-info">
                  <div className="lp-progress-bar-wrap">
                    <div className="lp-progress-bar" style={{ width: `${roadmapProgress}%`, background: levelInfo.color }}></div>
                  </div>
                  <span className="lp-progress-text">{roadmapProgress}% complete</span>
                </div>
              )}
            </div>
            <p className="lp-roadmap-hint">Click on a step to mark it as completed or undo.</p>
            {hasRoadmap ? (
              <div className="lp-roadmap">
                {activePath.roadmap.map((node, i) => (
                  <div key={i} className={`lp-roadmap-node ${node.status}`}>
                    <div className="lp-node-line">
                      <button
                        className={`lp-node-dot ${node.status} clickable`}
                        onClick={() => handleToggleStep(activePath._id, i)}
                        disabled={togglingStep !== null}
                        title={node.status === 'completed' ? 'Click to undo' : 'Click to mark as completed'}
                      >
                        {togglingStep === i ? '⏳' : node.status === 'completed' ? '✅' : node.status === 'current' ? '🔵' : '⚪'}
                      </button>
                      {i < activePath.roadmap.length - 1 && <div className={`lp-node-connector ${node.status}`}></div>}
                    </div>
                    <div className="lp-node-content" onClick={() => handleToggleStep(activePath._id, i)} style={{ cursor: 'pointer' }}>
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
            ) : (
              <div className="lp-empty-section">
                <p>🔄 Roadmap not available. Click "Regenerate" below.</p>
              </div>
            )}
          </div>

          {/* ═══════ RESOURCES PER TOPIC (real links) ═══════ */}
          <div className="lp-resources-section">
            <h3 className="lp-section-title">📚 Recommended Resources for <em>{activePath.topic}</em></h3>
            {hasResources ? (
              <div className="lp-resources-grid">
                {activePath.resources.map((res, i) => (
                  <a key={i} href={res.url || '#'} target="_blank" rel="noreferrer" className="lp-resource-card-link">
                    <div className="lp-resource-card">
                      <div className="lp-resource-icon">{getResourceIcon(res.type)}</div>
                      <div className="lp-resource-info">
                        <h4 className="lp-resource-title">{res.title}</h4>
                        <div className="lp-resource-meta">
                          <span className="lp-resource-type">{res.type}</span>
                          {res.source && <span className="lp-resource-source">{res.source}</span>}
                          {res.duration && <span className="lp-resource-duration">⏱ {res.duration}</span>}
                        </div>
                      </div>
                      <span className="lp-resource-btn">Open →</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="lp-empty-section">
                <p>🔄 Resources not available. Click "Regenerate" below.</p>
              </div>
            )}
          </div>

          {/* Regenerate Single Topic */}
          <div className="lp-regenerate-wrap">
            <button className="lp-regenerate-btn" onClick={() => handleRegenerate(activePath)} disabled={regenerating}>
              {regenerating ? '⏳ Regenerating...' : `🔄 Regenerate "${activePath.topic}" Path`}
            </button>
            <p className="lp-regenerate-hint">Re-analyze your score and generate fresh roadmap + resources for this topic.</p>
          </div>

          <div className="lp-footer">
            Generated by AI ({activePath.generatedBy || 'ml-v2'}) on {new Date(activePath.createdAt).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  )
}

export default StudentLearningPath