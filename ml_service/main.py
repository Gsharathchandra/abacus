from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import pandas as pd
import os
from etl import process_data
from anomaly_detector import detect_anomalies
from pymongo import MongoClient
from bson.objectid import ObjectId

app = FastAPI()

# Database Connection
# TODO: Use env var in production
MONGO_URI = "mongodb+srv://gumasthasharathchandra:4ZWWWhzFxjSBp5iU@cluster0.qj4eb72.mongodb.net/abacus?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client['abacus'] # Database name from URI
collection = db['datasets']

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import shutil

# ... imports ...

@app.post("/process")
async def process_dataset(file: UploadFile = File(...), datasetId: str = Form(...)):
    temp_filename = f"temp_{datasetId}.csv"
    try:
        # Save uploaded file to temp
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. ETL: Load and Clean
        df, quality_report = process_data(temp_filename)

        # 2. Anomaly Detection
        df_analyzed, anomaly_stats = detect_anomalies(df)

        # 3. Prepare Result
        result = {
            "quality_report": quality_report,
            "anomaly_stats": anomaly_stats,
            "sample_data": df_analyzed.head(1000).to_dict(orient='records') # Return first 1000 rows for preview
        }

        # 4. Update MongoDB
        collection.update_one(
            {"_id": ObjectId(datasetId)},
            {
                "$set": {
                    "status": "completed",
                    "qualityScore": quality_report['score'],
                    "totalRows": len(df),
                    "anomaliesFound": anomaly_stats['total_anomalies'],
                    "results": result
                }
            }
        )

        return {"status": "success", "datasetId": datasetId}

    except Exception as e:
        # Update status to failed
        collection.update_one(
            {"_id": ObjectId(datasetId)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
