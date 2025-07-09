const fs = require('fs');
const path = require('path');

// Set environment to force Tesseract
process.env.FORCE_VISION_FAIL = 'true';

async function testEnhancedOCR() {
  console.log('🧪 Testing Enhanced OCR with Table Detection...');
  console.log('FORCE_VISION_FAIL:', process.env.FORCE_VISION_FAIL);
  
  try {
    // Import the OCR service
    const ocrService = require('./dist/services/ocr.service.js').default;
    
    // Read test image - you can replace with your real receipt image
    const imagePath = path.join(__dirname, 'test.png');
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Không tìm thấy test.png. Tạo ảnh test giả...');
      // Create a small test buffer for demonstration
      const testBuffer = Buffer.from('Test image data');
      fs.writeFileSync(imagePath, testBuffer);
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log('📸 Processing with Enhanced OCR service...');
    const result = await ocrService.processReceipt(imageBuffer);
    
    console.log('\n✨ KẾT QUẢ ENHANCED OCR:');
    console.log('============================');
    console.log('📄 Text:', result.rawText.substring(0, 200) + '...');
    console.log('🎯 Confidence:', (result.confidence * 100).toFixed(1) + '%');
    console.log('⏱️ Processing time:', result.processingTime + 'ms');
    console.log('🔧 Contents found:', result.contents.length);
    
    if (result.metadata?.imageOptimization) {
      console.log('🖼️ Image optimization:', result.metadata.imageOptimization.compressionRatio?.toFixed(1) + '% size change');
    }
    
    console.log('\n📊 CẢI THIỆN SO VỚI TRƯỚC:');
    console.log('================================');
    console.log('✅ Table-specific image preprocessing');
    console.log('✅ Dynamic Tesseract config based on table detection');
    console.log('✅ Vietnamese text corrections');
    console.log('✅ Enhanced table structure parsing');
    console.log('✅ Better PSM mode selection (Auto vs Uniform Block)');
    
    console.log('\n🎯 EXPECTATION:');
    console.log('===============');
    console.log('- Accuracy cải thiện từ 30% → 60-80%');
    console.log('- Table structure detection tốt hơn');
    console.log('- Vietnamese text mapping chính xác hơn');
    console.log('- Fewer false negatives cho items trong table');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

console.log('\n📋 SUMMARY OF IMPROVEMENTS:');
console.log('============================');
console.log('1. ⚙️ PSM Mode: SINGLE_BLOCK → AUTO (better table detection)');
console.log('2. 🖼️ Image Enhancement: Grayscale + Normalize + Sharpen for table lines');
console.log('3. 🔧 Dynamic Config: Table detection → optimized parameters');
console.log('4. 🇻🇳 Vietnamese Corrections: Common OCR mistakes fixed');
console.log('5. 📊 Structured Data: Parse table columns and rows');
console.log('6. 📈 Post-processing: Enhanced text formatting and cleanup');

testEnhancedOCR(); 