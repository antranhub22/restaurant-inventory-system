#!/usr/bin/env node

// Root-level entry point for Render deployment
// This handles the case where Render ignores Docker config and runs node directly

console.log('🔄 Root index.js detected - redirecting to backend...');

const path = require('path');
const fs = require('fs');

// Check backend compiled files
const backendServerPath = path.join(__dirname, 'backend', 'dist', 'server.js');
const backendAppPath = path.join(__dirname, 'backend', 'dist', 'app.js');
const backendFallback = path.join(__dirname, 'backend', 'index.js');

if (fs.existsSync(backendServerPath)) {
    console.log('✅ Loading backend/dist/server.js...');
    require('./backend/dist/server.js');
} else if (fs.existsSync(backendAppPath)) {
    console.log('✅ Loading backend/dist/app.js...');
    require('./backend/dist/app.js');
} else if (fs.existsSync(backendFallback)) {
    console.log('✅ Loading backend fallback index.js...');
    require('./backend/index.js');
} else {
    console.log('❌ No backend entry points found!');
    console.log('💡 Available files:');
    
    // List available files for debugging
    const backendDir = path.join(__dirname, 'backend');
    if (fs.existsSync(backendDir)) {
        console.log('   Backend directory contents:');
        fs.readdirSync(backendDir).forEach(file => {
            console.log(`   - ${file}`);
        });
        
        const distDir = path.join(backendDir, 'dist');
        if (fs.existsSync(distDir)) {
            console.log('   Backend/dist directory contents:');
            fs.readdirSync(distDir).forEach(file => {
                console.log(`   - dist/${file}`);
            });
        }
    }
    
    console.error('❌ Cannot start server - no valid entry point found');
    process.exit(1);
}