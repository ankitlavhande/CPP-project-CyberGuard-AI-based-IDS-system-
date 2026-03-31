import pandas as pd
import joblib

DATA_PATH = r"C:\cpp final\cpp-dataset_final-main\cicids_final_merged.csv"

df = pd.read_csv(DATA_PATH)

# EXACT SAME AS TRAINING
X = df.drop(["Label", "Day"], axis=1)

joblib.dump(X.columns.tolist(), "feature_columns.pkl")

print("Feature columns saved.")
print("Total features:", len(X.columns))