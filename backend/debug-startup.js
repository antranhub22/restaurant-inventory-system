#!/usr/bin/env node
console.log('🔍 DEBUG: Starting script execution...');
console.log('📊 Environment check:');
console.log('   Working directory:', process.cwd());
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'missing');

const fs = require('fs');

console.log('📁 Checking file structure...');
console.log('   package.json exists:', fs.existsSync('./package.json'));
console.log('   prisma/schema.prisma exists:', fs.existsSync('./prisma/schema.prisma'));
console.log('   setup-prisma-for-render.js exists:', fs.existsSync('./setup-prisma-for-render.js'));

if (fs.existsSync('./prisma')) {
  console.log('📂 Prisma directory contents:');
  const files = fs.readdirSync('./prisma');
  files.forEach(file => console.log('   -', file));
}

console.log('✅ DEBUG script completed. Now calling setup-prisma-for-render.js...');

// Call the actual setup script
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runSetup() {
  try {
    const { stdout, stderr } = await execAsync('node setup-prisma-for-render.js');
    console.log('📋 Setup script output:', stdout);
    if (stderr) {
      console.log('⚠️ Setup script stderr:', stderr);
    }
    console.log('✅ Setup script completed successfully');
  } catch (error) {
    console.error('❌ ERROR calling setup-prisma-for-render.js:', error.message);
    if (error.stdout) console.log('📋 stdout:', error.stdout);
    if (error.stderr) console.log('📋 stderr:', error.stderr);
    process.exit(1);
  }
}

runSetup(); 