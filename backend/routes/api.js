const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const Dataset = require('../models/Dataset');
const fs = require('fs');

// Configure Multer for file upload
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// POST /api/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Create initial record
        const newDataset = new Dataset({
            filename: req.file.filename,
            status: 'pending'
        });
        await newDataset.save();

        // Trigger Python Service (Async)
        // Stream file to ML Service
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path));
        form.append('datasetId', newDataset._id.toString());

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

        axios.post(`${mlServiceUrl}/process`, form, {
            headers: {
                ...form.getHeaders()
            }
        }).catch(err => {
            console.error('Error triggering Python service:', err.message);
            newDataset.status = 'failed';
            newDataset.save();
        });

        res.json({ message: 'File uploaded, processing started', id: newDataset._id });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/results/:id
router.get('/results/:id', async (req, res) => {
    try {
        const dataset = await Dataset.findById(req.params.id);
        if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
        res.json(dataset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/datasets (List all)
router.get('/datasets', async (req, res) => {
    try {
        const datasets = await Dataset.find().sort({ uploadDate: -1 });
        res.json(datasets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
