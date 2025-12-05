# Abacus - Data Quality & Anomaly Detection

Abacus is a full-stack application designed to analyze datasets for quality issues and anomalies. It provides a user-friendly interface to upload CSV files, processes them using a machine learning service, and visualizes the results.

## 🏗️ Architecture

The project consists of three main services:

1.  **Frontend**: A React-based web interface (Vite) for users to interact with the application.
2.  **Backend**: A Node.js/Express server that manages file uploads and orchestrates communication.
3.  **ML Service**: A Python (FastAPI) service that performs data cleaning (ETL) and anomaly detection (Isolation Forest).

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or higher)
*   [Python](https://www.python.org/) (v3.8 or higher)
*   [MongoDB](https://www.mongodb.com/) (Ensure you have a running instance or connection string)

---

### 1. Backend Setup

The backend connects to MongoDB and handles API requests.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *   The backend runs on `http://localhost:5000`.

---

### 2. ML Service Setup

The ML service processes data and detects anomalies.

1.  Navigate to the `ml_service` directory:
    ```bash
    cd ml_service
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the service:
    ```bash
    python main.py
    ```
    *   The ML service runs on `http://localhost:8000`.
    *   **Pro Tip**: You can view the interactive API docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

The frontend is the user interface.

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *   Open your browser and visit the URL shown in the terminal (usually `http://localhost:5173`).

## 📁 Project Structure

*   `frontend/`: React application source code.
*   `backend/`: Express.js server, API routes, and database models.
*   `ml_service/`: Python scripts for ETL and Anomaly Detection.
    *   `main.py`: Entry point for the FastAPI server.
    *   `etl.py`: Logic for data cleaning and rule-based validation.
    *   `anomaly_detector.py`: Machine learning logic using Isolation Forest.

## 🛠️ Tech Stack

*   **Frontend**: React, Vite
*   **Backend**: Node.js, Express, Mongoose
*   **Database**: MongoDB
*   **ML/Data**: Python, FastAPI, Pandas, Scikit-learn, Numpy
