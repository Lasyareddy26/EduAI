import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { studentTeacherContextObj } from "../../contexts/StudentTeacherContext";
import "./SubmitAssignment.css";

function SubmitAssignment() {
  const { assignmentId } = useParams();
  const { users } = useContext(studentTeacherContextObj);
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasManual, setHasManual] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Assignment
  useEffect(() => {
    if (!assignmentId) return;

    axios
      .get(`http://localhost:3000/student-api/assignment/${assignmentId}`)
      .then((res) => {
        const asg = res.data.payload;
        setAssignment(asg);
        // Check if there are manually graded questions
        const manual = asg.questions.some(
          (q) => q.type === "short" || q.type === "essay",
        );
        setHasManual(manual);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching assignment:", err);
        setLoading(false);
      });
  }, [assignmentId]);

  // 2. Handle answer changes
  const handleAnswerChange = (qId, value) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  // 3. Submit Logic
  const handleSubmit = () => {
    if (!window.confirm("Are you sure you want to submit?")) return;

    let currentUser = users;
    if (!currentUser || !currentUser._id) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch (e) {
          currentUser = null;
        }
      }
    }
    if (!currentUser || !currentUser._id) {
      alert("Session expired! Redirecting to login...");
      navigate("/login");
      return;
    }

    // Client-side auto-score for immediate feedback (MCQ, T/F, Fill-in-blank)
    let calculatedScore = 0;
    assignment.questions.forEach((q) => {
      const studentAns = (userAnswers[q._id] || "").trim().toLowerCase();
      const correctAns = (q.correctAnswer || "").trim().toLowerCase();

      if (
        q.type === "mcq" ||
        q.type === "truefalse" ||
        q.type === "fillblank"
      ) {
        if (studentAns === correctAns) {
          calculatedScore += q.marks;
        }
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const submissionPayload = {
      studentId: currentUser._id,
      assignmentId: assignmentId,
      answers: Object.entries(userAnswers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans,
      })),
      status: "submitted",
    };

    axios
      .post(
        "http://localhost:3000/student-api/submit-assignment",
        submissionPayload,
      )
      .then((res) => {
        console.log("✅ Success:", res.data);
      })
      .catch((err) => {
        console.error(
          "❌ Submission Error:",
          err.response?.data || err.message,
        );
        alert(
          "Failed to save: " + (err.response?.data?.message || err.message),
        );
      });
  };

  if (loading) return <div className="quiz-loading">Loading Assignment...</div>;
  if (!assignment)
    return <div className="quiz-error">Assignment not found!</div>;

  // Helper: is this an auto-evaluable type?
  const isAutoEval = (type) => ["mcq", "truefalse", "fillblank"].includes(type);

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h2 className="quiz-title">{assignment.title}</h2>
          <span className="quiz-topic">
            {assignment.subject} • {assignment.topic}
          </span>
        </div>
        <div className="quiz-timer">Total Marks: {assignment.totalMarks}</div>
      </div>

      <div className="quiz-questions-list">
        {assignment.questions.map((q, index) => {
          const studentAns = (userAnswers[q._id] || "").trim().toLowerCase();
          const correctAns = (q.correctAnswer || "").trim().toLowerCase();
          const isCorrect = isAutoEval(q.type) && studentAns === correctAns;

          // Type badge color
          const typeBadge = {
            mcq: { label: "MCQ", color: "#7b2cbf" },
            truefalse: { label: "True/False", color: "#2563eb" },
            fillblank: { label: "Fill in the Blank", color: "#d97706" },
            short: { label: "Short Answer", color: "#059669" },
            essay: { label: "Essay", color: "#dc2626" },
          }[q.type] || { label: q.type, color: "#666" };

          return (
            <div
              key={q._id}
              className={`question-card ${isSubmitted && isAutoEval(q.type) ? (isCorrect ? "card-correct" : "card-wrong") : ""}`}
            >
              <div className="q-header">
                <span className="q-number">Q{index + 1}</span>
                <span
                  style={{
                    background: typeBadge.color,
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {typeBadge.label}
                </span>
                <p className="q-text">{q.questionText}</p>
                <span className="q-marks">
                  {q.marks} Mark{q.marks > 1 ? "s" : ""}
                </span>
              </div>

              {/* MCQ: option buttons */}
              {q.type === "mcq" && (
                <div className="options-grid">
                  {(q.options || []).map((option, i) => {
                    const isSelected = userAnswers[q._id] === option;
                    let optionClass = "option-btn";
                    if (isSelected) optionClass += " selected";
                    if (isSubmitted) {
                      if (option.toLowerCase() === correctAns)
                        optionClass += " correct-answer";
                      else if (
                        isSelected &&
                        option.toLowerCase() !== correctAns
                      )
                        optionClass += " wrong-answer";
                    }
                    return (
                      <button
                        key={i}
                        className={optionClass}
                        onClick={() => handleAnswerChange(q._id, option)}
                        disabled={isSubmitted}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False: two buttons */}
              {q.type === "truefalse" && (
                <div className="options-grid">
                  {["True", "False"].map((option) => {
                    const isSelected = userAnswers[q._id] === option;
                    let optionClass = "option-btn";
                    if (isSelected) optionClass += " selected";
                    if (isSubmitted) {
                      if (option.toLowerCase() === correctAns)
                        optionClass += " correct-answer";
                      else if (
                        isSelected &&
                        option.toLowerCase() !== correctAns
                      )
                        optionClass += " wrong-answer";
                    }
                    return (
                      <button
                        key={option}
                        className={optionClass}
                        onClick={() => handleAnswerChange(q._id, option)}
                        disabled={isSubmitted}
                        style={{ minWidth: "120px" }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank: text input */}
              {q.type === "fillblank" && (
                <div style={{ margin: "10px 0" }}>
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={userAnswers[q._id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                    disabled={isSubmitted}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: isSubmitted
                        ? isCorrect
                          ? "2px solid #22c55e"
                          : "2px solid #ef4444"
                        : "1px solid #ccc",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              )}

              {/* Short answer: small textarea */}
              {q.type === "short" && (
                <div style={{ margin: "10px 0" }}>
                  <textarea
                    placeholder="Write a brief answer..."
                    rows={3}
                    value={userAnswers[q._id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                    disabled={isSubmitted}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              )}

              {/* Essay: large textarea */}
              {q.type === "essay" && (
                <div style={{ margin: "10px 0" }}>
                  <textarea
                    placeholder="Write your detailed answer..."
                    rows={6}
                    value={userAnswers[q._id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                    disabled={isSubmitted}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              )}

              {/* Feedback after submission */}
              {isSubmitted && isAutoEval(q.type) && (
                <div className="feedback-msg">
                  {isCorrect ? (
                    <span className="text-green">✅ Correct! (+{q.marks})</span>
                  ) : (
                    <span className="text-red">
                      ❌ Correct Answer: {q.correctAnswer}
                    </span>
                  )}
                </div>
              )}

              {isSubmitted && !isAutoEval(q.type) && (
                <div className="feedback-msg">
                  <span style={{ color: "#7b2cbf" }}>
                    ⏳ Will be reviewed by your teacher
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="quiz-footer">
        {!isSubmitted ? (
          <button className="submit-final-btn" onClick={handleSubmit}>
            Submit Assignment
          </button>
        ) : (
          <div className="result-summary">
            {hasManual ? (
              <>
                <h3 style={{ color: "#7b2cbf" }}>
                  📝 Score: Pending Evaluation
                </h3>
                <p
                  style={{
                    color: "#4b5563",
                    marginTop: "8px",
                    fontSize: "0.95rem",
                  }}
                >
                  Your essay/short answers are being evaluated by AI and will be
                  reviewed by your teacher. Final score will be updated soon.
                </p>
                {score > 0 && (
                  <p
                    style={{
                      color: "#059669",
                      marginTop: "6px",
                      fontSize: "0.9rem",
                    }}
                  >
                    ✅ Auto-graded questions score: {score} marks
                  </p>
                )}
              </>
            ) : (
              <h3>
                Auto-Evaluated Score: {score} / {assignment.totalMarks}
              </h3>
            )}
            <button
              className="close-btn"
              onClick={() => navigate("../my-submissions")}
            >
              Exit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmitAssignment;
