const { createWorker, PSM } = require('tesseract.js');
const fs = require('fs');

async function testOptimizedTesseract() {
  console.log('🧪 Testing Optimized Tesseract.js...');
  
  try {
    const testImagePath = 'test_receipt.png';
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Không tìm thấy test_receipt.png');
      return;
    }
    
    console.log('✅ Found test image');
    
    // Khởi tạo worker
    console.log('📚 Initializing Tesseract worker...');
    const worker = await createWorker('vie+eng', 1, {
      logger: m => console.log(`Tesseract: ${m.status} - ${(m.progress * 100).toFixed(1)}%`)
    });
    
    // Cấu hình tối ưu mới
    console.log('⚙️ Applying optimized config...');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ .,():/-×=',
      tesseract_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: 1,
      tessedit_enable_dict_correction: 1,
      tessedit_enable_bigram_correction: 1,
      load_freq_dawg: 1,
      load_punc_dawg: 1,
      load_system_dawg: 1,
      numeric_punctuation: '.,'
    });
    
    // Xử lý OCR
    console.log('🔍 Processing OCR...');
    const startTime = Date.now();
    const result = await worker.recognize(testImagePath);
    const processingTime = Date.now() - startTime;
    
    await worker.terminate();
    
    console.log('\n✨ KẾT QUẢ TESSERACT TỐI ƯU:');
    console.log('===========================');
    console.log('📄 Text:', result.data.text);
    console.log('🎯 Confidence:', (result.data.confidence).toFixed(1), '%');
    console.log('⏱️ Processing time:', processingTime, 'ms');
    
    // So sánh với kết quả cũ
    console.log('\n📊 ĐÁNH GIÁ:');
    console.log('- Tesseract cũ: 63% confidence');
    console.log('- Tesseract tối ưu:', (result.data.confidence).toFixed(1), '% confidence');
    console.log('- Cải thiện:', (result.data.confidence - 63).toFixed(1), '%');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOptimizedTesseract(); 