from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from .data_loader import load_data, load_target, load_monthly
import pandas as pd
app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)

CORS(app)

# =========================
# 🔥 HELPER: FILTER PRODUCT
# =========================
def filter_product(df, product):
    # 🔥 STANDARDIZE COLUMN FIRST
    df.columns = df.columns.str.strip().str.upper()

    if "PRODUCT" not in df.columns:
        return df

    df["PRODUCT"] = (
        df["PRODUCT"]
        .astype(str)
        .str.upper()
        .str.strip()
    )

    if not product or product.upper() == "ALL":
        return df

    return df[df["PRODUCT"] == product.upper()]

def apply_filters(df):
    df.columns = df.columns.str.strip().str.upper()

    # =========================
    # GET FILTERS FROM REQUEST
    # =========================
    product = request.args.get("product")
    day = request.args.get("day")
    race = request.args.get("race")
    dpd = request.args.get("dpd")
    aging = request.args.get("aging")
    pwo = request.args.get("pwo")
    os=request.args.get("os")

    # =========================
    # PRODUCT
    # =========================
    if product and product != "ALL":
        df["PRODUCT"] = df["PRODUCT"].astype(str).str.upper().str.strip()
        df = df[df["PRODUCT"] == product]

    # =========================
    # DATE PAID (DAY FILTER)
    # =========================
    if "DATE PAID" in df.columns:
        df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

        if day and day != "ALL":
            df = df[df["DATE PAID"].dt.day == int(day)]

    # =========================
    # RACE
    # =========================
    if race and race != "ALL" and "RACE" in df.columns:
        df["RACE"] = df["RACE"].astype(str).str.upper().str.strip()
        df = df[df["RACE"] == race]

    # =========================
    # DPD
    # =========================
    if dpd and dpd != "ALL" and "DPD BREAKDOWN" in df.columns:
        df["DPD BREAKDOWN"] = df["DPD BREAKDOWN"].astype(str).str.upper().str.strip()
        df = df[df["DPD BREAKDOWN"] == dpd]

    # =========================
    # AGING
    # =========================
    if aging and aging != "ALL" and "AGING BREAKDOWN" in df.columns:
        df["AGING BREAKDOWN"] = df["AGING BREAKDOWN"].astype(str).str.upper().str.strip()
        df = df[df["AGING BREAKDOWN"] == aging]

    # =========================
    # PWO / WO (CHARGE-OFF)
    # =========================
    if pwo and pwo != "ALL" and "CHARGE-OFF" in df.columns:
        df["CHARGE-OFF"] = df["CHARGE-OFF"].astype(str).str.upper().str.strip()
        df = df[df["CHARGE-OFF"] == pwo]

    # =========================
    # OSB (BREAKDOWN)
    # =========================
    if  os and os != "ALL" and "BREAKDOWN" in df.columns:
        df["BREAKDOWN"] = df["BREAKDOWN"].astype(str).str.upper().str.strip()
        df = df[df["BREAKDOWN"] == os]

    return df
@app.route("/")
def home():
    return render_template("dashboard.html")

def normalize_product(df):
    if "Product" in df.columns:
        df["Product"] = (
            df["Product"]
            .astype(str)
            .str.upper()
            .str.strip()
            .str.replace(r"\s+", "", regex=True)
        )
    return df


# =========================
# 📊 MONTHLY CHART (FAST)
# =========================
@app.route("/monthly-collection") 
def monthly_collection(): 
    df = load_monthly()
    df = apply_filters(df)
    
    if df.empty:
        print("❌ DATAFRAME IS EMPTY AFTER FILTER")
        return jsonify([])

    # =========================
    # 🔥 FIX: USE CORRECT COLUMN NAMES
    # =========================
    required = ["MONTH", "RM PAID"]
    for col in required:
        if col not in df.columns:
            print(f"❌ MISSING COLUMN: {col}")

    print("📊 SAMPLE DATA:")
    print(df.head())

    # =========================
    # GROUPING (FIXED)
    # =========================
    try:
        result = (
            df.groupby("MONTH")["RM PAID"]
            .sum()
            .reset_index()
        )

        print("📦 RESULT:")
        # print(result)

    except Exception as e:
        print("❌ GROUPBY ERROR:", str(e))
        return jsonify({"error": str(e)})

    print("===== 🔥 MONTHLY COLLECTION DEBUG END =====\n")

    return jsonify(result.to_dict(orient="records"))


