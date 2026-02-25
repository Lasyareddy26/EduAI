# 🎓 EduAI — AI-Powered Education Platform

EduAI is a full-stack education platform that uses AI to personalize learning paths for students. Teachers can create assignments, grade submissions with AI assistance, and track student analytics.

## 📁 Project Structure

```
EduAI/
├── client/          → React frontend (Vite + React 19)
├── server/          → Express.js backend (Node.js + MongoDB)
├── ml_service/      → Python ML microservice (FastAPI + scikit-learn)
└── rag_service/     → Python RAG microservice (Flask + LangChain + ChromaDB)
```

---

## ⚙️ Prerequisites

Make sure you have these installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **MongoDB** | Atlas (cloud) or local | [mongodb.com/atlas](https://www.mongodb.com/atlas) |
| **Git** | latest | [git-scm.com](https://git-scm.com/) |

You will also need accounts/API keys for:
- [**Clerk**](https://clerk.com/) — for authentication (free tier available)
- [**Groq**](https://console.groq.com/) — for AI grading (free API key)
- [**Google Gemini**](https://aistudio.google.com/apikey) — for AI features (optional)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Lasyareddy26/EduAI.git
cd EduAI
```

---

### 2. Set Up the Server (Backend)

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` folder:

```bash
touch .env
```

Add the following environment variables to `server/.env`:

```env
PORT=4000
DBURL=mongodb+srv://<your-username>:<your-password>@<your-cluster>.mongodb.net/eduai?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 **How to get these:**
> - **DBURL**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), then copy the connection string.
> - **GROQ_API_KEY**: Sign up at [console.groq.com](https://console.groq.com/) and generate an API key.
> - **GEMINI_API_KEY**: Get it from [Google AI Studio](https://aistudio.google.com/apikey).

Start the server:

```bash
node server.js
```

You should see:
```
connected to mongodb
server listening on port 4000
```

---

### 3. Set Up the Client (Frontend)

Open a **new terminal** and run:

```bash
cd client
npm install
```

Create a `.env` file inside the `client/` folder:

```bash
touch .env
```

Add the following to `client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

> 💡 **How to get this:**
> - Sign up at [clerk.com](https://clerk.com/), create an application, and copy the **Publishable Key** from the dashboard.

Start the frontend:

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

### 4. Set Up the ML Service (Python)

Open a **new terminal** and run:

```bash
cd ml_service
```

(Optional but recommended) Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
```

Install Python dependencies:

```bash
pip install fastapi uvicorn scikit-learn joblib numpy pandas
```

Train the ML model (first time only):

```bash
python3 train_model.py
```

Start the ML service:

```bash
uvicorn main:app --reload --port 8000
```

The ML API will be available at **http://localhost:8000**

---

### 5. Set Up the RAG Service (Question Generator from PDFs)

Open a **new terminal** and run:

```bash
cd rag_service
```

(Optional but recommended) Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `rag_service/` folder:

```bash
touch .env
```

Add the following to `rag_service/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the RAG service:

```bash
python3 app.py
```

The RAG service will be available at **http://localhost:5001**

---

## 🏃 Running Everything Together

You need **4 terminals** running simultaneously:

| Terminal | Directory | Command |
|----------|-----------|---------|
| Terminal 1 | `server/` | `node server.js` |
| Terminal 2 | `client/` | `npm run dev` |
| Terminal 3 | `ml_service/` | `uvicorn main:app --reload --port 8000` |
| Terminal 4 | `rag_service/` | `python3 app.py` |

---

## 🔑 Environment Variables Summary

### `server/.env`
```env
PORT=4000
DBURL=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
RAG_SERVICE_URL=http://localhost:5001
```

### `client/.env`
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### `rag_service/.env`
```env
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ **Never commit `.env` files to GitHub.** They are already in `.gitignore`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router, Bootstrap, Clerk Auth |
| Backend | Express.js, Mongoose, Groq SDK, Google Generative AI |
| RAG Service | Flask, LangChain, ChromaDB, HuggingFace Embeddings, Groq |
| ML Service | FastAPI, scikit-learn, joblib |
| Database | MongoDB Atlas |
| Auth | Clerk |

---

## 📌 Common Issues

| Issue | Solution |
|-------|----------|
| `DBURL` connection error | Make sure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all) or your current IP |
| Clerk auth not working | Double-check the `VITE_CLERK_PUBLISHABLE_KEY` in `client/.env` |
| ML model not found | Run `python3 train_model.py` in the `ml_service/` folder first |
| Port already in use | Kill the process on that port: `lsof -ti:4000 \| xargs kill` (replace 4000 with the port) |

---

## 📄 License

This project is for educational purposes.

---

Made with ❤️ by [Lasya Reddy](https://github.com/Lasyareddy26)
