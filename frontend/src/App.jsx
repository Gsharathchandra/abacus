import React, { useState } from 'react';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import { Analytics } from '@mui/icons-material';

function App() {
    const [currentDatasetId, setCurrentDatasetId] = useState(() => localStorage.getItem('datasetId'));

    const handleUploadSuccess = (id) => {
        localStorage.setItem('datasetId', id);
        setCurrentDatasetId(id);
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm shrink-0">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
                    <Analytics className="text-blue-600 mr-2" fontSize="large" />
                    <h1 className="text-2xl font-bold text-gray-900">Data Quality Anomaly Detector</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0 w-full">
                <Upload onUploadSuccess={handleUploadSuccess} />

                <div className="mt-6 flex-1 flex flex-col min-h-0">
                    <Dashboard datasetId={currentDatasetId} />
                </div>
            </main>
        </div>
    );
}

export default App;
