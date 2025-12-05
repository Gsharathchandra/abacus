const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
    filename: String,
    uploadDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }, // pending, processing, completed, failed
    qualityScore: Number,
    totalRows: Number,
    anomaliesFound: Number,
    results: Object // Store the full JSON report from Python here
});

module.exports = mongoose.model('Dataset', DatasetSchema);
