const { spawn } = require('child_process');
const path = require('path');

const colors = {
    backend: '\x1b[34m', // Blue
    ml: '\x1b[33m',      // Yellow
    frontend: '\x1b[32m', // Green
    reset: '\x1b[0m'
};

function startService(name, command, args, cwd, color) {
    console.log(`${color}[${name}] Starting...${colors.reset}`);

    const process = spawn(command, args, {
        cwd: cwd,
        shell: true,
        stdio: 'pipe'
    });

    process.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) console.log(`${color}[${name}] ${line.trim()}${colors.reset}`);
        });
    });

    process.stderr.on('data', (data) => {
        console.error(`${color}[${name} ERROR] ${data.toString().trim()}${colors.reset}`);
    });

    process.on('close', (code) => {
        console.log(`${color}[${name}] Exited with code ${code}${colors.reset}`);
    });

    return process;
}

// Paths
const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const mlDir = path.join(rootDir, 'ml_service');
const frontendDir = path.join(rootDir, 'frontend');

// Start Backend
const backend = startService('Backend', 'npm', ['start'], backendDir, colors.backend);

// Start ML Service
// Assuming python is in path. Might be 'python' or 'python3'
const ml = startService('ML Service', 'python', ['main.py'], mlDir, colors.ml);

// Start Frontend
const frontend = startService('Frontend', 'npm', ['run', 'dev'], frontendDir, colors.frontend);

// Handle exit
process.on('SIGINT', () => {
    console.log('\nStopping all services...');
    backend.kill();
    ml.kill();
    frontend.kill();
    process.exit();
});
