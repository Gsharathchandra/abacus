import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = ({ datasetId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const fetchData = async () => {
        if (!datasetId) return;
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.get(`${API_URL}/api/results/${datasetId}`);
            setData(res.data);
        } catch (err) {
            console.error("Error fetching results:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch when datasetId changes
    useEffect(() => {
        if (datasetId) {
            fetchData();
        }
    }, [datasetId]);

    // Polling logic - only runs when data is pending
    useEffect(() => {
        let interval;
        if (data && data.status === 'pending') {
            interval = setInterval(() => {
                fetchData();
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [data, datasetId]);

    // Reset page when dataset changes
    useEffect(() => {
        setCurrentPage(1);
    }, [datasetId]);

    if (!datasetId) return <div className="text-center text-gray-500 mt-10">Upload a file to see results.</div>;
    if (loading && !data) return <div className="text-center mt-10">Loading results...</div>;
    if (!data) return null;

    if (data.status === 'pending') {
        return (
            <div className="text-center mt-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing dataset... Please wait.</p>
            </div>
        );
    }

    if (data.status === 'failed') {
        return (
            <div className="bg-red-50 p-6 rounded-lg text-red-700 mt-6">
                <h3 className="font-bold text-lg">Processing Failed</h3>
                <p>There was an error processing your file.</p>
            </div>
        );
    }

    const { qualityScore, totalRows, anomaliesFound, results } = data;
    const { quality_report, anomaly_stats } = results || {};

    const qualityData = [
        { name: 'Missing Values', value: Object.values(quality_report?.missing_values || {}).reduce((a, b) => a + b, 0) },
        { name: 'Duplicates', value: quality_report?.duplicates || 0 },
        { name: 'Format Errors', value: quality_report?.format_errors || 0 },
        { name: 'Statistical Outliers', value: anomaly_stats?.ml_based_count || 0 }
    ];

    // Pagination Logic
    const sampleData = results?.sample_data || [];
    const totalPages = Math.ceil(sampleData.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = sampleData.slice(indexOfFirstRow, indexOfLastRow);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Quality Score</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className={`text-3xl font-bold ${qualityScore >= 90 ? 'text-green-600' : qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {qualityScore || 0}<span className="text-lg text-gray-400 font-normal">/100</span>
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Rows</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{totalRows.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Issues</p>
                    <div className="flex items-baseline space-x-2 mt-2">
                        <p className="text-3xl font-bold text-red-600">
                            {(quality_report?.total_instances || 0) + (anomaly_stats?.ml_based_count || 0)}
                        </p>
                        <p className="text-xs text-gray-500">in {anomaliesFound.toLocaleString()} rows</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Anomaly Rate</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">{anomaly_stats?.anomaly_percentage}%</p>
                </div>
            </div>

            {/* Charts Row - Only Bar Chart now */}
            <div className="grid grid-cols-1 shrink-0 h-64">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Total Data Quality Issues Detected</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={qualityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Data Preview Table - Fixed Height & Scrollable with Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-semibold text-gray-700">Detailed Analysis</h3>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                        <div className="flex space-x-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 text-xs font-medium rounded-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 text-xs font-medium rounded-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {sampleData.length > 0 && Object.keys(sampleData[0]).map((key) => (
                                    <th key={key} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                                        {key.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRows.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-gray-50 transition-colors ${row.is_anomaly ? 'bg-red-50/50' : ''}`}>
                                    {Object.entries(row).map(([key, val], i) => (
                                        <td key={i} className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {key === 'is_anomaly' ? (
                                                val ? <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Anomaly</span>
                                                    : <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Normal</span>
                                            ) : key === 'anomaly_reasons' ? (
                                                val ? <span className="text-red-600 text-xs">{val}</span> : <span className="text-gray-400">-</span>
                                            ) : (
                                                val.toString()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
