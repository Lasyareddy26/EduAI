import React, { useContext } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './StudentProfile.css'

function StudentProfile() {
  const { users } = useContext(studentTeacherContextObj)
  const { email } = useParams() 

  return (
    <div className="profile-dashboard">
      
      {/* 1. SIDEBAR */}
      <aside className="profile-sidebar">
        
        {/* Profile Card */}
        <div className="sidebar-profile-card">
          <div className="profile-background-splash"></div>
          <div className="profile-content-wrapper">
            <img 
              src={users?.profileImageUrl || "https://via.placeholder.com/150"} 
              alt="Profile" 
              className="sidebar-avatar"
            />
            <h3>{users?.firstName || "Student"}</h3>
            <p className="user-email">{users?.email || email}</p>
            <span className="role-badge">🎓 Student Account</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <p className="nav-label">OVERVIEW</p>

          <NavLink to="" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          <div className="nav-divider"></div>

          <p className="nav-label">ACADEMIC</p>
          
          <NavLink to="available-assignments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">📚</span>
            <span className="nav-text">Assignments</span>
          </NavLink>

          <NavLink to="my-submissions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">✅</span>
            <span className="nav-text">My Submissions</span>
          </NavLink>

          <div className="nav-divider"></div>

          <p className="nav-label">AI ASSISTANT</p>

          <NavLink to="learning-path" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI Learning Path</span>
          </NavLink>

          <NavLink to="resources" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">🧠</span>
            <span className="nav-text">Resources</span>
          </NavLink>

        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="profile-content">
        <div className="content-container">
           <Outlet /> 
        </div>
      </main>

    </div>
  )
}

export default StudentProfile