import React from 'react'
import './Footer.css' 

function Footer() {
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="footer-wrapper">
      
      {/* 1. "Back to Top" Strip */}
      <div className="back-to-top" onClick={scrollToTop}>
        Back to top
      </div>

      {/* 2. Main Footer Links Area */}
      <div className="footer-main">
        <div className="footer-content">
          
          <div className="footer-col">
            <h4>Get to Know Us</h4>
            <ul>
              <li><a href="#">About EduAI</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Releases</a></li>
              <li><a href="#">EduAI Science</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect with Us</h4>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Student Portal</a></li>
              <li><a href="#">Teacher Dashboard</a></li>
              <li><a href="#">Library</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom Credit Line */}
      <div className="footer-bottom">
        <div className="logo-line">
          <span className="footer-logo">🎓 EduAI</span>
        </div>
        <p className="copyright">
          © {new Date().getFullYear()} EduAI, Inc. or its affiliates
        </p>
        <p className="designer-credit">
          Designed & Developed by <span className="my-name">Lasya Reddy</span> {/* 👈 Change this if needed */}
        </p>
      </div>

    </footer>
  )
}

export default Footer