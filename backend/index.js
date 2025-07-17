#!/usr/bin/env node

// Fallback entry point for Render deployment
// Redirects to the correct compiled server

console.log('🔄 Fallback index.js detected - redirecting to correct entry point...');

const path = require('path');
const fs = require('fs');

// Check if compiled version exists
const serverPath = path.join(__dirname, 'dist', 'server.js');
const appPath = path.join(__dirname, 'dist', 'app.js');

if (fs.existsSync(serverPath)) {
    console.log('✅ Loading dist/server.js...');
    require('./dist/server.js');
} else if (fs.existsSync(appPath)) {
    console.log('✅ Loading dist/app.js...');
    require('./dist/app.js');
} else {
    console.log('❌ No compiled files found. Running TypeScript directly...');
    
    // Try to run TypeScript directly
    try {
        require('tsx/cjs');
        require('./src/server.ts');
    } catch (error) {
        console.error('❌ Failed to run TypeScript:', error.message);
        
        // Last resort - try the render start script
        console.log('🆘 Executing render-start.sh as last resort...');
        const { spawn } = require('child_process');
        const child = spawn('./render-start.sh', { stdio: 'inherit', shell: true });
        
        child.on('error', (err) => {
            console.error('❌ Failed to execute render-start.sh:', err);
            process.exit(1);
        });
        
        child.on('exit', (code) => {
            process.exit(code);
        });
    }
}