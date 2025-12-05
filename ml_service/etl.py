import pandas as pd
import numpy as np
import re

def process_data(filepath):
    df = pd.read_csv(filepath)
    
    initial_rows = len(df)
    missing_values = df.isnull().sum().to_dict()
    
    # Initialize error tracking
    df['anomaly_reasons'] = ""
    df['is_rule_anomaly'] = False

    # 1. Check for Duplicates
    # Mark all duplicates as anomalies (keep first is False to find all)
    dupe_mask = df.duplicated(subset=['claim_id'], keep=False)
    df.loc[dupe_mask, 'anomaly_reasons'] += "Duplicate Claim ID; "
    df.loc[dupe_mask, 'is_rule_anomaly'] = True
    
    duplicates_count = dupe_mask.sum()
    
    # 2. Check for Missing Values
    for col in ['patient_name', 'dob', 'zip_code']:
        if col in df.columns:
            mask = df[col].isnull() | (df[col] == "")
            if mask.any():
                df.loc[mask, 'anomaly_reasons'] += f"Missing {col}; "
                df.loc[mask, 'is_rule_anomaly'] = True

    # 3. Check for Format Inconsistencies
    format_errors = 0
    
    # ZIP Code (Must be 5 digits)
    if 'zip_code' in df.columns:
        # Convert to string first, handle NaN
        zips = df['zip_code'].astype(str)
        # Regex for exactly 5 digits. NaN is already caught in missing values, so ignore here or double flag.
        # We'll flag invalid formats that are NOT empty.
        mask_invalid_zip = ~zips.str.match(r'^\d{5}$') & (df['zip_code'].notnull())
        if mask_invalid_zip.any():
            df.loc[mask_invalid_zip, 'anomaly_reasons'] += "Invalid ZIP Format; "
            df.loc[mask_invalid_zip, 'is_rule_anomaly'] = True
            format_errors += mask_invalid_zip.sum()

    # Date Format (Simple check for YYYY-MM-DD)
    if 'dob' in df.columns:
        dobs = df['dob'].astype(str)
        # Regex for YYYY-MM-DD
        mask_invalid_dob = ~dobs.str.match(r'^\d{4}-\d{2}-\d{2}$') & (df['dob'].notnull())
        if mask_invalid_dob.any():
            df.loc[mask_invalid_dob, 'anomaly_reasons'] += "Invalid DOB Format; "
            df.loc[mask_invalid_dob, 'is_rule_anomaly'] = True
            format_errors += mask_invalid_dob.sum()

    # Calculate Quality Score
    # Start at 100
    # Deduct 1 point for every row with an error (simplified)
    total_error_rows = df['is_rule_anomaly'].sum()
    score = max(0, 100 - (total_error_rows / initial_rows * 100))
    score = round(score, 2)
    
    total_instances = int(duplicates_count) + sum(missing_values.values()) + int(format_errors)

    quality_report = {
        "initial_rows": initial_rows,
        "final_rows": len(df), # We are NOT dropping rows anymore, we are flagging them
        "missing_values": missing_values,
        "duplicates": int(duplicates_count),
        "format_errors": int(format_errors),
        "total_instances": total_instances,
        "score": score
    }
    
    # Fill missing values for ML processing (simple imputation) AFTER flagging
    df.fillna(0, inplace=True) # For numeric
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].replace(np.nan, "Unknown")
        df[col] = df[col].astype(str) # Ensure all strings
        
    return df, quality_report
