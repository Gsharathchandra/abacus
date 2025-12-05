from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import uvicorn
import pandas as pd
import os
from etl import process_data
from anomaly_detector import detect_anomalies
from pymongo import MongoClient
from bson.objectid import ObjectId
import shutil

app = FastAPI()

MONGO_URI = "mongodb+srv://gumasthasharathchandra:4ZWWWhzFxjSBp5iU@cluster0.qj4eb72.mongodb.net/abacus?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client['abacus']
collection = db['datasets']

@app.get("/")
def read_root():
    return {"status": "ML Service is running! 🚀"}

@app.post("/process")
async def process_dataset(file: UploadFile = File(...), datasetId: str = Form(...)):
    temp_filename = f"temp_{datasetId}.csv"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        df, quality_report = process_data(temp_filename)
        df_analyzed, anomaly_stats = detect_anomalies(df)

        result = {
            "quality_report": quality_report,
            "anomaly_stats": anomaly_stats,
            "sample_data": df_analyzed.head(1000).to_dict(orient='records')
        }

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
        collection.update_one(
            {"_id": ObjectId(datasetId)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
