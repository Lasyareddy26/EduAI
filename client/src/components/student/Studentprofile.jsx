import React, { useContext } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentProfile.css'

function StudentProfile() {
  const { users } = useContext(studentTeacherContextObj)
  const { email } = useParams() 

  return (
    <div className="student-dashboard-layout">
      
      {/* 1. SIDEBAR */}
      <aside className="student-sidebar-container">
        
        {/* Profile Card */}
        <div className="student-profile-card">
          <div className="student-background-splash"></div>
          <div className="student-content-wrapper">
            <img 
              src={users?.profileImageUrl || "https://via.placeholder.com/150"} 
              alt="Profile" 
              className="student-avatar"
            />
            <h3>{users?.firstName || "Student"}</h3>
            <p className="student-email">{users?.email || email}</p>
            <span className="student-role-badge">🎓 Student Account</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="student-nav-menu">
          <p className="student-nav-label">OVERVIEW</p>

          <NavLink to="" end className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}>
            <span className="student-nav-icon">🏠</span>
            <span className="student-nav-text">Dashboard</span>
          </NavLink>

          <div className="student-nav-divider"></div>

          <p className="student-nav-label">ACADEMIC</p>
          
          <NavLink to="available-assignments" className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}>
            <span className="student-nav-icon">📚</span>
            <span className="student-nav-text">Assignments</span>
          </NavLink>

          <NavLink to="my-submissions" className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}>
            <span className="student-nav-icon">✅</span>
            <span className="student-nav-text">My Submissions</span>
          </NavLink>

          <div className="student-nav-divider"></div>

          <p className="student-nav-label">AI ASSISTANT</p>

          <NavLink to="learning-path" className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}>
            <span className="student-nav-icon">🤖</span>
            <span className="student-nav-text">AI Learning Path</span>
          </NavLink>

          <NavLink to="resources" className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}>
            <span className="student-nav-icon">🧠</span>
            <span className="student-nav-text">Resources</span>
          </NavLink>

        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="student-content-area">
        <div className="student-content-container">
           <Outlet /> 
        </div>
      </main>

    </div>
  )
}

export default StudentProfile