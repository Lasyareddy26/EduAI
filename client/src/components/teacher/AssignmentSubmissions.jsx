import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AssignmentSubmissions.css";

function AssignmentSubmissions() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, highest: 0 });
  const [gradingSubmission, setGradingSubmission] = useState(null); // which submission is being graded
  const [gradingData, setGradingData] = useState({}); // { questionId: { marksAwarded, teacherComment } }
  const [teacherFeedback, setTeacherFeedback] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = () => {
    axios
      .get(`http://localhost:3000/teacher-api/view-submissions/${assignmentId}`)
      .then((res) => {
        const data = res.data.payload;
        setSubmissions(data);
        calculateStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching submissions:", err);
        setLoading(false);
      });
  };

  const calculateStats = (data) => {
    if (data.length === 0) return;
    const totalScore = data.reduce((acc, s) => acc + (s.finalScore || 0), 0);
    const maxScore = Math.max(...data.map((s) => s.finalScore || 0));
    setStats({
      average: (totalScore / data.length).toFixed(1),
      highest: maxScore,
    });
  };

  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Open the grading panel for a submission
  const openGrading = (sub) => {
    setGradingSubmission(sub);
    setTeacherFeedback(sub.teacherFeedback || "");
    // Pre-fill existing marks
    const initial = {};
    sub.answers.forEach((a) => {
      initial[a.questionId] = {
        marksAwarded: a.marksAwarded || 0,
        teacherComment: a.teacherComment || "",
      };
    });
    setGradingData(initial);
  };

  const closeGrading = () => {
    setGradingSubmission(null);
    setGradingData({});
    setTeacherFeedback("");
  };

  const handleGradeChange = (qId, field, value) => {
    setGradingData((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value },
    }));
  };

  const submitGrading = async () => {
    try {
      const answersToGrade = Object.entries(gradingData).map(
        ([questionId, data]) => ({
          questionId,
          marksAwarded: Number(data.marksAwarded) || 0,
          teacherComment: data.teacherComment || "",
        }),
      );

      await axios.put(
        `http://localhost:3000/teacher-api/grade-submission/${gradingSubmission._id}`,
        {
          answers: answersToGrade,
          teacherFeedback,
        },
      );

      alert("✅ Submission graded successfully!");
      closeGrading();
      fetchSubmissions(); // refresh data
    } catch (err) {
      console.error("Grading Error:", err);
      alert("Failed to save grades");
    }
  };

  // Find a question from the populated assignment data
  const findQuestion = (sub, questionId) => {
    const asg = sub.assignmentId; // populated
    if (!asg || !asg.questions) return null;
    return asg.questions.find((q) => q._id === questionId);
  };

  const statusBadge = (status) => {
    const styles = {
      "auto-complete": {
        bg: "#dcfce7",
        color: "#166534",
        text: "✅ Auto-Graded",
      },
      "pending-review": {
        bg: "#fef3c7",
        color: "#92400e",
        text: "⏳ Needs Review",
      },
      reviewed: { bg: "#dbeafe", color: "#1e40af", text: "✅ Reviewed" },
    };
    const s = styles[status] || styles["auto-complete"];
    return (
      <span
        style={{
          background: s.bg,
          color: s.color,
          padding: "3px 10px",
          borderRadius: "12px",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {s.text}
      </span>
    );
  };

  return (
    <div className="as-container">
      <div className="as-header">
        <button className="as-back-btn" onClick={() => navigate(-1)}>
          ← Back to Assignments
        </button>
        <h2 className="as-title">Student Submissions</h2>
      </div>

      <div className="as-stats-row">
        <div className="as-stat-card">
          <span className="as-stat-label">Total Submissions</span>
          <span className="as-stat-value">{submissions.length}</span>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Class Average</span>
          <span className="as-stat-value">{stats.average}</span>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Highest Score</span>
          <span className="as-stat-value text-green">{stats.highest}</span>
        </div>
      </div>

      <div className="as-table-wrapper">
        {loading ? (
          <p className="as-loading">Loading submission data...</p>
        ) : submissions.length === 0 ? (
          <div className="as-empty">
            <p>No students have submitted this assignment yet.</p>
          </div>
        ) : (
          <table className="as-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email ID</th>
                <th>Date Submitted</th>
                <th className="text-center">Status</th>
                <th className="text-right">Score</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id}>
                  <td>
                    <div className="as-student-info">
                      <div className="as-avatar">
                        {sub.studentId?.firstName?.charAt(0) || "S"}
                      </div>
                      <span className="as-name">
                        {sub.studentId?.firstName} {sub.studentId?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="as-email">{sub.studentId?.email}</td>
                  <td className="as-date">{formatDate(sub.createdAt)}</td>
                  <td className="text-center">
                    {statusBadge(sub.evaluationStatus)}
                  </td>
                  <td className="as-score text-right">
                    <span className="as-score-badge">
                      {sub.evaluationStatus === "pending-review"
                        ? "Pending"
                        : sub.finalScore !== undefined
                          ? sub.finalScore
                          : "N/A"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="as-view-btn"
                      onClick={() => openGrading(sub)}
                    >
                      {sub.evaluationStatus === "pending-review"
                        ? "✏️ Grade"
                        : "👁️ View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* GRADING MODAL */}
      {gradingSubmission && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                📝 {gradingSubmission.studentId?.firstName}{" "}
                {gradingSubmission.studentId?.lastName}'s Submission
              </h3>
              <button
                onClick={closeGrading}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: "#f3f4f6",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                Auto Score: <strong>{gradingSubmission.autoScore}</strong>
              </span>
              <span
                style={{
                  background: "#f3f4f6",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                Manual Score: <strong>{gradingSubmission.manualScore}</strong>
              </span>
              <span
                style={{
                  background: "#ede9fe",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                Final Score:{" "}
                <strong>
                  {gradingSubmission.evaluationStatus === "pending-review"
                    ? "Pending"
                    : gradingSubmission.finalScore}
                </strong>
              </span>
              {statusBadge(gradingSubmission.evaluationStatus)}
            </div>

            {gradingSubmission.answers.map((ans, i) => {
              const question = findQuestion(gradingSubmission, ans.questionId);
              const qType = question?.type || "unknown";
              const isManual = qType === "short" || qType === "essay";
              const maxMarks = question?.marks || 1;

              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "12px",
                    background: isManual ? "#fffbeb" : "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong style={{ fontSize: "0.9rem" }}>
                      Q{i + 1}: {question?.questionText || "Question"}
                    </strong>
                    <span
                      style={{
                        background: isManual ? "#fbbf24" : "#a3e635",
                        color: "#000",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      {qType.toUpperCase()} • {maxMarks} mark
                      {maxMarks > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p style={{ margin: "5px 0", color: "#374151" }}>
                    <strong>Student's Answer:</strong>{" "}
                    {ans.answer || <em style={{ color: "#999" }}>No answer</em>}
                  </p>

                  {question?.correctAnswer && (
                    <p
                      style={{
                        margin: "5px 0",
                        color: "#059669",
                        fontSize: "0.9rem",
                      }}
                    >
                      <strong>Expected:</strong> {question.correctAnswer}
                    </p>
                  )}

                  {/* Auto-evaluated result */}
                  {!isManual && (
                    <p
                      style={{
                        margin: "5px 0",
                        fontWeight: 600,
                        color: ans.isCorrect ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {ans.isCorrect
                        ? `✅ Correct (+${ans.marksAwarded})`
                        : `❌ Incorrect (0/${maxMarks})`}
                    </p>
                  )}

                  {/* Manual grading fields */}
                  {isManual && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px dashed #d97706",
                      }}
                    >
                      {/* AI Suggested Score (only for essay with AI score) */}
                      {qType === "essay" &&
                        ans.aiMarksAwarded !== null &&
                        ans.aiMarksAwarded !== undefined && (
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #eff6ff, #dbeafe)",
                              border: "1px solid #93c5fd",
                              borderRadius: "10px",
                              padding: "12px",
                              marginBottom: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "6px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "#1d4ed8",
                                  fontSize: "0.9rem",
                                }}
                              >
                                🤖 AI Suggested Score
                              </span>
                              <span
                                style={{
                                  background: ans.aiFeedback?.includes("high")
                                    ? "#dcfce7"
                                    : ans.aiFeedback?.includes("low")
                                      ? "#fef3c7"
                                      : "#e0e7ff",
                                  color: "#374151",
                                  padding: "2px 8px",
                                  borderRadius: "8px",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                              >
                                {ans.aiMarksAwarded} / {maxMarks}
                              </span>
                            </div>
                            {ans.aiFeedback && (
                              <p
                                style={{
                                  margin: "4px 0 8px",
                                  color: "#4b5563",
                                  fontSize: "0.85rem",
                                  lineHeight: "1.4",
                                }}
                              >
                                💬 {ans.aiFeedback}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleGradeChange(
                                  ans.questionId,
                                  "marksAwarded",
                                  ans.aiMarksAwarded,
                                )
                              }
                              style={{
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              ✅ Accept AI Score ({ans.aiMarksAwarded}/
                              {maxMarks})
                            </button>
                          </div>
                        )}

                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          alignItems: "center",
                          marginBottom: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          Marks (0–{maxMarks}):
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flex: 1,
                            minWidth: "200px",
                          }}
                        >
                          <input
                            type="range"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={
                              gradingData[ans.questionId]?.marksAwarded || 0
                            }
                            onChange={(e) =>
                              handleGradeChange(
                                ans.questionId,
                                "marksAwarded",
                                e.target.value,
                              )
                            }
                            style={{ flex: 1, accentColor: "#7b2cbf" }}
                          />
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={
                              gradingData[ans.questionId]?.marksAwarded || 0
                            }
                            onChange={(e) => {
                              const val = Math.min(
                                maxMarks,
                                Math.max(0, Number(e.target.value) || 0),
                              );
                              handleGradeChange(
                                ans.questionId,
                                "marksAwarded",
                                val,
                              );
                            }}
                            style={{
                              width: "60px",
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              textAlign: "center",
                              fontWeight: 700,
                            }}
                          />
                          <span
                            style={{ fontSize: "0.85rem", color: "#6b7280" }}
                          >
                            /{maxMarks}
                          </span>
                        </div>
                      </div>
                      <textarea
                        placeholder="Optional feedback for this answer..."
                        rows={2}
                        value={
                          gradingData[ans.questionId]?.teacherComment || ""
                        }
                        onChange={(e) =>
                          handleGradeChange(
                            ans.questionId,
                            "teacherComment",
                            e.target.value,
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overall teacher feedback */}
            <div style={{ marginTop: "15px" }}>
              <label style={{ fontWeight: 600 }}>
                Overall Feedback (optional):
              </label>
              <textarea
                rows={3}
                placeholder="General comments for this student..."
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  marginTop: "5px",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={closeGrading}
                style={{
                  padding: "10px 25px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              {(gradingSubmission.evaluationStatus === "pending-review" ||
                gradingSubmission.evaluationStatus === "reviewed") && (
                <button
                  onClick={submitGrading}
                  style={{
                    padding: "10px 25px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#7b2cbf",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  💾 Save Grades
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentSubmissions;
