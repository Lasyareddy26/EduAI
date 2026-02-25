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

# Resource Database (Static for now, but dynamic in real apps)
RESOURCE_MAP = {
    "beginner": ["Basics Video 101", "Introductory Article", "Easy Quiz"],
    "intermediate": ["Deep Dive Webinar", "Practice Exercises", "Case Studies"],
    "advanced": ["Research Paper", "Complex Project", "Master Class"]
}

@app.post("/predict-path")
def predict_learning_path(data: StudentPerformance):
    # 1. Calculate Percentage
    if data.total_marks == 0:
        percentage = 0
    else:
        percentage = (data.score / data.total_marks) * 100
    
    # 2. Predict Level using ML Model
    # The model expects a 2D array [[percentage]]
    prediction = model.predict([[percentage]])
    difficulty_level = prediction[0] # "beginner", "intermediate", or "advanced"
    
    # 3. Get Recommendations
    resources = RESOURCE_MAP.get(difficulty_level, [])
    
    return {
        "subject": data.subject,
        "topic": data.topic,
        "predicted_difficulty": difficulty_level,
        "recommended_resources": resources,
        "ai_message": f"Based on your score of {percentage:.1f}%, we recommend {difficulty_level} level resources."
    }