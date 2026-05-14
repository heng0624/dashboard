import pandas as pd

# =========================
# LOAD PICKLE FILE
# =========================
df = pd.read_pickle("../data/processed_data.pkl")

# =========================
# CLEAN COLUMNS
# =========================
df.columns = df.columns.str.strip().str.upper()

# =========================
# CLEAN DATE + RM PAID
# =========================
df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

df["RM PAID"] = pd.to_numeric(
    df["RM PAID"],
    errors="coerce"
).fillna(0)

# =========================
# REMOVE INVALID DATES
# =========================
df = df[df["DATE PAID"].notna()]

# =========================
# CREATE MONTH
# =========================
df["MONTH"] = df["DATE PAID"].dt.to_period("M")

# =========================
# GET CURRENT MONTH
# =========================
current_month = df["MONTH"].max()

# =========================
# FILTER CURRENT MONTH
# =========================
current_df = df[df["MONTH"] == current_month]

# =========================
# TOTAL COLLECTION
# =========================
total_collection = current_df["RM PAID"].sum()

print("\n===== CURRENT MONTH =====")
print(current_month)

print("\n===== TOTAL COLLECTION =====")
print(f"RM {total_collection:,.2f}")