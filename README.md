# 🎓 EduAI — AI-Powered Personalized Learning Platform

<div align="center">

![EduAI Banner](https://img.shields.io/badge/EduAI-Intelligent%20Learning-7b2cbf?style=for-the-badge&logo=graduation-cap)

**An intelligent full-stack education platform that leverages AI and Machine Learning to deliver personalized learning experiences for students while empowering teachers with smart tools.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-ML%20Service-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)

[Features](#-key-features) • [Architecture](#-system-architecture) • [Tech Stack](#-technology-stack) • [Installation](#-installation) • [Demo](#-demo-video) • [API](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Demo Video](#-demo-video)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🌟 Overview

**EduAI** is a comprehensive education platform that transforms traditional learning by integrating artificial intelligence at every step. The platform provides:

- **For Students**: Personalized AI-generated learning paths, interactive quizzes, progress tracking, and a multilingual AI chatbot assistant
- **For Teachers**: AI-powered question generation, automated grading, student analytics, and RAG-based content extraction from PDFs

The system uses a **Decision Tree ML model** to analyze student performance and dynamically generate customized learning roadmaps with curated resources from platforms like YouTube, Khan Academy, Coursera, and more.

---

## ✨ Key Features

### 🎯 Student Features

| Feature | Description |
|---------|-------------|
| **📊 Interactive Dashboard** | Real-time overview of scores, submissions, deadlines, and performance analytics |
| **🤖 AI Learning Paths** | ML-powered personalized study roadmaps generated based on quiz performance |
| **📚 Smart Resources** | Curated learning resources (videos, articles, practice problems) tailored to skill level |
| **✅ Assignment Submissions** | Submit assignments with auto-grading for MCQs and manual review for essays |
| **🗺️ Progress Tracking** | Visual roadmap with clickable steps to mark progress |
| **💬 Multilingual AI Chatbot** | Gemini-powered assistant that speaks 14+ languages and provides personalized study guidance |

### 👨‍🏫 Teacher Features

| Feature | Description |
|---------|-------------|
| **📝 AI Question Generator** | Generate MCQs, True/False, Fill-in-the-blank questions using Groq LLM |
| **📄 RAG PDF Processing** | Upload PDFs and extract questions using LangChain + ChromaDB |
| **📊 Student Analytics** | Detailed performance insights, submission tracking, and class-wide statistics |
| **✏️ Manual Grading** | Review and grade essay/short-answer questions with AI-assisted feedback |
| **📋 Assignment Management** | Create, edit, and manage assignments with multiple question types |

### 🧠 AI/ML Capabilities

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Learning Path Predictor** | scikit-learn Decision Tree | Classifies students into beginner/intermediate/advanced levels |
| **Question Generator** | Groq LLaMA 3.1 | Generates contextual MCQ questions |
| **RAG System** | LangChain + ChromaDB + Gemini | Extracts questions from uploaded PDF content |
| **AI Chatbot** | Google Gemini 1.5 Flash | Multilingual conversational assistant with student context |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EduAI Architecture                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   Student    │         │   Teacher    │         │    Admin     │
    │   Browser    │         │   Browser    │         │   Browser    │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        FRONTEND (React + Vite)                          │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
    │  │  Dashboard  │  │ Assignments │  │  Learning   │  │   Chatbot   │    │
    │  │  Components │  │  Submission │  │    Paths    │  │   Widget    │    │
    │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
    │                                                                         │
    │  Authentication: Clerk (OAuth, Session Management)                      │
    └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (HTTP/JSON)
                                    ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                    BACKEND (Express.js + Node.js)                       │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │                         API Layer                                 │  │
    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
    │  │  │ Student  │  │ Teacher  │  │ Chatbot  │  │ Authentication   │ │  │
    │  │  │   API    │  │   API    │  │   API    │  │    Middleware    │ │  │
    │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │  │
    │  └──────────────────────────────────────────────────────────────────┘  │
    │                                    │                                    │
    │  ┌─────────────────────────────────┼─────────────────────────────────┐ │
    │  │                    Service Layer                                   │ │
    │  │  • Auto-Grading Engine (MCQ/TrueFalse/FillBlank)                  │ │
    │  │  • ML Service Integration (Learning Path Prediction)              │ │
    │  │  • RAG Service Integration (PDF Question Extraction)              │ │
    │  │  • Gemini AI Integration (Chatbot)                                │ │
    │  │  • Groq LLM Integration (Question Generation)                     │ │
    │  └───────────────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────────────────┘
           │                        │                        │
           │                        │                        │
           ▼                        ▼                        ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   MongoDB    │         │  ML Service  │         │ RAG Service  │
    │   Atlas      │         │   (FastAPI)  │         │   (Flask)    │
    │              │         │              │         │              │
    │ Collections: │         │ • Decision   │         │ • LangChain  │
    │ • users      │         │   Tree Model │         │ • ChromaDB   │
    │ • assignments│         │ • Resource   │         │ • Gemini     │
    │ • submissions│         │   Generator  │         │ • PDF Parser │
    │ • learningpaths│       │ • Roadmap    │         │              │
    └──────────────┘         │   Builder    │         └──────────────┘
                             └──────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        External Services                                 │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
    │  │  Clerk  │  │  Groq   │  │ Gemini  │  │ YouTube │  │  Khan   │       │
    │  │  Auth   │  │   LLM   │  │   AI    │  │  API    │  │ Academy │       │
    │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
    └─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Student Submits Assignment
         │
         ▼
┌─────────────────────┐
│  Express Backend    │
│  (Auto-Grading)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  MongoDB            │────▶│  ML Service         │
│  (Store Submission) │     │  (Predict Level)    │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │  Generate:          │
                            │  • Difficulty Level │
                            │  • Learning Roadmap │
                            │  • Curated Resources│
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │  Store Learning     │
                            │  Path in MongoDB    │
                            └─────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Component Library |
| **Vite** | 6.x | Build Tool & Dev Server |
| **React Router** | 7.x | Client-side Routing |
| **Axios** | 1.x | HTTP Client |
| **Clerk React** | 5.x | Authentication UI |
| **CSS3** | - | Custom Styling (No framework) |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript Runtime |
| **Express.js** | 4.x | Web Framework |
| **Mongoose** | 8.x | MongoDB ODM |
| **Multer** | 1.x | File Upload Handling |
| **Groq SDK** | 0.x | LLM API Client |
| **Google Generative AI** | 0.x | Gemini API Client |

### ML Service (Python)

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115.x | Async Web Framework |
| **scikit-learn** | 1.x | Machine Learning |
| **joblib** | 1.x | Model Serialization |
| **NumPy** | 2.x | Numerical Computing |
| **Uvicorn** | 0.34.x | ASGI Server |

### RAG Service (Python)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.x | Web Framework |
| **LangChain** | 0.3.x | LLM Orchestration |
| **ChromaDB** | 0.6.x | Vector Database |
| **PyPDF** | 5.x | PDF Processing |
| **Google Generative AI** | 0.8.x | Embeddings & LLM |

### Database & Cloud

| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Cloud Database |
| **Clerk** | Authentication Provider |
| **Groq Cloud** | LLM API (LLaMA 3.1) |
| **Google AI Studio** | Gemini API |

---

## 📦 Installation

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.10 or higher | [python.org](https://www.python.org/) |
| **MongoDB** | Atlas (cloud) | [mongodb.com/atlas](https://www.mongodb.com/atlas) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| **Clerk** | Authentication | [clerk.com](https://clerk.com/) |
| **Groq** | Question Generation | [console.groq.com](https://console.groq.com/) |
| **Google Gemini** | Chatbot & RAG | [aistudio.google.com](https://aistudio.google.com/apikey) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/Lasyareddy26/EduAI.git
cd EduAI
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../client
npm install
```

### Step 4: Install ML Service Dependencies

```bash
cd ../ml_service
pip install -r requirements.txt
```

### Step 5: Install RAG Service Dependencies

```bash
cd ../rag_service
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

### Server (`server/.env`)

```env
# Database
DBURL=mongodb+srv://<username>:<password>@cluster.mongodb.net/eduai

# Server
PORT=3000

# AI Services
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# RAG Service
RAG_SERVICE_URL=http://localhost:5001
```

### Client (`client/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

### RAG Service (`rag_service/.env`)

```env
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Running the Application

### Option 1: Run All Services (Recommended)

Open **4 terminal windows** and run each service:

**Terminal 1 - Backend Server:**
```bash
cd server
node server.js
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd client
npm run dev
```

**Terminal 3 - ML Service:**
```bash
cd ml_service
uvicorn main:app --reload --port 8000
```

**Terminal 4 - RAG Service:**
```bash
cd rag_service
python app.py
```

### Option 2: Using VS Code Tasks

If you have VS Code, use the pre-configured task:

```
Ctrl+Shift+P → Tasks: Run Task → Backend Server (port 3000)
```

### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000 |
| **ML Service** | http://localhost:8000 |
| **RAG Service** | http://localhost:5001 |

---

## 🎬 Demo Video

<!-- Add your demo video here -->
<div align="center">

### 📹 Watch the Full Demo

[![EduAI Demo](https://img.shields.io/badge/▶️%20Watch%20Demo-YouTube-red?style=for-the-badge&logo=youtube)](YOUR_YOUTUBE_LINK_HERE)

**Coming Soon!**

*A comprehensive video walkthrough showcasing all features of the EduAI platform.*

</div>

---

## 📡 API Documentation

### Student API (`/student-api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/student` | Create student account |
| `GET` | `/assignments` | Get all assignments |
| `GET` | `/my-submissions/:studentId` | Get student's submissions |
| `POST` | `/submit-assignment` | Submit an assignment |
| `GET` | `/learning-path/:studentId` | Get AI learning paths |
| `POST` | `/regenerate-learning-path` | Regenerate single learning path |
| `POST` | `/regenerate-all-learning-paths/:studentId` | Bulk regenerate all paths |
| `PUT` | `/learning-path/:pathId/toggle-step/:stepIndex` | Toggle roadmap step |

### Teacher API (`/teacher-api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/teacher` | Create teacher account |
| `POST` | `/assignment` | Create assignment |
| `GET` | `/assignments/:teacherEmail` | Get teacher's assignments |
| `POST` | `/generate-questions` | AI generate questions |
| `POST` | `/upload-pdf` | Upload PDF for RAG |
| `POST` | `/rag-generate-questions` | Generate questions from PDF |
| `GET` | `/submissions/:assignmentId` | Get assignment submissions |
| `PUT` | `/grade-submission/:submissionId` | Grade a submission |

### Chatbot API (`/chatbot-api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message to AI chatbot |
| `POST` | `/clear` | Clear conversation history |

### ML Service API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict-path` | Predict learning path from score |
| `GET` | `/health` | Health check |

---

## 📁 Project Structure

```
EduAI/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Shared components
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Chatbot.jsx      # AI Chatbot widget
│   │   │   │   ├── Home.jsx
│   │   │   │   └── RootLayout.jsx
│   │   │   ├── student/             # Student dashboard
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── StudentLearningPath.jsx
│   │   │   │   ├── StudentAssignments.jsx
│   │   │   │   └── StudentSubmissions.jsx
│   │   │   └── teacher/             # Teacher dashboard
│   │   │       ├── TeacherDashboard.jsx
│   │   │       ├── CreateAssignment.jsx
│   │   │       └── StudentAnalytics.jsx
│   │   ├── contexts/                # React Context
│   │   └── App.jsx                  # Routes
│   └── package.json
│
├── server/                          # Express Backend
│   ├── APIs/
│   │   ├── studentApi.js            # Student endpoints
│   │   ├── teacherApi.js            # Teacher endpoints
│   │   └── chatbotApi.js            # Chatbot endpoints
│   ├── Models/
│   │   ├── Assignment.js
│   │   ├── submission.js
│   │   ├── LearningPath.js
│   │   └── studentTeacherModel.js
│   ├── server.js                    # Entry point
│   └── package.json
│
├── ml_service/                      # Python ML Microservice
│   ├── main.py                      # FastAPI app
│   ├── train_model.py               # Model training script
│   ├── learning_path_model.pkl      # Trained model
│   └── requirements.txt
│
├── rag_service/                     # Python RAG Microservice
│   ├── app.py                       # Flask app
│   ├── db/                          # ChromaDB storage
│   ├── uploads/                     # Uploaded PDFs
│   └── requirements.txt
│
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👩‍💻 Author

**Lasya Reddy**

- GitHub: [@Lasyareddy26](https://github.com/Lasyareddy26)

---

<div align="center">

**Built with ❤️ for the future of education**

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![Powered by AI](https://img.shields.io/badge/Powered%20by-AI-7b2cbf?style=flat-square&logo=openai)

</div>
