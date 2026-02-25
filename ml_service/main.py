# ml_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from urllib.parse import quote_plus

app = FastAPI()

# Load the trained model
try:
    model = joblib.load("learning_path_model.pkl")
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")


# Define Request Structure
class StudentPerformance(BaseModel):
    subject: str
    topic: str
    score: float
    total_marks: float


# ============================================================
# RESOURCE GENERATORS
# Every URL is a SEARCH url on the platform, so it NEVER 404s.
# The search results page will always show relevant content
# for the exact topic.
# ============================================================

def _video_links(topic, subject, level):
    """YouTube search, Khan Academy search, Coursera search - always work."""
    yt_q = quote_plus(f"{topic} {subject} {level} explained tutorial")
    return [
        {
            "title": f"{topic} - YouTube Tutorial",
            "url": f"https://www.youtube.com/results?search_query={yt_q}",
            "source": "YouTube",
        },
        {
            "title": f"{topic} - Khan Academy",
            "url": f"https://www.khanacademy.org/search?referer=%2F&page_search_query={quote_plus(topic + ' ' + subject)}",
            "source": "Khan Academy",
        },
        {
            "title": f"Learn {topic} - Coursera",
            "url": f"https://www.coursera.org/search?query={quote_plus(topic + ' ' + subject)}",
            "source": "Coursera",
        },
        {
            "title": f"{topic} - MIT OpenCourseWare",
            "url": f"https://ocw.mit.edu/search/?q={quote_plus(topic)}",
            "source": "MIT OCW",
        },
    ]


def _article_links(topic, subject, level):
    """Wikipedia search, GFG search, Khan search, Medium search - always work."""
    return [
        {
            "title": f"{topic} - Wikipedia",
            "url": f"https://en.wikipedia.org/w/index.php?search={quote_plus(topic + ' ' + subject)}&title=Special%3ASearch",
            "source": "Wikipedia",
        },
        {
            "title": f"{topic} - GeeksForGeeks",
            "url": f"https://www.geeksforgeeks.org/search/{quote_plus(topic)}/",
            "source": "GeeksForGeeks",
        },
        {
            "title": f"{topic} - Khan Academy",
            "url": f"https://www.khanacademy.org/search?referer=%2F&page_search_query={quote_plus(topic)}",
            "source": "Khan Academy",
        },
        {
            "title": f"{topic} Articles - Medium",
            "url": f"https://medium.com/search?q={quote_plus(topic + ' ' + subject)}",
            "source": "Medium",
        },
        {
            "title": f"{topic} - Tutorialspoint",
            "url": f"https://www.tutorialspoint.com/search/{quote_plus(topic)}",
            "source": "Tutorialspoint",
        },
    ]


def _quiz_links(topic, subject, level):
    """Quizlet search, Khan search - always work."""
    return [
        {
            "title": f"{topic} Flashcards - Quizlet",
            "url": f"https://quizlet.com/search?query={quote_plus(topic + ' ' + subject)}&type=sets",
            "source": "Quizlet",
        },
        {
            "title": f"{topic} Quiz - Khan Academy",
            "url": f"https://www.khanacademy.org/search?referer=%2F&page_search_query={quote_plus(topic + ' quiz')}",
            "source": "Khan Academy",
        },
        {
            "title": f"{topic} Practice - Brainscape",
            "url": f"https://www.brainscape.com/subjects?q={quote_plus(topic)}",
            "source": "Brainscape",
        },
    ]


def _practice_links(topic, subject, level):
    """GFG search, HackerRank search, LeetCode search - always work."""
    return [
        {
            "title": f"{topic} Practice - GeeksForGeeks",
            "url": f"https://www.geeksforgeeks.org/search/{quote_plus(topic + ' practice problems')}/",
            "source": "GeeksForGeeks",
        },
        {
            "title": f"{topic} Exercises - HackerRank",
            "url": f"https://www.hackerrank.com/search?query={quote_plus(topic)}",
            "source": "HackerRank",
        },
        {
            "title": f"{topic} Problems - LeetCode",
            "url": f"https://leetcode.com/problemset/?search={quote_plus(topic)}",
            "source": "LeetCode",
        },
    ]


def _project_links(topic, subject, level):
    """GitHub search, freeCodeCamp search - always work."""
    return [
        {
            "title": f"{topic} Projects - GitHub",
            "url": f"https://github.com/search?q={quote_plus(topic + ' ' + subject)}&type=repositories",
            "source": "GitHub",
        },
        {
            "title": f"{topic} Guide - freeCodeCamp",
            "url": f"https://www.freecodecamp.org/news/search/?query={quote_plus(topic)}",
            "source": "freeCodeCamp",
        },
        {
            "title": f"{topic} Tutorials - Dev.to",
            "url": f"https://dev.to/search?q={quote_plus(topic + ' ' + subject)}",
            "source": "Dev.to",
        },
    ]


RESOURCE_GENERATORS = {
    "video":    _video_links,
    "article":  _article_links,
    "quiz":     _quiz_links,
    "practice": _practice_links,
    "project":  _project_links,
}


