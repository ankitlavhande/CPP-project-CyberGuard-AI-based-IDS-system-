import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
from lightgbm import LGBMClassifier

# ================================
# PATHS
# ================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = r"C:\cpp final\cpp-dataset_final-main\cicids_final_merged.csv"

MODEL_PATH = os.path.join(BASE_DIR, "multiclass_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "multiclass_scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

# ================================
# LOAD DATA
# ================================

df = pd.read_csv(DATA_PATH)

print("Original shape:", df.shape)

# ================================
# CLEANING
# ================================

# Remove duplicates
df = df.drop_duplicates()

# Remove infinite values
df = df.replace([np.inf, -np.inf], np.nan)

# Drop NaNs
df = df.dropna()

print("After cleaning:", df.shape)

print("\nFinal class distribution:")
print(df["Label"].value_counts())

# ================================
# ENCODE LABELS
# ================================

le = LabelEncoder()
df["Label"] = le.fit_transform(df["Label"])

joblib.dump(le, ENCODER_PATH)

# ================================
# FEATURES & TARGET
# ================================

X = df.drop(["Label", "Day"], axis=1)
y = df["Label"]

# Save feature column order
feature_columns = X.columns.tolist()
joblib.dump(feature_columns, os.path.join(BASE_DIR, "feature_columns.pkl"))

# ================================
# STRATIFIED SPLIT (LOCKED)
# ================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)
# Save test set for later manual validation
X_test.to_csv("saved_X_test.csv", index=False)
y_test.to_csv("saved_y_test.csv", index=False)


print("\nTrain shape:", X_train.shape)
print("Test shape:", X_test.shape)

# ================================
# SCALING
# ================================

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

joblib.dump(scaler, SCALER_PATH)

# ================================
# MODEL
# ================================

model = LGBMClassifier(
    objective="multiclass",
    num_class=len(np.unique(y)),
    n_estimators=200,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

joblib.dump(model, MODEL_PATH)

# ================================
# EVALUATION
# ================================

print("\n===== TRAIN PERFORMANCE =====")
y_train_pred = model.predict(X_train)
print(confusion_matrix(y_train, y_train_pred))
print(classification_report(
    y_train,
    y_train_pred,
    labels=np.unique(y_train),
    target_names=le.inverse_transform(np.unique(y_train)),
    zero_division=0
))

print("\n===== TEST PERFORMANCE =====")
y_test_pred = model.predict(X_test)
print("CONFUSION MATRIX")
print()
print(confusion_matrix(y_test, y_test_pred))
print(classification_report(
    y_test,
    y_test_pred,
    labels=np.unique(y_test),
    target_names=le.inverse_transform(np.unique(y_test)),
    zero_division=0
))
from sklearn.metrics import classification_report

print(classification_report(
    y_test,
    y_test_pred,
    target_names=le.inverse_transform(sorted(set(y_test)))
))

from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
weighted_f1 = f1_score(y_test, y_pred, average="weighted")
macro_f1 = f1_score(y_test, y_pred, average="macro")
precision = precision_score(y_test, y_pred, average="weighted")
recall = recall_score(y_test, y_pred, average="weighted")

metrics = {
    "accuracy": accuracy,
    "weighted_f1": weighted_f1,
    "macro_f1": macro_f1,
    "precision": precision,
    "recall": recall,
    "model": "LightGBM",
    "dataset": "CICIDS2017 (Stratified Split)"
}
print("\nModel, scaler, and encoder saved successfully in backend folder.")

import json

metrics = {
    "accuracy": float(accuracy),
    "weighted_f1": float(weighted_f1),
    "macro_f1": float(macro_f1),
    "precision": float(precision),
    "recall": float(recall),
    "model": "LightGBM",
    "dataset": "CICIDS2017 (Stratified Split)"
}

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("Metrics saved successfully.")
