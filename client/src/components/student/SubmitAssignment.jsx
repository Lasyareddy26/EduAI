import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext';
import './SubmitAssignment.css';

function SubmitAssignment() {
  const { assignmentId } = useParams();
  const { users } = useContext(studentTeacherContextObj);
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Assignment
  useEffect(() => {
    if (!assignmentId) return;
    
    axios.get(`http://localhost:3000/student-api/assignment/${assignmentId}`)
      .then(res => {
        setAssignment(res.data.payload);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching assignment:", err);
        setLoading(false);
      });
  }, [assignmentId]);

  // 2. Handle Option Selection
  const handleOptionSelect = (qId, option) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  // 3. Submit Logic (Fixed for Session Issues)
  const handleSubmit = () => {
    if (!window.confirm("Are you sure you want to submit?")) return;

    // --- 🛡️ ROBUST SESSION CHECK START ---
    let currentUser = users;
    
    // Debug 1: Check Context
    console.log("Checking Context User:", currentUser);

    // If context is missing OR missing the _id (which happens if it's the default empty state)
    if (!currentUser || !currentUser._id) {
      console.log("Context empty. Checking LocalStorage...");
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          console.log("Found User in LocalStorage:", currentUser);
        } catch (e) {
          console.error("Error parsing LocalStorage user:", e);
          currentUser = null;
        }
      }
    }

    // Final Check: If we still don't have an ID, we cannot submit.
    if (!currentUser || !currentUser._id) {
      alert("Session expired! Redirecting to login...");
      navigate('/login'); // Redirects user to login page automatically
      return;
    }
    // --- 🛡️ ROBUST SESSION CHECK END ---

    let calculatedScore = 0;
    assignment.questions.forEach(q => {
      if (userAnswers[q._id] === q.correctAnswer) {
        calculatedScore += q.marks;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const submissionPayload = {
      studentId: currentUser._id,   // ✅ Using the safely resolved currentUser
      assignmentId: assignmentId,
      answers: Object.entries(userAnswers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans
      })),
      finalScore: calculatedScore, // Matches your Schema
      status: "submitted"
    };

    console.log("📤 Sending Payload:", submissionPayload);

    axios.post('http://localhost:3000/student-api/submit-assignment', submissionPayload)
      .then(res => {
        console.log("✅ Success:", res.data);
      })
      .catch(err => {
        console.error("❌ Submission Error:", err.response?.data || err.message);
        alert("Failed to save: " + (err.response?.data?.message || err.message));
      });
  };

  if (loading) return <div className="quiz-loading">Loading Assignment...</div>;
  if (!assignment) return <div className="quiz-error">Assignment not found!</div>;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h2 className="quiz-title">{assignment.title}</h2>
          <span className="quiz-topic">{assignment.subject} • {assignment.topic}</span>
        </div>
        <div className="quiz-timer">
          Total Marks: {assignment.totalMarks}
        </div>
      </div>

      <div className="quiz-questions-list">
        {assignment.questions.map((q, index) => {
          const isCorrect = userAnswers[q._id] === q.correctAnswer;
          
          return (
            <div key={q._id} className={`question-card ${isSubmitted ? (isCorrect ? 'card-correct' : 'card-wrong') : ''}`}>
              <div className="q-header">
                <span className="q-number">Q{index + 1}</span>
                <p className="q-text">{q.questionText}</p>
                <span className="q-marks">{q.marks} Mark</span>
              </div>

              <div className="options-grid">
                {q.options.map((option, i) => {
                  const isSelected = userAnswers[q._id] === option;
                  let optionClass = "option-btn";
                  if (isSelected) optionClass += " selected";
                  if (isSubmitted) {
                    if (option === q.correctAnswer) optionClass += " correct-answer";
                    else if (isSelected && option !== q.correctAnswer) optionClass += " wrong-answer";
                  }

                  return (
                    <button
                      key={i}
                      className={optionClass}
                      onClick={() => handleOptionSelect(q._id, option)}
                      disabled={isSubmitted}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              
              {isSubmitted && (
                <div className="feedback-msg">
                  {isCorrect ? (
                    <span className="text-green">✅ Correct! (+{q.marks})</span>
                  ) : (
                    <span className="text-red">❌ Correct Answer: {q.correctAnswer}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="quiz-footer">
        {!isSubmitted ? (
          <button 
            className="submit-final-btn" 
            onClick={handleSubmit}
            // Optional: Keep disabled check if you want to force answering all Qs
            // disabled={Object.keys(userAnswers).length !== assignment.questions.length}
          >
            Submit Assignment
          </button>
        ) : (
          <div className="result-summary">
            <h3>Final Score: {score} / {assignment.totalMarks}</h3>
            <button className="close-btn" onClick={() => navigate('../my-submissions')}>
              Exit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmitAssignment;