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

class ProcessRequest(BaseModel):
    filepath: str
    datasetId: str

@app.post("/process")
async def process_dataset(request: ProcessRequest):
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")

        # 1. ETL: Load and Clean
        df, quality_report = process_data(request.filepath)

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
            {"_id": ObjectId(request.datasetId)},
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

        return {"status": "success", "datasetId": request.datasetId}

    except Exception as e:
        # Update status to failed
        collection.update_one(
            {"_id": ObjectId(request.datasetId)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
