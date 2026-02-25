import React, { useContext, useEffect } from 'react'
import './Home.css' 
import { useUser } from '@clerk/clerk-react'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import { useNavigate } from 'react-router-dom' 
import axios from 'axios' // 1. Import Axios for API calls

function Home() {
  const { users, setusers } = useContext(studentTeacherContextObj)
  const { user, isSignedIn } = useUser()
  const navigate = useNavigate()

  // 1. Sync Clerk data to Context on load
  useEffect(() => {
    if (isSignedIn && user) {
      setusers((prev) => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0].emailAddress,
        profileImageUrl: user.imageUrl,
        createdAt: user.createdAt
        // Role remains empty until selected
      }))
    }
  }, [isSignedIn, user, setusers])

  // 2. Handle Radio Button Selection
  const onRoleSelect = (e) => {
    setusers({ ...users, role: e.target.value })
  }

  // 3. Handle Continue Button (API Integration)
  const handleContinue = async () => {
    if (!users.role) {
      alert("Please select a role to continue!")
      return
    }

    // A. Define the correct endpoint based on role
    let apiUrl = ""
    if (users.role === 'student') {
      apiUrl = "http://localhost:3000/student-api/student"
    } else {
      apiUrl = "http://localhost:3000/teacher-api/teacher"
    }

    // B. Prepare the data payload
    const payload = {
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
      isActive: true // Defaulting to true as per your schema
    }

    try {
      // C. Make the POST Request
      const res = await axios.post(apiUrl, payload)

      if (res.status === 201) {
        console.log("User created successfully:", res.data)
        // Navigate on success
        navigateToProfile()
      }

    } catch (err) {
      console.error("Error creating user:", err)

      // D. HANDLE EXISTING USER (409 Conflict)
      // If the email is already in the DB, your backend returns 409.
      // We should allow them to proceed to their dashboard anyway.
      if (err.response && err.response.status === 409) {
        console.log("User already exists, redirecting to profile...")
        navigateToProfile()
      } else {
        alert("Something went wrong. Please try again.")
      }
    }
  }

  // Helper function to handle navigation
  const navigateToProfile = () => {
    if (users.role === 'student') {
      navigate(`/student-profile/${users.email}`)
    } else {
      navigate(`/teacher-profile/${users.email}`)
    }
  }

  return (
    <div className="">
      
      {/* CASE 1: NOT SIGNED IN (Landing Page) */}
      {!isSignedIn && (
        <div className="home-container">
          <section className="home-hero">
            <div className="hero-content">
              <h1>Revolutionizing Education with AI</h1>
              <p>
                EduAI is an advanced learning management ecosystem that bridges the gap 
                between students and teachers using artificial intelligence.
              </p>
            </div>
          </section>

          <div className="dashboard-grid">
            <div className="info-card">
              <h3>🤖 Adaptive AI Learning</h3>
              <p>Every student learns differently. EduAI analyzes performance data to generate custom learning paths.</p>
              <ul className="feature-list">
                <li>Dynamic difficulty adjustment</li>
                <li>Personalized topic recommendations</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3>📊 Teacher Analytics</h3>
              <p>Empowering educators with data. Teachers get a comprehensive dashboard showing class performance trends.</p>
              <ul className="feature-list">
                <li>Automated grading assistance</li>
                <li>Class-wide performance heatmaps</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3>🛡️ Secure & Scalable</h3>
              <p>Built on a robust MERN stack architecture, EduAI ensures that student data is encrypted and secure.</p>
              <ul className="feature-list">
                <li>Role-based access control</li>
                <li>Encrypted data transmission</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: SIGNED IN (Role Selection UI) */}
      {isSignedIn && (
        <div className="role-selection-wrapper">
          <div className="role-card-container">
            
            {/* User Profile Header */}
            <div className="profile-header">
              <img 
                src={users.profileImageUrl} 
                alt="Profile" 
                className="profile-img-large" 
              />
              <h2>Welcome, {users.firstName} {users.lastName}!</h2>
              <p className="subtitle">Let's set up your EduAI experience.</p>
            </div>

            <hr className="divider" />

            {/* Role Selection Form */}
            <div className="role-form">
              <h3>Choose your Role</h3>
              
              <div className="role-options-grid">
                
                {/* Student Option */}
                <label className={`role-option ${users.role === 'student' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="student" 
                    onChange={onRoleSelect}
                    checked={users.role === 'student'}
                  />
                  <span className="role-icon">🎓</span>
                  <div className="role-text">
                    <strong>I am a Student</strong>
                    <small>Access learning paths & assignments</small>
                  </div>
                </label>

                {/* Teacher Option */}
                <label className={`role-option ${users.role === 'teacher' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="teacher" 
                    onChange={onRoleSelect}
                    checked={users.role === 'teacher'}
                  />
                  <span className="role-icon">👨‍🏫</span>
                  <div className="role-text">
                    <strong>I am a Teacher</strong>
                    <small>Manage classes & view analytics</small>
                  </div>
                </label>

              </div>

              {/* Continue Button */}
              <button 
                className="continue-btn" 
                onClick={handleContinue}
                disabled={!users.role} 
              >
                Continue to Dashboard →
              </button>

            </div>
          </div>
        </div>
      )}
    
    </div>
  )
}

export default Home