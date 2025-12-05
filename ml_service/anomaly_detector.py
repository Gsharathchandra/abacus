import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder

def detect_anomalies(df):
    df_encoded = df.copy()
    
    cols_to_drop = ['anomaly_reasons', 'is_rule_anomaly']
    for col in cols_to_drop:
        if col in df_encoded.columns:
            df_encoded = df_encoded.drop(columns=[col])

    label_encoders = {}
    for col in df_encoded.select_dtypes(include=['object']).columns:
        le = LabelEncoder()
        df_encoded[col] = df_encoded[col].astype(str)
        df_encoded[col] = le.fit_transform(df_encoded[col])
        label_encoders[col] = le
        
    scaler = StandardScaler()
    X = scaler.fit_transform(df_encoded)
    
    clf = IsolationForest(contamination=0.05, random_state=42) 
    df['ml_anomaly_score'] = clf.fit_predict(X)
    
    df['is_ml_anomaly'] = df['ml_anomaly_score'].apply(lambda x: True if x == -1 else False)
    
    mask_ml = df['is_ml_anomaly'] == True
    df.loc[mask_ml, 'anomaly_reasons'] += "Statistical Outlier (ML); "
    
    df['is_anomaly'] = df['is_rule_anomaly'] | df['is_ml_anomaly']
    
    total_anomalies = df['is_anomaly'].sum()
    
    anomaly_stats = {
        "total_anomalies": int(total_anomalies),
        "anomaly_percentage": round((total_anomalies / len(df)) * 100, 2),
        "rule_based_count": int(df['is_rule_anomaly'].sum()),
        "ml_based_count": int(df['is_ml_anomaly'].sum())
    }
    
    return df, anomaly_stats