# --- What resource types to include per level, and how many from each ---
LEVEL_RESOURCE_CONFIG = {
    "beginner": [
        {"type": "article",  "pick": 2, "duration": "15 min"},
        {"type": "video",    "pick": 2, "duration": "20 min"},
        {"type": "quiz",     "pick": 1, "duration": "10 min"},
        {"type": "practice", "pick": 1, "duration": "20 min"},
    ],
    "intermediate": [
        {"type": "article",  "pick": 2, "duration": "25 min"},
        {"type": "video",    "pick": 1, "duration": "25 min"},
        {"type": "practice", "pick": 2, "duration": "30 min"},
        {"type": "quiz",     "pick": 1, "duration": "15 min"},
    ],
    "advanced": [
        {"type": "article",  "pick": 1, "duration": "30 min"},
        {"type": "video",    "pick": 1, "duration": "30 min"},
        {"type": "project",  "pick": 2, "duration": "60 min"},
        {"type": "practice", "pick": 2, "duration": "40 min"},
    ],
}


def build_resources(topic, subject, level):
    """Build a flat list of personalized resources with direct URLs."""
    configs = LEVEL_RESOURCE_CONFIG.get(level, LEVEL_RESOURCE_CONFIG["beginner"])
    result = []
    for cfg in configs:
        generator = RESOURCE_GENERATORS.get(cfg["type"])
        if not generator:
            continue
        links = generator(topic, subject, level)
        for link in links[: cfg["pick"]]:
            result.append({
                "title": link["title"],
                "type": cfg["type"],
                "url": link["url"],
                "source": link.get("source", ""),
                "duration": cfg["duration"],
            })
    return result


# --- Roadmap Templates (per level) ---
ROADMAP_TEMPLATES = {
    "beginner": [
        {"step": 1, "title": "Understand Core Concepts",       "description": "Read through the fundamentals and build a strong base."},
        {"step": 2, "title": "Watch Visual Explanations",      "description": "Visual learning helps solidify abstract ideas."},
        {"step": 3, "title": "Attempt Easy Practice Problems",  "description": "Start with low-difficulty questions to gain confidence."},
        {"step": 4, "title": "Review Mistakes & Revisit",       "description": "Go through your errors and understand why they happened."},
        {"step": 5, "title": "Take a Checkpoint Quiz",          "description": "Test yourself with a beginner-level assessment."},
    ],
    "intermediate": [
        {"step": 1, "title": "Revisit Weak Areas",              "description": "Identify specific concepts you got wrong and review them."},
        {"step": 2, "title": "Deep Dive into Key Topics",       "description": "Go beyond surface-level understanding."},
        {"step": 3, "title": "Solve Application-Based Problems", "description": "Practice questions that test real understanding."},
        {"step": 4, "title": "Peer Discussion & Collaboration",  "description": "Discuss tricky concepts with classmates."},
        {"step": 5, "title": "Take an Intermediate Assessment",  "description": "Evaluate your progress with a mid-level test."},
    ],
    "advanced": [
        {"step": 1, "title": "Master Core Concepts",            "description": "You have a strong base - refine your understanding."},
        {"step": 2, "title": "Tackle Complex Problems",         "description": "Push yourself with higher-order thinking questions."},
        {"step": 3, "title": "Explore Real-World Applications",  "description": "See how this topic applies in industry or research."},
        {"step": 4, "title": "Build a Mini Project",            "description": "Apply everything you have learned in a practical project."},
        {"step": 5, "title": "Mentor & Teach Others",           "description": "Teaching is the best way to solidify mastery."},
    ],
}


TIPS_MAP = {
    "beginner":     "Don't rush! Focus on understanding the 'why' behind each concept before moving on.",
    "intermediate": "You're making great progress! Try explaining concepts to a friend to deepen your understanding.",
    "advanced":     "Excellent work! Consider exploring competitive/research-level problems to push your boundaries.",
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

    # 3. Build personalized resources with SEARCH URLs (never 404)
    personalized_resources = build_resources(data.topic, data.subject, difficulty_level)

    # 4. Build roadmap - all steps start as "upcoming" (student marks them)
    roadmap_templates = ROADMAP_TEMPLATES.get(difficulty_level, ROADMAP_TEMPLATES["beginner"])
    personalized_roadmap = []
    for node in roadmap_templates:
        personalized_roadmap.append({
            **node,
            "status": "upcoming"
        })

    # 5. Tip
    tip = TIPS_MAP.get(difficulty_level, "")

    return {
        "subject": data.subject,
        "topic": data.topic,
        "score_percentage": round(percentage, 1),
        "predicted_difficulty": difficulty_level,
        "resources": personalized_resources,
        "roadmap": personalized_roadmap,
        "tip": tip,
        "ai_message": f"Based on your score of {percentage:.1f}% in {data.topic}, you're at the {difficulty_level} level.",
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "learning_path_model.pkl"}
