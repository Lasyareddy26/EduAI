# ml_service/train_model.py
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

# 1. Create Dummy Data (Synthetic Training)
# Logic: < 40% = Beginner, 40-75% = Intermediate, > 75% = Advanced
data = {
    'score_percentage': [10, 25, 35, 45, 55, 65, 80, 90, 98, 15, 60, 85],
    'difficulty_label': [
        'beginner', 'beginner', 'beginner', 
        'intermediate', 'intermediate', 'intermediate', 
        'advanced', 'advanced', 'advanced',
        'beginner', 'intermediate', 'advanced'
    ]
}

df = pd.DataFrame(data)

# 2. Features (X) and Labels (y)
X = df[['score_percentage']]
y = df['difficulty_label']

# 3. Train Model
clf = DecisionTreeClassifier()
clf.fit(X, y)

# 4. Save the Model
joblib.dump(clf, "learning_path_model.pkl")
print("✅ Model trained and saved as 'learning_path_model.pkl'")