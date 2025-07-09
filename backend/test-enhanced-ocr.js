const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_IMAGE = 'test.png'; // Your Vietnamese receipt image

// Test scenarios
const testScenarios = [
  {
    name: 'Original OCR (Vision API Mock)',
    env: {
      FORCE_VISION_FAIL: 'false',
      OCR_ENHANCEMENT_LEVEL: 'none',
      AI_OCR_CORRECTION: 'false'
    }
  },
  {
    name: 'Tesseract with Basic Enhancement',
    env: {
      FORCE_VISION_FAIL: 'true',
      OCR_ENHANCEMENT_LEVEL: 'basic',
      AI_OCR_CORRECTION: 'false'
    }
  },
  {
    name: 'Tesseract with Aggressive Enhancement',
    env: {
      FORCE_VISION_FAIL: 'true',
      OCR_ENHANCEMENT_LEVEL: 'aggressive',
      AI_OCR_CORRECTION: 'false'
    }
  },
  {
    name: 'Tesseract with Maximum Enhancement',
    env: {
      FORCE_VISION_FAIL: 'true',
      OCR_ENHANCEMENT_LEVEL: 'maximum',
      AI_OCR_CORRECTION: 'false'
    }
  },
  {
    name: 'Tesseract + AI Correction (Best)',
    env: {
      FORCE_VISION_FAIL: 'true',
      OCR_ENHANCEMENT_LEVEL: 'auto',
      AI_OCR_CORRECTION: 'true'
    }
  }
];

// Expected results for Vietnamese receipt
const expectedItems = [
  'Cá chua',
  'Ngô ngọt', 
  'Rau muống',
  'Cải ngọt',
  'Hành lá',
  'Giá đỗ',
  'Lá lót',
  'Cà rót'
];

async function testOCRScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log('─'.repeat(50));
  
  try {
    // Update environment for this test
    for (const [key, value] of Object.entries(scenario.env)) {
      process.env[key] = value;
    }
    
    // Read test image
    if (!fs.existsSync(TEST_IMAGE)) {
      console.log('❌ Test image not found:', TEST_IMAGE);
      return { success: false, error: 'Test image not found' };
    }
    
    const imageBuffer = fs.readFileSync(TEST_IMAGE);
    console.log(`📁 Image size: ${imageBuffer.length} bytes`);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-receipt.png',
      contentType: 'image/png'
    });
    
    // Call OCR API
    const startTime = Date.now();
    const response = await axios.post(`${BACKEND_URL}/api/ocr/process`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000 // 2 minutes timeout
    });
    
    const processingTime = Date.now() - startTime;
    const result = response.data;
    
    // Analyze results
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`🎯 OCR confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📝 Raw text length: ${result.rawText.length} characters`);
    
    // Check AI corrections if available
    if (result.metadata?.aiCorrections?.length > 0) {
      console.log(`🤖 AI corrections applied: ${result.metadata.aiCorrections.length}`);
      result.metadata.aiCorrections.forEach(correction => {
        console.log(`   "${correction.original}" → "${correction.corrected}"`);
      });
    }
    
    // Check image quality analysis
    if (result.metadata?.imageQuality) {
      const quality = result.metadata.imageQuality;
      console.log(`📊 Image quality: ${quality.quality} (score: ${quality.score})`);
      console.log(`🔧 Enhancement level: ${result.metadata.enhancementLevel || 'none'}`);
    }
    
    // Calculate accuracy for Vietnamese items
    const detectedText = result.rawText.toLowerCase();
    const detectedItems = expectedItems.filter(item => 
      detectedText.includes(item.toLowerCase())
    );
    
    const accuracy = (detectedItems.length / expectedItems.length) * 100;
    console.log(`📋 Items detected: ${detectedItems.length}/${expectedItems.length} (${accuracy.toFixed(1)}%)`);
    
    // Show detected vs expected
    console.log('\n📋 Item Detection Results:');
    expectedItems.forEach(expectedItem => {
      const detected = detectedText.includes(expectedItem.toLowerCase());
      console.log(`   ${detected ? '✅' : '❌'} ${expectedItem}`);
    });
    
    // Show actual detected text snippet
    console.log('\n📄 Raw OCR Text (first 200 chars):');
    console.log(result.rawText.substring(0, 200) + '...');
    
    return {
      success: true,
      scenario: scenario.name,
      processingTime,
      confidence: result.confidence,
      accuracy: accuracy / 100,
      detectedItems: detectedItems.length,
      totalItems: expectedItems.length,
      aiCorrections: result.metadata?.aiCorrections?.length || 0,
      imageQuality: result.metadata?.imageQuality?.quality || 'unknown',
      enhancementLevel: result.metadata?.enhancementLevel || 'none',
      rawTextLength: result.rawText.length
    };
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return { 
      success: false, 
      scenario: scenario.name,
      error: error.message 
    };
  }
}

async function runAllTests() {
  console.log('🚀 Enhanced OCR Accuracy Test Suite');
  console.log('═'.repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test image: ${TEST_IMAGE}`);
  console.log(`Expected items: ${expectedItems.join(', ')}`);
  
  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await testOCRScenario(scenario);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary report
  console.log('\n📊 SUMMARY REPORT');
  console.log('═'.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  
  if (successfulTests.length === 0) {
    console.log('❌ No tests completed successfully');
    return;
  }
  
  // Sort by accuracy
  successfulTests.sort((a, b) => b.accuracy - a.accuracy);
  
  console.log('\nRanking by Accuracy:');
  successfulTests.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    console.log(`${medal} ${result.scenario}`);
    console.log(`    Accuracy: ${(result.accuracy * 100).toFixed(1)}% (${result.detectedItems}/${result.totalItems} items)`);
    console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`    Processing: ${result.processingTime}ms`);
    console.log(`    AI Corrections: ${result.aiCorrections}`);
    console.log(`    Image Quality: ${result.imageQuality}`);
    console.log('');
  });
  
  // Best configuration recommendation
  const bestResult = successfulTests[0];
  console.log('🎯 RECOMMENDED CONFIGURATION:');
  console.log(`   Scenario: ${bestResult.scenario}`);
  console.log(`   Expected accuracy: ${(bestResult.accuracy * 100).toFixed(1)}%`);
  console.log(`   Processing time: ${bestResult.processingTime}ms`);
  
  // Environment variables for production
  const bestScenario = testScenarios.find(s => s.name === bestResult.scenario);
  console.log('\n🔧 Production Environment Variables:');
  Object.entries(bestScenario.env).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });
  
  console.log('\n✅ Test suite completed!');
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Enhanced OCR Test Suite

Usage:
  node test-enhanced-ocr.js [options]

Options:
  --help     Show this help message
  --image    Specify test image path (default: test.png)
  --backend  Specify backend URL (default: http://localhost:3000)

Examples:
  node test-enhanced-ocr.js
  node test-enhanced-ocr.js --image receipt.jpg --backend http://localhost:3001
`);
  process.exit(0);
}

// Override defaults from command line
const imageIndex = process.argv.indexOf('--image');
if (imageIndex !== -1 && process.argv[imageIndex + 1]) {
  TEST_IMAGE = process.argv[imageIndex + 1];
}

const backendIndex = process.argv.indexOf('--backend');
if (backendIndex !== -1 && process.argv[backendIndex + 1]) {
  BACKEND_URL = process.argv[backendIndex + 1];
}

// Run tests
runAllTests().catch(console.error); 