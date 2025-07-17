#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICATION: Deployment Fixes for MODULE_NOT_FOUND');
console.log('================================================================');

let issues = 0;
let fixes = 0;

function checkPassed(check) {
    console.log(`✅ ${check}`);
    fixes++;
}

function checkFailed(check) {
    console.log(`❌ ${check}`);
    issues++;
}

function checkWarning(check) {
    console.log(`⚠️  ${check}`);
}

// 1. Check root package.json main entry point
console.log('\n📦 1. Root Package.json Configuration:');
try {
    const rootPkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
    if (rootPkg.main === 'backend/dist/server.js') {
        checkPassed('Root package.json main points to correct entry point');
    } else {
        checkFailed(`Root package.json main is "${rootPkg.main}", should be "backend/dist/server.js"`);
    }
    
    if (rootPkg.scripts['start:prod']) {
        checkPassed('Production start script exists');
    } else {
        checkWarning('Production start script missing (optional)');
    }
} catch (e) {
    checkFailed('Cannot read root package.json: ' + e.message);
}

// 2. Check backend package.json
console.log('\n📦 2. Backend Package.json Configuration:');
try {
    const backendPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (backendPkg.main === 'dist/server.js') {
        checkPassed('Backend package.json main points to dist/server.js');
    } else {
        checkFailed(`Backend package.json main is "${backendPkg.main}", should be "dist/server.js"`);
    }
    
    if (backendPkg.scripts['build:verify']) {
        checkPassed('Build verification script exists');
    } else {
        checkFailed('Build verification script missing');
    }
    
    if (backendPkg.scripts['start:dev']) {
        checkPassed('Development start script exists');
    } else {
        checkWarning('Development start script missing (optional)');
    }
    
    // Check dependencies
    const hasTypeScript = backendPkg.dependencies?.typescript || backendPkg.devDependencies?.typescript;
    const hasTsx = backendPkg.dependencies?.tsx || backendPkg.devDependencies?.tsx;
    
    if (hasTypeScript) {
        checkPassed('TypeScript dependency present');
    } else {
        checkFailed('TypeScript dependency missing');
    }
    
    if (hasTsx) {
        checkPassed('tsx dependency present (fallback execution)');
    } else {
        checkWarning('tsx dependency missing (fallback execution not available)');
    }
    
} catch (e) {
    checkFailed('Cannot read backend package.json: ' + e.message);
}

// 3. Check TypeScript configuration
console.log('\n🔧 3. TypeScript Configuration:');
try {
    const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
    if (tsConfig.compilerOptions?.outDir === 'dist') {
        checkPassed('TypeScript outDir configured correctly');
    } else {
        checkFailed(`TypeScript outDir is "${tsConfig.compilerOptions?.outDir}", should be "dist"`);
    }
    
    if (tsConfig.compilerOptions?.rootDir === 'src') {
        checkPassed('TypeScript rootDir configured correctly');
    } else {
        checkWarning(`TypeScript rootDir is "${tsConfig.compilerOptions?.rootDir}", consider setting to "src"`);
    }
} catch (e) {
    checkFailed('Cannot read tsconfig.json: ' + e.message);
}

// 4. Check source files exist
console.log('\n📁 4. Source Files:');
const requiredFiles = [
    'src/server.ts',
    'src/app.ts'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        checkPassed(`${file} exists`);
    } else {
        checkFailed(`${file} missing`);
    }
});

// 5. Check if build creates the expected output
console.log('\n🏗️  5. Build Output Check:');
if (fs.existsSync('./dist/server.js')) {
    checkPassed('dist/server.js exists (previous build)');
    const stats = fs.statSync('./dist/server.js');
    console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   📅 Modified: ${stats.mtime.toISOString()}`);
} else {
    checkWarning('dist/server.js not found (need to run build)');
}

if (fs.existsSync('./dist/app.js')) {
    checkPassed('dist/app.js exists (previous build)');
} else {
    checkWarning('dist/app.js not found (not critical if server.js exists)');
}

// 6. Check Dockerfile
console.log('\n🐳 6. Dockerfile Configuration:');
try {
    const dockerfile = fs.readFileSync('./Dockerfile', 'utf8');
    
    if (dockerfile.includes('npm run build')) {
        checkPassed('Dockerfile includes build step');
    } else {
        checkFailed('Dockerfile missing build step');
    }
    
    if (dockerfile.includes('CMD ["./render-start.sh"]')) {
        checkPassed('Dockerfile uses render-start.sh');
    } else {
        checkWarning('Dockerfile may not use render-start.sh');
    }
    
    if (dockerfile.includes('test -f dist/server.js')) {
        checkPassed('Dockerfile includes build verification');
    } else {
        checkWarning('Dockerfile missing build verification');
    }
    
} catch (e) {
    checkFailed('Cannot read Dockerfile: ' + e.message);
}

// 7. Check startup script
console.log('\n🚀 7. Startup Script:');
try {
    const startScript = fs.readFileSync('./render-start.sh', 'utf8');
    
    if (startScript.includes('dist/server.js')) {
        checkPassed('render-start.sh checks for dist/server.js');
    } else {
        checkFailed('render-start.sh missing dist/server.js check');
    }
    
    if (startScript.includes('FALLBACK_MODE')) {
        checkPassed('render-start.sh has fallback mechanism');
    } else {
        checkWarning('render-start.sh missing fallback mechanism');
    }
    
    if (startScript.includes('exec node') && startScript.includes('exec npx tsx')) {
        checkPassed('render-start.sh supports both production and fallback execution');
    } else {
        checkWarning('render-start.sh missing dual execution support');
    }
    
} catch (e) {
    checkFailed('Cannot read render-start.sh: ' + e.message);
}

// 8. Check render.yaml
console.log('\n☁️  8. Render Configuration:');
try {
    const renderYaml = fs.readFileSync('../render.yaml', 'utf8');
    
    if (renderYaml.includes('dockerContext: ./backend')) {
        checkPassed('render.yaml has correct dockerContext');
    } else {
        checkWarning('render.yaml missing dockerContext (may cause build issues)');
    }
    
    if (renderYaml.includes('dockerfilePath: ./backend/Dockerfile')) {
        checkPassed('render.yaml has correct dockerfilePath');
    } else {
        checkFailed('render.yaml missing correct dockerfilePath');
    }
    
} catch (e) {
    checkWarning('Cannot read render.yaml: ' + e.message);
}

// Summary
console.log('\n📊 VERIFICATION SUMMARY:');
console.log('================================================================');
console.log(`✅ Fixes Applied: ${fixes}`);
console.log(`❌ Issues Found: ${issues}`);

if (issues === 0) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('✅ MODULE_NOT_FOUND errors should be resolved');
    console.log('✅ Entry point configuration is correct');
    console.log('✅ Build process should work on Render');
    console.log('✅ Fallback mechanisms are in place');
    console.log('\n🚀 Ready for deployment to Render!');
} else {
    console.log(`\n⚠️  ${issues} ISSUE(S) FOUND!`);
    console.log('Please fix the issues above before deploying.');
}

console.log('\n📝 Next Steps:');
console.log('1. Run "npm run build" to test build process');
console.log('2. Run "npm start" to test startup');
console.log('3. Commit and push changes to trigger Render deployment');
console.log('4. Monitor Render logs for successful startup');

process.exit(issues === 0 ? 0 : 1);