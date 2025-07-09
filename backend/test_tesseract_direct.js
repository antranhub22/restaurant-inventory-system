const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function testTesseract() {
  console.log('🧪 Testing Tesseract.js với tiếng Việt...');
  
  try {
    // 1. Kiểm tra file test
    const testImagePath = 'test_receipt.png';
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Không tìm thấy test_receipt.png');
      return;
    }
    
    console.log('✅ Found test image');
    
    // 2. Khởi tạo Tesseract worker với tiếng Việt + Anh
    console.log('📚 Initializing Tesseract worker...');
    const worker = await createWorker('vie+eng', 1, {
      logger: m => console.log(`Tesseract: ${m.status} - ${(m.progress * 100).toFixed(1)}%`)
    });
    
    // 3. Cấu hình tối ưu cho hóa đơn tiếng Việt
    console.log('⚙️  Configuring Tesseract...');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ .,():/-',
      tessedit_pageseg_mode: '6' // uniform block of text
    });
    
    // 4. Xử lý OCR
    console.log('🔍 Processing OCR...');
    const startTime = Date.now();
    const result = await worker.recognize(testImagePath);
    const processingTime = Date.now() - startTime;
    
    await worker.terminate();
    
    // 5. Hiển thị kết quả
    console.log('\n✨ KẾT QUẢ OCR:');
    console.log('================');
    console.log('📄 Text:', result.data.text);
    console.log('🎯 Confidence:', (result.data.confidence).toFixed(1), '%');
    console.log('⏱️  Processing time:', processingTime, 'ms');
    console.log('📊 Word count:', result.data.text.split(/\s+/).filter(Boolean).length);
    
    // 6. Phân tích từng line
    const lines = result.data.text.split('\n').map(line => line.trim()).filter(Boolean);
    console.log('\n📝 Chi tiết từng dòng:');
    lines.forEach((line, index) => {
      console.log(`  ${index + 1}. "${line}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTesseract(); 