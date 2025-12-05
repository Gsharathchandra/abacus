import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def generate_dataset(num_rows, filename):
    print(f"Generating {filename} with {num_rows} rows...")
    
    # Seed for reproducibility
    np.random.seed(42)
    random.seed(42)

    # 1. Generate Base Data
    claim_ids = [f"CLM{i:05d}" for i in range(1, num_rows + 1)]
    
    names = [f"Patient_{i}" for i in range(num_rows)]
    
    # Generate dates
    start_date = datetime(2020, 1, 1)
    dobs = [(start_date - timedelta(days=random.randint(365*20, 365*80))).strftime("%Y-%m-%d") for _ in range(num_rows)]
    
    # Generate ZIPs (mostly valid)
    zips = [f"{random.randint(10000, 99999)}" for _ in range(num_rows)]
    
    # Generate Claim Amounts (mostly normal, log-normal distribution)
    amounts = np.random.lognormal(mean=8, sigma=1, size=num_rows) # Mean around 3000
    amounts = np.round(amounts, 2)

    df = pd.DataFrame({
        'claim_id': claim_ids,
        'patient_name': names,
        'dob': dobs,
        'zip_code': zips,
        'claim_amount': amounts,
        'diagnosis_code': [random.choice(['A01', 'B02', 'C03', 'D04', 'E05']) for _ in range(num_rows)]
    })

    # 2. Inject Errors & Anomalies

    # A. Duplicates (Duplicate claim_id) - 5%
    num_dupes = int(num_rows * 0.05)
    if num_dupes > 0:
        dupe_indices = np.random.choice(df.index, num_dupes, replace=False)
        dupes = df.loc[dupe_indices].copy()
        df = pd.concat([df, dupes], ignore_index=True)
        # Shuffle to mix duplicates
        df = df.sample(frac=1).reset_index(drop=True)

    # B. Missing Values (Nulls) - 5% per column
    for col in ['patient_name', 'dob', 'zip_code']:
        mask = np.random.random(len(df)) < 0.05
        df.loc[mask, col] = np.nan

    # C. Format Inconsistencies
    
    # Invalid Date Formats (e.g., "01/01/2020" instead of "2020-01-01" or random string)
    mask_date = np.random.random(len(df)) < 0.02
    df.loc[mask_date, 'dob'] = "Invalid_Date"

    # Invalid ZIPs (Short, Long, Alphanumeric)
    mask_zip = np.random.random(len(df)) < 0.03
    df.loc[mask_zip, 'zip_code'] = "ABCDE" # Alphanumeric
    
    mask_zip_short = np.random.random(len(df)) < 0.02
    df.loc[mask_zip_short, 'zip_code'] = "123" # Too short

    # D. Anomalies (Outliers in Amount)
    # Make some amounts extremely high
    num_outliers = int(num_rows * 0.02)
    outlier_indices = np.random.choice(df.index, num_outliers, replace=False)
    df.loc[outlier_indices, 'claim_amount'] = df.loc[outlier_indices, 'claim_amount'] * 100

    # Save to CSV
    output_dir = "generated_datasets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    filepath = os.path.join(output_dir, filename)
    df.to_csv(filepath, index=False)
    print(f"Saved to {filepath}")

if __name__ == "__main__":
    generate_dataset(100, "claims_100.csv")
    generate_dataset(1000, "claims_1000.csv")
    generate_dataset(5000, "claims_5000.csv")
