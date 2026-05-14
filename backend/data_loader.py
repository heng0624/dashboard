import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "..", "data")

PICKLE_FILE = os.path.join(DATA_FOLDER, "processed_data.pkl")
MONTHLY_FILE = os.path.join(DATA_FOLDER, "monthly_data.pkl")

DATA_CACHE = None
DATA_MTIME = None
MONTHLY_CACHE = None
TARGET_CACHE = None


def load_data():
    global DATA_CACHE, DATA_MTIME

    current_mtime = os.path.getmtime(PICKLE_FILE) if os.path.exists(PICKLE_FILE) else None
    if DATA_CACHE is None or DATA_MTIME != current_mtime:
        DATA_CACHE = pd.read_pickle(PICKLE_FILE)
        DATA_MTIME = current_mtime
        print("⚡ Data loaded (FAST)")

    return DATA_CACHE


def load_monthly():
    global MONTHLY_CACHE

    if MONTHLY_CACHE is None:
        MONTHLY_CACHE = pd.read_pickle(MONTHLY_FILE)
        print("⚡ Monthly loaded (FAST)")

    return MONTHLY_CACHE


def load_target():
    global TARGET_CACHE

    if TARGET_CACHE is not None:
        return TARGET_CACHE

    file_name = None
    for f in os.listdir(DATA_FOLDER):
        if "TARGET" in f.upper():
            file_name = f
            break

    path = os.path.join(DATA_FOLDER, file_name)

    df = pd.read_excel(path, sheet_name="TARGET")

    df.columns = df.columns.str.strip()
    df["PRODUCTS"] = df["PRODUCTS"].astype(str).str.strip().str.upper()
    df["TARGET"] = pd.to_numeric(df["TARGET"], errors="coerce").fillna(0)

    TARGET_CACHE = df

    return TARGET_CACHE