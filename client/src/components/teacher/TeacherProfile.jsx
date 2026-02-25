import React, { useContext } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import './TeacherProfile.css'

function TeacherProfile() {
  const { users } = useContext(studentTeacherContextObj)
  // Fallback to URL param if context is empty on refresh
  const { email } = useParams() 

  return (
    <div className="teacher-dashboard-layout">
      
      {/* 1. SIDEBAR */}
      <aside className="teacher-sidebar-container">
        
        {/* Profile Card */}
        <div className="teacher-profile-card">
          <div className="teacher-background-splash"></div>
          <div className="teacher-content-wrapper">
            <img 
              src={users?.profileImageUrl} 
              alt="Profile" 
              className="teacher-avatar"
            />
            <h3>{users?.firstName || "Teacher"}</h3>
            <p className="teacher-email">{users?.email || email}</p>
            <span className="teacher-role-badge">👨‍🏫 Teacher Access</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="teacher-nav-menu">
          <p className="teacher-nav-label">CLASSROOM</p>
          
          {/* 1. Create Assignment */}
          <NavLink 
            to="create-assignment" 
            className={({ isActive }) => isActive ? "teacher-nav-item active" : "teacher-nav-item"}
          >
            <span className="teacher-nav-icon">📝</span>
            <span className="teacher-nav-text">Create Assignment</span>
          </NavLink>

          {/* 2. View Submissions (Goes to list of assignments first) */}
          <NavLink 
            to="assignments" 
            className={({ isActive }) => isActive ? "teacher-nav-item active" : "teacher-nav-item"}
          >
            <span className="teacher-nav-icon">📂</span>
            <span className="teacher-nav-text">Assignments & Subs</span>
          </NavLink>

          <div className="teacher-nav-divider"></div>

          <p className="teacher-nav-label">ANALYTICS & AI</p>

          {/* 3. AI Student Insights (Goes to Student Directory) */}
          <NavLink 
            to="student-directory" 
            className={({ isActive }) => isActive ? "teacher-nav-item active" : "teacher-nav-item"}
          >
            <span className="teacher-nav-icon">📊</span>
            <span className="teacher-nav-text">Students List</span>
          </NavLink>

        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="teacher-content-area">
        <div className="teacher-content-container">
           {/* This will render CreateAssignment, ViewAssignments, or StudentList based on the URL */}
           <Outlet /> 
        </div>
      </main>

    </div>
  )
}

export default TeacherProfile