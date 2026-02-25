# ml_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Load the trained model
try:
    model = joblib.load("learning_path_model.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# Define Request Structure
class StudentPerformance(BaseModel):
    subject: str
    topic: str
    score: float
    total_marks: float

# ─── Rich Resource Database (topic-aware) ───
RESOURCE_MAP = {
    "beginner": {
        "resources": [
            {"title": "📖 Concept Basics – Introduction Guide", "type": "article", "url": "#", "duration": "15 min"},
            {"title": "🎬 Visual Explainer Video", "type": "video", "url": "#", "duration": "20 min"},
            {"title": "📝 Fundamentals Practice Quiz", "type": "quiz", "url": "#", "duration": "10 min"},
        ],
        "roadmap": [
            {"step": 1, "title": "Understand Core Concepts", "description": "Read through the fundamentals and build a strong base.", "status": "current"},
            {"step": 2, "title": "Watch Visual Explanations", "description": "Visual learning helps solidify abstract ideas.", "status": "upcoming"},
            {"step": 3, "title": "Attempt Easy Practice Problems", "description": "Start with low-difficulty questions to gain confidence.", "status": "upcoming"},
            {"step": 4, "title": "Review Mistakes & Revisit", "description": "Go through your errors and understand why they happened.", "status": "upcoming"},
            {"step": 5, "title": "Take a Checkpoint Quiz", "description": "Test yourself with a beginner-level assessment.", "status": "upcoming"},
        ]
    },
    "intermediate": {
        "resources": [
            {"title": "📚 In-Depth Study Material", "type": "article", "url": "#", "duration": "25 min"},
            {"title": "🧪 Hands-on Practice Exercises", "type": "practice", "url": "#", "duration": "30 min"},
            {"title": "🎥 Advanced Concept Walkthrough", "type": "video", "url": "#", "duration": "25 min"},
        ],
        "roadmap": [
            {"step": 1, "title": "Revisit Weak Areas", "description": "Identify specific concepts you got wrong and review them.", "status": "completed"},
            {"step": 2, "title": "Deep Dive into Key Topics", "description": "Go beyond surface-level understanding.", "status": "current"},
            {"step": 3, "title": "Solve Application-Based Problems", "description": "Practice questions that test real understanding.", "status": "upcoming"},
            {"step": 4, "title": "Peer Discussion & Collaboration", "description": "Discuss tricky concepts with classmates.", "status": "upcoming"},
            {"step": 5, "title": "Take an Intermediate Assessment", "description": "Evaluate your progress with a mid-level test.", "status": "upcoming"},
        ]
    },
    "advanced": {
        "resources": [
            {"title": "🔬 Research-Level Reading", "type": "article", "url": "#", "duration": "30 min"},
            {"title": "🏗️ Build a Mini Project", "type": "project", "url": "#", "duration": "60 min"},
            {"title": "🏆 Challenge Problems", "type": "practice", "url": "#", "duration": "40 min"},
        ],
        "roadmap": [
            {"step": 1, "title": "Master Core Concepts", "description": "You have a strong base – refine your understanding.", "status": "completed"},
            {"step": 2, "title": "Tackle Complex Problems", "description": "Push yourself with higher-order thinking questions.", "status": "completed"},
            {"step": 3, "title": "Explore Real-World Applications", "description": "See how this topic applies in industry or research.", "status": "current"},
            {"step": 4, "title": "Build a Mini Project", "description": "Apply everything you've learned in a practical project.", "status": "upcoming"},
            {"step": 5, "title": "Mentor & Teach Others", "description": "Teaching is the best way to solidify mastery.", "status": "upcoming"},
        ]
    }
}

TIPS_MAP = {
    "beginner": "💡 Don't rush! Focus on understanding the 'why' behind each concept before moving on.",
    "intermediate": "💡 You're making great progress! Try explaining concepts to a friend to deepen your understanding.",
    "advanced": "💡 Excellent work! Consider exploring competitive/research-level problems to push your boundaries.",
}


@app.post("/predict-path")
def predict_learning_path(data: StudentPerformance):
    # 1. Calculate Percentage
    if data.total_marks == 0:
        percentage = 0
    else:
        percentage = (data.score / data.total_marks) * 100
    
    # 2. Predict Level using ML Model
    prediction = model.predict([[percentage]])
    difficulty_level = prediction[0]  # "beginner", "intermediate", or "advanced"
    
    # 3. Get rich resources and roadmap
    level_data = RESOURCE_MAP.get(difficulty_level, RESOURCE_MAP["beginner"])
    tip = TIPS_MAP.get(difficulty_level, "")
    
    # 4. Personalize resource titles with topic name
    personalized_resources = []
    for r in level_data["resources"]:
        personalized_resources.append({
            **r,
            "title": r["title"].replace("Concept Basics", f"{data.topic} Basics")
                                .replace("Visual Explainer", f"{data.topic} Explainer")
                                .replace("Fundamentals Practice", f"{data.topic} Fundamentals")
                                .replace("In-Depth Study", f"{data.topic} Deep Dive")
                                .replace("Hands-on Practice", f"{data.topic} Practice")
                                .replace("Advanced Concept", f"{data.topic} Advanced")
                                .replace("Research-Level", f"{data.topic} Research")
                                .replace("Build a Mini", f"Build a {data.topic} Mini")
                                .replace("Challenge Problems", f"{data.topic} Challenges")
        })
    
    # Personalize roadmap
    personalized_roadmap = []
    for node in level_data["roadmap"]:
        personalized_roadmap.append({
            **node,
            "description": node["description"]
        })
    
    return {
        "subject": data.subject,
        "topic": data.topic,
        "score_percentage": round(percentage, 1),
        "predicted_difficulty": difficulty_level,
        "resources": personalized_resources,
        "roadmap": personalized_roadmap,
        "tip": tip,
        "ai_message": f"Based on your score of {percentage:.1f}% in {data.topic}, you're at the {difficulty_level} level."
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "learning_path_model.pkl"}