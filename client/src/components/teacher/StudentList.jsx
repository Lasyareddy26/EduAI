import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './TeacherProfile.css' // We can reuse the teacher styles

function StudentList() {
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Fetch all students from your new backend route
    axios.get('http://localhost:3000/teacher-api/students')
      .then(res => {
        setStudents(res.data.payload)
      })
      .catch(err => {
        setError('Failed to fetch students. Is the server running?')
        console.error(err)
      })
  }, [])

  return (
    <div className="teacher-content-container">
      <h2 style={{ color: '#240046', marginBottom: '10px' }}>Student Directory</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Select a student below to view their AI Learning Path and Performance Analytics.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Grid Layout for Student Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        
        {students.map(student => (
          <div key={student._id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            transition: 'transform 0.2s'
          }}>
            
            {/* Purple Decorative Strip */}
            <div style={{ height: '8px', background: 'linear-gradient(90deg, #7b2cbf, #9d4edd)' }}></div>
            
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <img 
                src={student.profileImageUrl || "https://via.placeholder.com/80"} 
                alt="profile" 
                style={{
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  marginBottom: '15px',
                  border: '3px solid #f3f0f5'
                }}
              />
              
              <h4 style={{ margin: '0 0 5px 0', color: '#240046' }}>
                {student.firstName} {student.lastName}
              </h4>
              <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9rem' }}>
                {student.email}
              </p>

              <button 
                onClick={() => navigate(`../student-analytics/${student._id}`)}
                style={{
                  background: '#240046',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                View AI Insights 📊
              </button>
            </div>
          </div>
        ))}

        {students.length === 0 && !error && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888' }}>
            No students found in the database.
          </p>
        )}

      </div>
    </div>
  )
}

export default StudentList