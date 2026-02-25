import React, { useState, useRef, useEffect, useContext } from 'react'
import axios from 'axios'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './Chatbot.css'

const LANGUAGES = [
  { code: 'auto', label: '🌐 Auto Detect' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'te', label: '🇮🇳 Telugu' },
  { code: 'ta', label: '🇮🇳 Tamil' },
  { code: 'kn', label: '🇮🇳 Kannada' },
  { code: 'ml', label: '🇮🇳 Malayalam' },
  { code: 'mr', label: '🇮🇳 Marathi' },
  { code: 'bn', label: '🇮🇳 Bengali' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'zh', label: '🇨🇳 Chinese' },
  { code: 'ar', label: '🇸🇦 Arabic' },
]

const QUICK_PROMPTS = [
  "📊 Show my progress",
  "💡 Study tips for weak topics",
  "📝 Explain my learning path",
  "🎯 What should I study next?",
]

function Chatbot() {
  const { users } = useContext(studentTeacherContextObj)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('auto')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const studentId = users?._id || (() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored)._id : null
  })()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'bot',
        text: `Hey ${users?.firstName || 'there'}! 👋 I'm your EduAI Assistant.\n\nI can help you with:\n• 📊 Your scores & progress\n• 📚 Explaining topics & concepts\n• 🎯 Study tips & guidance\n• 🌐 I speak multiple languages!\n\nAsk me anything!`,
        time: new Date()
      }])
    }
  }, [isOpen])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', text: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:3000/chatbot-api/chat', {
        studentId,
        message: msg,
        language: language === 'auto' ? null : language,
      })

      const reply = res.data?.payload?.reply || "Sorry, I couldn't process that. Try again!"
      setMessages(prev => [...prev, { role: 'bot', text: reply, time: new Date() }])
    } catch (err) {
      console.error("Chatbot error:", err)
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "⚠️ Oops! I'm having trouble connecting. Please make sure the server is running and try again.",
        time: new Date(),
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    setMessages([])
    try {
      await axios.post('http://localhost:3000/chatbot-api/clear', { studentId })
    } catch (e) { /* silent */ }
  }

  const selectedLang = LANGUAGES.find(l => l.code === language)

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="EduAI Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/></svg>
        )}
        {!isOpen && <span className="chatbot-fab-pulse"></span>}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-header-avatar">🤖</div>
            <div>
              <h4>EduAI Assistant</h4>
              <span className="chatbot-status">
                <span className="chatbot-status-dot"></span>
                Online • Multilingual
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            {/* Language Picker Toggle */}
            <button
              className="chatbot-lang-btn"
              onClick={() => setShowLangPicker(!showLangPicker)}
              title="Change language"
            >
              {selectedLang?.label.split(' ')[0] || '🌐'}
            </button>
            <button className="chatbot-clear-btn" onClick={clearChat} title="Clear chat">
              🗑️
            </button>
          </div>
        </div>

        {/* Language Picker Dropdown */}
        {showLangPicker && (
          <div className="chatbot-lang-picker">
            <p className="chatbot-lang-picker-title">🌐 Choose Response Language</p>
            <div className="chatbot-lang-grid">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`chatbot-lang-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => { setLanguage(lang.code); setShowLangPicker(false) }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-msg ${msg.role} ${msg.isError ? 'error' : ''}`}>
              {msg.role === 'bot' && <div className="chatbot-msg-avatar">🤖</div>}
              <div className="chatbot-msg-bubble">
                <div className="chatbot-msg-text">{msg.text}</div>
                <span className="chatbot-msg-time">
                  {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chatbot-msg bot">
              <div className="chatbot-msg-avatar">🤖</div>
              <div className="chatbot-msg-bubble">
                <div className="chatbot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="chatbot-quick-prompts">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button key={i} className="chatbot-quick-btn" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'hi' ? 'अपना सवाल लिखें...' : language === 'te' ? 'మీ ప్రశ్న రాయండి...' : 'Type your message...'}
            rows={1}
            disabled={loading}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </>
  )
}

export default Chatbot
