import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css' 
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext'
import { useClerk, useUser } from '@clerk/clerk-react'

function Header() {
  const { setusers } = useContext(studentTeacherContextObj)
  const { signOut } = useClerk()
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setusers(null)
    navigate('/')
  }

  return (
    <header className="header-theme header-container">
      <div className="header-content">
        
        {/* Brand Logo (Always visible) */}
        <Link to="" className="brand-logo">
          <span className="logo-icon">🎓</span> EduAI
        </Link>

        {/* Right Side: Navigation Links */}
        <nav>
          <ul className="nav-links">

            {/* CASE 1: NOT SIGNED IN (Show Home, Register, Login) */}
            {!isSignedIn ? (
              <>
                <li>
                  <Link to="" className="nav-item">Home</Link>
                </li>
                <li>
                  <Link to="register" className="nav-item">Register</Link>
                </li>
                <li>
                  <Link to="login" className="nav-item login-btn">Login</Link>
                </li>
              </>
            ) : (
              
              /* CASE 2: SIGNED IN (Only Show Logout) */
              <li>
                <button 
                  className="nav-item login-btn" 
                  onClick={handleSignOut}
                  style={{ cursor: 'pointer', fontSize: '1rem' }}
                >
                  Logout
                </button>
              </li>
            )}

          </ul>
        </nav>

      </div>
    </header>
  )
}

export default Header