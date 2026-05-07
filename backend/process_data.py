import pandas as pd
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "..", "data")

OUTPUT_FILE = os.path.join(DATA_FOLDER, "processed_data.pkl")
MONTHLY_FILE = os.path.join(DATA_FOLDER, "monthly_data.pkl")


# =========================
# 🔥 CLEAN COLUMN FUNCTION
# =========================
def clean_columns(df):
    df.columns = (
        df.columns
        .str.strip()
        .str.replace("\n", " ")
        .str.replace("\r", " ")
        .str.replace(r"\s+", " ", regex=True)
        .str.replace(".", "", regex=False)
    )
    
    return df


# =========================
# 🔥 PROCESS DATA
# =========================
def process_data():
    df_list = []

    for file in os.listdir(DATA_FOLDER):

        if file.startswith("~$"):
            continue

        if "TARGET" in file.upper():
            continue

        if file.endswith((".xlsx", ".xlsm")):

            path = os.path.join(DATA_FOLDER, file)

            try:
                # =========================
                # READ FILE
                # =========================
                temp_df = pd.read_excel(path, sheet_name="Master Listing")

                # 🔥 CLEAN HEADERS (IMPORTANT FIX)
                temp_df = clean_columns(temp_df)
                #  # 🔥 DEBUG OUTPUT
                print(f"\n📄 FILE: {file}")
                print("📊 COLUMNS FOUND:")
                print(temp_df.columns.tolist())
                temp_df["Report Status"] = (
                temp_df["Report Status"]
                .astype(str)
                .str.strip()
                .str.upper()
                 )
                print(temp_df["Report Status"].value_counts(dropna=False))
                # =========================
                # CHECK REQUIRED COLUMN
                # =========================
                if "Assign Date_1" not in temp_df.columns:
                    continue

                # =========================
                # KEEP ONLY REQUIRED COLUMNS
                # =========================
                temp_df = temp_df[[
                       "Assign Date_1",
                       "Assign Date",
                       "Date Paid",
                       "RM Paid",
                       "Account No",
                       "Name",
                       "Collector",
                       "Report Status",
                       "Sub-status",
                       "Aging Breakdown",
                       "RACE",
                       "Charge-off",
                       "BREAKDOWN",
                       "DPD BREAKDOWN",
                       "PL"
                

                ]]
                
                # =========================
                # CLEAN VALUES
                # =========================
                temp_df["Assign Date_1"] = temp_df["Assign Date_1"].astype(str).str.strip()

                temp_df["Assign Date_parsed"] = pd.to_datetime(
                    temp_df["Assign Date_1"], errors="coerce"
                )

                temp_df["Date Paid"] = pd.to_datetime(
                    temp_df["Date Paid"], errors="coerce"
                )

                temp_df["RM Paid"] = pd.to_numeric(
                    temp_df["RM Paid"], errors="coerce"
                ).fillna(0)

                # =========================
                # MONTH CLASSIFICATION
                # =========================
                def classify_month(x, parsed_date):
                    x = str(x).upper()

                    if "BEFORE JAN 2026" in x:
                        return "2026-01"
                    if "BEFORE FEB 2026" in x:
                        return "2026-02"
                    if "BEFORE MAR 2026" in x:
                        return "2026-03"
                    if "BEFORE APR 2026" in x:
                        return "2026-04"

                    if pd.notna(parsed_date):
                        return parsed_date.strftime("%Y-%m")

                    return None

                temp_df["Month"] = temp_df.apply(
                    lambda row: classify_month(
                        row["Assign Date_1"],
                        row["Assign Date_parsed"]
                    ),
                    axis=1
                )

                # =========================
                # FILTER ONLY 2026
                # =========================
                temp_df = temp_df[temp_df["Month"].str.startswith("2026", na=False)]

                # =========================
                # PRODUCT NAME
                # =========================

                product_name = (
                re.sub(r"\.xlsx|\.xlsm", "", file)
                .strip()
                .upper()
                )

# remove extra words like DATA, FINAL, COPY
                product_name = product_name.replace("DATA", "").replace("FINAL", "").replace("(1)", "")
                product_name = product_name.strip()

                temp_df["Product"] = product_name
                df_list.append(temp_df)

            except Exception as e:
                print("❌ ERROR:", file, e)

    # =========================
    # FINAL MERGE
    # =========================
    if not df_list:
        print("⚠️ No data loaded")
        return

    df = pd.concat(df_list, ignore_index=True)

    # =========================
    # SAVE MAIN DATA
    # =========================
    df.to_pickle(OUTPUT_FILE)

    # =========================
    # PRE-AGGREGATED MONTHLY DATA (FAST CHART)
    # =========================
    monthly_df = df.groupby(["Product", "Month"])["RM Paid"].sum().reset_index()
    monthly_df.to_pickle(MONTHLY_FILE)

    print("🔥 Data processed successfully!")


if __name__ == "__main__":
    process_data()