@app.route("/total-collection")
def total_collection():
    df = load_data()
   
    
    df = apply_filters(df)
    df.columns = df.columns.str.strip().str.upper()

    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)

    # =========================
    # DATE CLEANING
    # =========================
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")
    df = df[df["DATE PAID"].notna()]

    # =========================
    # CURRENT MONTH FILTER
    # =========================
    df["MONTH"] = df["DATE PAID"].dt.to_period("M")
    current_month = df["MONTH"].max()
   
    last_month = current_month - 1

    current_df = df[df["MONTH"] == current_month]
  
    last_df = df[df["MONTH"] == last_month]

    df = df[df["MONTH"] == current_month]
    
    print("total",df["RM PAID"].sum())
    return jsonify({
        "total": float(df["RM PAID"].sum()),
        "month": str(current_month),
        "current": float(current_df["RM PAID"].sum()),
        "last": float(last_df["RM PAID"].sum())
    })



@app.route("/total-files")
def total_files():
    df = load_data()
    df = apply_filters(df)
   
    # =========================
    # CLEAN DATE (HANDLE ALL CASES)
    # =========================
    df["DATE_1"] = pd.to_datetime(df.get("ASSIGN DATE_1"), errors="coerce")
    df["DATE_2"] = pd.to_datetime(df.get("ASSIGN DATE"), errors="coerce")
    df["DATE_3"] = pd.to_datetime(df.get("DATE PAID"), errors="coerce")

    # 🔥 PRIORITY: ASSIGN DATE_1 → ASSIGN DATE → DATE PAID
    df["FINAL_DATE"] = df["DATE_1"].fillna(df["DATE_2"]).fillna(df["DATE_3"])

    df = df[df["FINAL_DATE"].notna()]

    # =========================
    # CURRENT MONTH FILTER
    # =========================
    df["MONTH"] = df["FINAL_DATE"].dt.to_period("M")
    current_month = df["MONTH"].max()
    last_month = current_month - 1

    current_df = df[df["MONTH"] == current_month]
    last_df = df[df["MONTH"] == last_month]
    df = df[df["MONTH"] == current_month]

    return jsonify({
        "total_files": int(len(df)),
        "current": len(current_df),
        "last": len(last_df)
        })

   

# =========================
# 🎯 TARGET
# =========================
@app.route("/target")
def get_target():
   df = load_target()

   product = request.args.get("product")

   if product:
        product = product.strip().upper()

   if product and product not in ["ALL", "PRODUCTS"]:
        df = df[df["PRODUCTS"] == product]

   return jsonify({"target": float(df["TARGET"].sum())})


@app.route("/top-payments")
def top_payments():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    df.columns = df.columns.str.strip().str.upper()

    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    df = df[df["DATE PAID"].notna()]  # 🔥 remove NaT early (faster)

    df["MONTH"] = df["DATE PAID"].dt.to_period("M")
    current_month = df["MONTH"].max()

    df = df[df["MONTH"] == current_month]

    top = (
        df.groupby(["ACCOUNT NO", "NAME"], as_index=False)["RM PAID"]
        .sum()
        .sort_values("RM PAID", ascending=False)
        .head(5)
    )

    return jsonify(top.to_dict(orient="records"))

@app.route("/all-payments")
def all_payments():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    # print("\n===== 🔍 DEBUG START =====")

    # print("📊 Raw DF shape:", df.shape)
    # print("📊 Raw columns:", df.columns.tolist())

    print("📊 After product filter:", df.shape)

    df.columns = df.columns.str.strip().str.upper()
    print("📊 Columns after upper:", df.columns.tolist())

    # Check required columns
    required_cols = ["RM PAID", "DATE PAID", "ACCOUNT NO", "NAME"]
    for col in required_cols:
        if col not in df.columns:
            print(f"❌ MISSING COLUMN: {col}")

    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    print("📅 DATE PAID sample:")
    print(df["DATE PAID"].head())

    df["MONTH"] = df["DATE PAID"].dt.to_period("M").astype(str)

    print("📅 MONTH sample:")
    print(df["MONTH"].head())

    result = (
        df.groupby(["MONTH", "ACCOUNT NO", "NAME"], as_index=False)["RM PAID"]
        .sum()
        .rename(columns={
            # "MONTH": "month",
            "ACCOUNT NO": "account_no",
            "NAME": "name",
            "RM PAID": "rm_paid"
        })
    )

    print("📦 Result shape:", result.shape)
    print("📦 Result preview:")
    print(result.head())

    print("===== 🔍 DEBUG END =====\n")

    return jsonify(result.to_dict(orient="records"))

@app.route("/all-payments-table")
def all_payments_table():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    df.columns = df.columns.str.strip().str.upper()

    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    df["MONTH"] = df["DATE PAID"].dt.to_period("M").astype(str)

    result = (
        df.groupby(["MONTH", "ACCOUNT NO", "NAME"], as_index=False)["RM PAID"]
        .sum()
        .rename(columns={
            "MONTH": "month",
            "ACCOUNT NO": "account_no",
            "NAME": "name",
            "RM PAID": "rm_paid"
        })
    )

    return jsonify(result.to_dict(orient="records"))

