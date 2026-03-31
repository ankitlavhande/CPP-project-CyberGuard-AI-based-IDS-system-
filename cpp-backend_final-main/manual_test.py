import pandas as pd
import numpy as np
import joblib
import os

# ===============================
# LOAD FILES FROM BACKEND FOLDER
# ===============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, "multiclass_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "multiclass_scaler.pkl"))
encoder = joblib.load(os.path.join(BASE_DIR, "label_encoder.pkl"))

X_test = pd.read_csv(r"C:\Users\ankit\OneDrive\Desktop\cpp final boss\saved_X_test.csv")
y_test = pd.read_csv(r"C:\Users\ankit\OneDrive\Desktop\cpp final boss\saved_y_test.csv").values.ravel()

print("Loaded test set shape:", X_test.shape)

# ===============================
# SCALE
# ===============================

X_test_scaled = scaler.transform(X_test)

# ===============================
# PREDICT
# ===============================

pred = model.predict(X_test_scaled)

# ===============================
# ACCURACY CHECK
# ===============================

accuracy = (pred == y_test).mean()

print("\nRecomputed Accuracy:", accuracy)

# ===============================
# CHECK IF ANY MISMATCH
# ===============================

mismatch_indices = np.where(pred != y_test)[0]

print("Total mismatches:", len(mismatch_indices))

if len(mismatch_indices) > 0:
    print("\nShowing first 5 mismatches:\n")
    for idx in mismatch_indices[:5]:
        true_label = encoder.inverse_transform([y_test[idx]])[0]
        pred_label = encoder.inverse_transform([pred[idx]])[0]
        print(f"Index {idx}: TRUE = {true_label}, PRED = {pred_label}")
else:
    print("\nAll predictions match perfectly.")
