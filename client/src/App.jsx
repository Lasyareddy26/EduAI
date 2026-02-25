import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Common Components
import RootLayout from "./components/common/RootLayout";
import Register from "./components/common/Register";
import Login from "./components/common/Login";
import Home from "./components/common/Home";
import ViewAssignments from "./components/common/ViewAssignments"; // Shared by Student & Teacher
import LearningCard from "./components/common/LearningCard"; // For Student Learning Path
import Resourcecard from "./components/common/Resourcecard"; // For Student Resources\

// Student Components
import Studentprofile from "./components/student/Studentprofile"; // Note: lowercase 'p' in file name
import StudentSubmissions from "./components/student/StudentSubmissions";
import SubmitAssignment from "./components/student/SubmitAssignment";
import StudentList from "./components/teacher/StudentList";
import StudentAssignments from "./components/student/StudentAssignments";
import StudentLearningPath from "./components/student/StudentLearningPath";
import StudentDashboard from "./components/student/StudentDashboard";

// Teacher Components
import TeacherProfile from "./components/teacher/TeacherProfile";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import CreateAssignment from "./components/teacher/CreateAssignment";
import AssignmentSubmissions from "./components/teacher/AssignmentSubmissions";
import StudentAnalytics from "./components/teacher/StudentAnalytics";

function App() {
  const createBrowserRouterObj = createBrowserRouter([
    {
      path: "",
      element: <RootLayout />,
      children: [
        // PUBLIC ROUTES
        {
          path: "",
          element: <Home />,
        },
        {
          path: "register",
          element: <Register />,
        },
        {
          path: "login",
          element: <Login />,
        },

        // STUDENT ROUTES
        {
          path: "student-profile/:email",
          element: <Studentprofile />,
          children: [
            // INDEX ROUTE: Dashboard shown when no sub-route is active
            {
              index: true,
              element: <StudentDashboard />,
            },
            // Matches: GET /assignments
            {
              path: "assignments",
              element: <ViewAssignments />,
            },
            {
              path: "available-assignments",
              element: <StudentAssignments />,
            },
            {
              path: "submit/:assignmentId",
              element: <SubmitAssignment />,
            },
            // Matches: GET /my-submissions/:studentId
            {
              path: "my-submissions",
              element: <StudentSubmissions />,
            },
            // Matches: GET /learning-path/:studentId
            {
              path: "learning-path",
              element: <StudentLearningPath />,
            },
            // Matches: GET /resources/:subject/:topic
            {
              path: "resources",
              element: <Resourcecard />,
            },
          ],
        },

        // TEACHER ROUTES
        {
          path: "teacher-profile/:email",
          element: <TeacherProfile />,
          children: [
            // INDEX ROUTE: Dashboard shown when no sub-route is active
            {
              index: true,
              element: <TeacherDashboard />,
            },
            // Matches: GET /assignments (Teacher view)
            {
              path: "assignments",
              element: <ViewAssignments />,
            },
            // Matches: POST /create-assignment
            {
              path: "create-assignment",
              element: <CreateAssignment />,
            },
            {
              path: "student-directory",
              element: <StudentList />,
            },
            // Matches: GET /view-submissions/:assignmentId
            {
              path: "submissions/:assignmentId",
              element: <AssignmentSubmissions />,
            },
            // Matches: GET /ai-suggestion/:studentId
            {
              path: "student-analytics/:studentId",
              element: <StudentAnalytics />,
            },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={createBrowserRouterObj} />;
}

export default App;