@app.route("/all-payments-page")
def all_payments_page():
    return render_template("all_payments.html")




@app.route("/top-collectors")
def top_collectors():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    df.columns = df.columns.str.strip().str.upper()

    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    df = df[df["DATE PAID"].notna()]  # 🔥 important

    df["MONTH"] = df["DATE PAID"].dt.to_period("M")
    current_month = df["MONTH"].max()

    df = df[df["MONTH"] == current_month]

    top = (
        df.groupby("COLLECTOR", as_index=False)["RM PAID"]
        .sum()
        .sort_values("RM PAID", ascending=False)
        .head(5)
    )

    return jsonify(top.to_dict(orient="records"))
@app.route("/all-collectors")
def all_collectors():
    df = load_data()
    df = filter_product(df, request.args.get("product"))
    
    # CLEAN COLUMNS
    df.columns = df.columns.str.strip().str.upper()
    # CHECK REQUIRED
    required = ["COLLECTOR", "RM PAID", "DATE PAID"]
    if not all(col in df.columns for col in required):
        return jsonify([])

    # CLEAN DATA
    df["RM PAID"] = pd.to_numeric(df["RM PAID"], errors="coerce").fillna(0)
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    # MONTH
    df["MONTH"] = df["DATE PAID"].dt.to_period("M").astype(str)

    # GROUP
    result = (
        df.groupby(["MONTH", "COLLECTOR"], as_index=False)["RM PAID"]
        .sum()
        .sort_values(["MONTH", "RM PAID"], ascending=[True, False])
    )

    return jsonify(result.to_dict(orient="records"))


@app.route("/all-collectors-page")
def all_collectors_page():
    return render_template("all_collectors.html")


@app.route("/status-summary")
def status_summary():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    # =========================
    # CLEAN COLUMNS
    # =========================
    df.columns = df.columns.str.strip().str.upper()

    # =========================
    # FIX DATE ISSUE (HSBC + UOB SAFE)
    # =========================
    df["ASSIGN DATE_1"] = pd.to_datetime(df["ASSIGN DATE_1"], errors="coerce")

    # fallback if another date column exists
    if "ASSIGN DATE" in df.columns:
        df["ASSIGN DATE"] = pd.to_datetime(df["ASSIGN DATE"], errors="coerce")
        df["FINAL_DATE"] = df["ASSIGN DATE_1"].fillna(df["ASSIGN DATE"])
    else:
        df["FINAL_DATE"] = df["ASSIGN DATE_1"]

    # remove invalid dates
    df = df[df["FINAL_DATE"].notna()]

    # =========================
    # MONTH FILTER (CURRENT IN FILE)
    # =========================
    df["MONTH"] = df["FINAL_DATE"].dt.to_period("M")
    current_month = df["MONTH"].max()
    df = df[df["MONTH"] == current_month]

    # =========================
    # CLEAN STATUS FIELDS
    # =========================
    df["REPORT STATUS"] = df["REPORT STATUS"].astype(str).str.upper().str.strip()
    df["SUB-STATUS"] = df["SUB-STATUS"].astype(str).str.upper().str.strip()

    # =========================
    # BUILD RESULT
    # =========================
    result = {}

    for status in ["CTC", "UCT", "WIP", "ABORT"]:
        status_df = df[df["REPORT STATUS"] == status]

        result[status] = {
            "total": int(len(status_df)),
            "sub_status": status_df["SUB-STATUS"].value_counts().head(5).to_dict()
        }

    return jsonify(result)

