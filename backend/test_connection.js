const axios = require('axios');

async function test() {
    try {
        console.log('Testing connection to ML Service at http://localhost:8000/');
        const response = await axios.get('http://localhost:8000/');
        console.log('Success! Response:', response.data);
    } catch (e) {
        console.error('Connection failed:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', e.response.data);
        } else if (e.code) {
            console.error('Error Code:', e.code);
        }
    }
}

test();
