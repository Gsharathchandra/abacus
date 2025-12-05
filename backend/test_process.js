const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(path.join(__dirname, 'dummy.csv')));
        form.append('datasetId', '111111111111111111111111'); // 24 hex chars dummy ID

        console.log('Sending POST to http://localhost:8000/process');

        const response = await axios.post('http://localhost:8000/process', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Success:', response.data);
    } catch (e) {
        console.error('Process failed:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data));
        }
    }
}

test();
