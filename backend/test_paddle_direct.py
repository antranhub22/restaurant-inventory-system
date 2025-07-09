#!/usr/bin/env python3
import sys
import os

print("🧪 Testing PaddleOCR directly...")

try:
    from paddleocr import PaddleOCR
    print("✅ PaddleOCR imported successfully")
    
    # Test with a simple image
    if os.path.exists('test.png'):
        print("🖼️  Found test.png, testing OCR...")
        ocr = PaddleOCR(lang='vi')
        print("✅ PaddleOCR initialized")
        
        # Use new API: predict() instead of ocr(), without cls parameter
        result = ocr.predict('test.png')
        print("✅ OCR processing completed")
        
        if result and len(result) > 0:
            print(f"📄 Found {len(result)} text elements:")
            for i, line in enumerate(result):
                if len(line) >= 2:
                    box, (text, conf) = line
                    print(f"  {i+1}. Text: '{text}' (confidence: {conf:.2f})")
        else:
            print("⚠️  No text detected in image")
            
    else:
        print("❌ test.png not found")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("�� Test completed") 