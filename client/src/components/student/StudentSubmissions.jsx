import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { studentTeacherContextObj } from "../../contexts/StudentTeacherContext";
import "./StudentSubmissions.css";

function StudentSubmissions() {
  const { users } = useContext(studentTeacherContextObj);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // 1. Safety check for user session
    let userId = users?._id;
    if (!userId) {
      const stored = localStorage.getItem("user");
      if (stored) userId = JSON.parse(stored)._id;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    // 2. Fetch Submissions
    // Ensure your backend route populates 'assignmentId' so we get the title!
    axios
      .get(`http://localhost:3000/student-api/my-submissions/${userId}`)
      .then((res) => {
        setSubmissions(res.data.payload);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching submissions:", err);
        setLoading(false);
      });
  }, [users]);

  // Helper to format date cleanly
  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " at " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Open feedback modal for a submission
  const openFeedback = (submissionId) => {
    setModalLoading(true);
    axios
      .get(
        `http://localhost:3000/student-api/submission-detail/${submissionId}`,
      )
      .then((res) => {
        setSelectedSubmission(res.data.payload);
        setModalLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching submission details:", err);
        setModalLoading(false);
      });
  };

  const closeFeedback = () => {
    setSelectedSubmission(null);
  };

  // Find question from populated assignment data
  const findQuestion = (submission, questionId) => {
    const asg = submission.assignmentId;
    if (!asg || !asg.questions) return null;
    return asg.questions.find((q) => q._id === questionId);
  };

  return (
    <div className="sub-container">
      <div className="sub-header">
        <h2>📊 My Submission History</h2>
        <p>Track your past test scores and performance.</p>
      </div>

      {loading && <div className="sub-loading">Loading records...</div>}

      {!loading && submissions.length === 0 && (
        <div className="sub-empty">
          <p>You haven't attempted any assignments yet.</p>
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div className="sub-table-wrapper">
          <table className="sub-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Date Attempted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const title = sub.assignmentId?.title || "Unknown Assignment";
                const subject = sub.assignmentId?.subject || "N/A";
                const totalMarks = sub.assignmentId?.totalMarks || 0;

                return (
                  <tr key={sub._id}>
                    <td className="fw-bold text-dark">{title}</td>
                    <td>
                      <span className="sub-badge">{subject}</span>
                    </td>
                    <td>
                      <div className="score-display">
                        {sub.evaluationStatus === "pending-review" ? (
                          <span
                            className="score-val"
                            style={{ fontSize: "0.9rem", color: "#6b7280" }}
                          >
                            To be evaluated
                          </span>
                        ) : (
                          <>
                            <span className="score-val">{sub.finalScore}</span>
                            {totalMarks > 0 && (
                              <span className="score-total">
                                {" "}
                                / {totalMarks}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-muted">{formatDate(sub.createdAt)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          sub.evaluationStatus === "pending-review"
                            ? "warning"
                            : sub.evaluationStatus === "reviewed"
                              ? "success"
                              : "success"
                        }`}
                      >
                        {sub.evaluationStatus === "pending-review"
                          ? "⏳ Pending Review"
                          : sub.evaluationStatus === "reviewed"
                            ? "✅ Reviewed"
                            : "✅ Auto-Graded"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="sub-view-btn"
                        onClick={() => openFeedback(sub._id)}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {modalLoading &&
        ReactDOM.createPortal(
          <div className="sub-modal-overlay">
            <div className="sub-modal-loading">
              Loading submission details...
            </div>
          </div>,
          document.body,
        )}

      {/* FEEDBACK MODAL */}
      {selectedSubmission &&
        ReactDOM.createPortal(
          <div className="sub-modal-overlay" onClick={closeFeedback}>
            <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sub-modal-header">
                <h3>📝 Submission Details</h3>
                <button className="sub-modal-close" onClick={closeFeedback}>
                  ✕
                </button>
              </div>

              {/* Score Summary */}
              <div className="sub-modal-scores">
                {selectedSubmission.evaluationStatus === "pending-review" ? (
                  <span className="sub-modal-score-chip highlight">
                    Final Score: <strong>To be evaluated</strong>
                  </span>
                ) : (
                  <>
                    <span className="sub-modal-score-chip">
                      Auto Score:{" "}
                      <strong>{selectedSubmission.autoScore}</strong>
                    </span>
                    <span className="sub-modal-score-chip">
                      Manual Score:{" "}
                      <strong>{selectedSubmission.manualScore}</strong>
                    </span>
                    <span className="sub-modal-score-chip highlight">
                      Final Score:{" "}
                      <strong>{selectedSubmission.finalScore}</strong>
                    </span>
                  </>
                )}
                <span
                  className={`status-badge ${
                    selectedSubmission.evaluationStatus === "pending-review"
                      ? "warning"
                      : selectedSubmission.evaluationStatus === "reviewed"
                        ? "success"
                        : "success"
                  }`}
                >
                  {selectedSubmission.evaluationStatus === "pending-review"
                    ? "⏳ Pending Review"
                    : selectedSubmission.evaluationStatus === "reviewed"
                      ? "✅ Reviewed"
                      : "✅ Auto-Graded"}
                </span>
              </div>

              {/* Questions & Answers */}
              <div className="sub-modal-questions">
                {selectedSubmission.answers.map((ans, i) => {
                  const question = findQuestion(
                    selectedSubmission,
                    ans.questionId,
                  );
                  const qType = question?.type || "unknown";
                  const isManual = qType === "short" || qType === "essay";
                  const maxMarks = question?.marks || 1;

                  return (
                    <div
                      key={i}
                      className={`sub-modal-question-card ${isManual ? "manual" : "auto"}`}
                    >
                      <div className="sub-modal-question-header">
                        <strong>
                          Q{i + 1}: {question?.questionText || "Question"}
                        </strong>
                        <span
                          className={`sub-modal-type-badge ${isManual ? "manual-badge" : "auto-badge"}`}
                        >
                          {qType.toUpperCase()} • {maxMarks} mark
                          {maxMarks > 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="sub-modal-answer">
                        <strong>Your Answer:</strong>{" "}
                        {ans.answer || (
                          <em className="no-answer">No answer provided</em>
                        )}
                      </p>

                      {/* For auto-graded questions: show correct/incorrect */}
                      {!isManual && (
                        <p
                          className={`sub-modal-result ${ans.isCorrect ? "correct" : "incorrect"}`}
                        >
                          {ans.isCorrect
                            ? `✅ Correct (+${ans.marksAwarded})`
                            : `❌ Incorrect (0/${maxMarks})`}
                        </p>
                      )}

                      {/* For auto-graded: show expected answer if wrong */}
                      {!isManual &&
                        !ans.isCorrect &&
                        question?.correctAnswer && (
                          <p className="sub-modal-expected">
                            <strong>Expected Answer:</strong>{" "}
                            {question.correctAnswer}
                          </p>
                        )}

                      {/* For manually graded: show marks awarded */}
                      {isManual && (
                        <div className="sub-modal-grading-result">
                          <span className="sub-modal-marks">
                            Marks:{" "}
                            <strong>
                              {selectedSubmission.evaluationStatus ===
                              "pending-review"
                                ? "To be evaluated"
                                : ans.marksAwarded}
                            </strong>
                            {selectedSubmission.evaluationStatus !==
                              "pending-review" && ` / ${maxMarks}`}
                          </span>
                        </div>
                      )}

                      {/* AI Evaluation feedback for essay questions */}
                      {qType === "essay" &&
                        ans.aiMarksAwarded !== null &&
                        ans.aiMarksAwarded !== undefined && (
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #eff6ff, #dbeafe)",
                              border: "1px solid #93c5fd",
                              borderRadius: "8px",
                              padding: "10px",
                              marginTop: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#1d4ed8",
                                fontSize: "0.85rem",
                              }}
                            >
                              🤖 AI Evaluation: {ans.aiMarksAwarded} /{" "}
                              {maxMarks}
                            </span>
                            {ans.aiFeedback && (
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  color: "#4b5563",
                                  fontSize: "0.82rem",
                                  lineHeight: "1.4",
                                }}
                              >
                                {ans.aiFeedback}
                              </p>
                            )}
                          </div>
                        )}

                      {/* Teacher comment for this question */}
                      {ans.teacherComment && (
                        <div className="sub-modal-teacher-comment">
                          <span className="comment-label">
                            💬 Teacher's Feedback:
                          </span>
                          <p>{ans.teacherComment}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall Teacher Feedback */}
              {selectedSubmission.teacherFeedback && (
                <div className="sub-modal-overall-feedback">
                  <h4>📋 Overall Teacher Feedback</h4>
                  <p>{selectedSubmission.teacherFeedback}</p>
                </div>
              )}

              {/* AI Feedback (if any) */}
              {selectedSubmission.aiFeedback && (
                <div className="sub-modal-ai-feedback">
                  <h4>🤖 AI Feedback</h4>
                  <p>{selectedSubmission.aiFeedback}</p>
                </div>
              )}

              <div className="sub-modal-footer">
                <button className="sub-modal-close-btn" onClick={closeFeedback}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default StudentSubmissions;
