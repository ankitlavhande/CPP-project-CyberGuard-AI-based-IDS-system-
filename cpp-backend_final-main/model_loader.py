import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

model = joblib.load(os.path.join(MODEL_DIR, "multiclass_model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "multiclass_scaler.pkl"))
feature_columns = joblib.load(os.path.join(BASE_DIR, "feature_columns.pkl"))
encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
print("DONE!")

print("Loaded model successfully")
print("Model path:", r"C:\cpp final\cpp-backend_final-main\model.py")
print("Encoder classes:", encoder.classes_)