import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';

const Upload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'File uploaded successfully! Processing started.' });
            if (onUploadSuccess) onUploadSuccess(res.data.id);
        } catch (err) {
            setMessage({ type: 'error', text: 'Upload failed: ' + (err.response?.data?.message || err.message) });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-dashed border-blue-200 w-96 h-96 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors">
                <div className="mb-6 p-4 bg-blue-50 rounded-full">
                    <CloudUpload className="text-blue-500 text-4xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Dataset</h2>
                <p className="text-gray-500 text-sm mb-6">Drag & drop your CSV file here or click to browse</p>

                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm"
                >
                    Choose File
                </label>

                {file && (
                    <div className="mt-4 text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                        {file.name}
                    </div>
                )}

                {uploading && (
                    <div className="mt-4 w-full">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-pulse w-2/3 rounded-full"></div>
                        </div>
                        <p className="text-xs text-blue-500 mt-1">Uploading...</p>
                    </div>
                )}

                {message && (
                    <div className={`mt-4 text-sm px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                {file && !uploading && (
                    <button
                        onClick={handleUpload}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2"
                    >
                        Start Processing
                    </button>
                )}
            </div>
        </div>
    );
};

export default Upload;