@app.route("/all-status")
def all_status():
    df = load_data()
    df = filter_product(df, request.args.get("product"))

    # CLEAN COLUMNS
    df.columns = df.columns.str.strip().str.upper()

    # HANDLE BOTH POSSIBLE COLUMN NAMES
    if "SUB-STATUS" not in df.columns and "SUB STATUS" in df.columns:
        df["SUB-STATUS"] = df["SUB STATUS"]

    required = ["REPORT STATUS", "SUB-STATUS", "ASSIGN DATE_1","ASSIGN DATE"]
    if not all(col in df.columns for col in required):
        print("❌ Missing columns:", df.columns.tolist())
        return jsonify([])

    # CLEAN VALUES
    df["REPORT STATUS"] = df["REPORT STATUS"].astype(str).str.strip().str.upper()
    df["SUB-STATUS"] = df["SUB-STATUS"].astype(str).str.strip().str.upper()

    # DATE PARSING (FIXED DUPLICATION)
    df["DATE_1"] = pd.to_datetime(df.get("ASSIGN DATE_1"), errors="coerce")
    df["DATE_2"] = pd.to_datetime(df.get("ASSIGN DATE"), errors="coerce")
    df["DATE_3"] = pd.to_datetime(df.get("DATE PAID"), errors="coerce")

    # 🔥 PRIORITY: ASSIGN DATE_1 → ASSIGN DATE → DATE PAID
    df["FINAL_DATE"] = df["DATE_1"].fillna(df["DATE_2"]).fillna(df["DATE_3"])

    
    # MONTH COLUMN
    df["MONTH"] = df["FINAL_DATE"].dt.to_period("M").astype(str)

    # REMOVE EMPTY STATUS
    df = df[df["REPORT STATUS"].notna()]

    # 🔥 DEFINE STATUS HERE (THIS FIXES YOUR ERROR)
    status = request.args.get("status")

    # FILTER
    if status:
        df = df[df["REPORT STATUS"] == status.upper()]

    # GROUP
    result = (
        df.groupby(["MONTH", "REPORT STATUS", "SUB-STATUS"])
        .size()
        .reset_index(name="TOTAL")
        .sort_values(["MONTH", "TOTAL"], ascending=[True, False])
    )

    print("✅ STATUS RESULT:")
    print(result.head())

    return jsonify(result.to_dict(orient="records"))

@app.route("/all-status-page")
def all_status_page():
    status = request.args.get("status")  # 🔥 get from URL
    return render_template("all_status.html", status=status)

@app.route("/product-summary")
def product_summary():
    df = load_data()

    df.columns = df.columns.str.strip().str.upper()

    if "PRODUCT" not in df.columns:
        return jsonify([])

    df["PRODUCT"] = df["PRODUCT"].astype(str).str.strip()

    result = (
        df.groupby("PRODUCT")
        .size()
        .reset_index(name="TOTAL_FILE")
        .sort_values("TOTAL_FILE", ascending=False)
    )

    # 🔥 ONLY TOP 5
    top5 = result.head(5)

    return jsonify(top5.to_dict(orient="records"))

@app.route("/product-summary-all")
def product_summary_all():
    df = load_data()

    df.columns = df.columns.str.strip().str.upper()

    if "PRODUCT" not in df.columns:
        return jsonify([])

    df["PRODUCT"] = df["PRODUCT"].astype(str).str.strip()

    result = (
        df.groupby("PRODUCT")
        .size()
        .reset_index(name="TOTAL_FILE")
        .sort_values("TOTAL_FILE", ascending=False)
    )

    return jsonify(result.to_dict(orient="records"))


@app.route("/all-products-page")
def all_products_page():
    return render_template("all_products.html")

@app.route("/product-performance")
def product_performance():
    df = load_data()
    target_df = load_target()

    df.columns = df.columns.str.strip().str.upper()
    target_df.columns = target_df.columns.str.strip().str.upper()

    # DATE
    df["ASSIGN DATE_1"] = pd.to_datetime(df["ASSIGN DATE_1"], errors="coerce")
    df["DATE PAID"] = pd.to_datetime(df["DATE PAID"], errors="coerce")

    df["FINAL_DATE"] = df["ASSIGN DATE_1"].fillna(df["DATE PAID"])
    df = df[df["FINAL_DATE"].notna()]

    df["MONTH"] = df["FINAL_DATE"].dt.to_period("M").astype(str)

    # PRODUCT
    df["PRODUCT"] = df["PRODUCT"].astype(str).str.strip().str.upper()
    target_df["PRODUCT"] = target_df["PRODUCTS"].astype(str).str.strip().str.upper()

    # COLLECTION
    df["COLLECTION"] = pd.to_numeric(df.get("RM PAID", 0), errors="coerce").fillna(0)

    # GROUP
    collection = df.groupby(["MONTH", "PRODUCT"])["COLLECTION"].sum().reset_index()
    target = target_df.groupby("PRODUCT")["TARGET"].sum().reset_index()

    result = collection.merge(target, on="PRODUCT", how="left").fillna(0)

    result["ACHIEVEMENT"] = result.apply(
        lambda x: (x["COLLECTION"] / x["TARGET"] * 100) if x["TARGET"] > 0 else 0,
        axis=1
    )

    # =========================
    # 🔥 MODE CONTROL
    # =========================
    mode = request.args.get("mode")

    if mode == "dashboard":
        # 👉 CURRENT MONTH ONLY
        current_month = result["MONTH"].max()
        result = result[result["MONTH"] == current_month]

        # 👉 TOP 3 PRODUCTS
        result = result.sort_values("ACHIEVEMENT", ascending=False).head(3)

    # else → return ALL months (for all-products page)

    return jsonify(result.to_dict(orient="records"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
