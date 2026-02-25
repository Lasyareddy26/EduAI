import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import StudentTeacherContext from './contexts/StudentTeacherContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StudentTeacherContext>
    <App />
    </StudentTeacherContext>
  </StrictMode>,
)
