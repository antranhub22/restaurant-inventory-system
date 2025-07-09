#!/usr/bin/env python3
print("🔍 Testing PaddleOCR installation...")

try:
    print("📦 Importing PaddleOCR...")
    from paddleocr import PaddleOCR
    print("✅ PaddleOCR imported successfully")
    
    print("🚀 Initializing PaddleOCR with minimal config...")
    ocr = PaddleOCR(lang='vi')
    print("✅ PaddleOCR initialized successfully")
    
    print("🎯 PaddleOCR is ready to use!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 