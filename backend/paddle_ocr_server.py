from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import os
import tempfile

app = Flask(__name__)

# Khởi tạo PaddleOCR với tiếng Việt - simple configuration
print("🚀 Initializing PaddleOCR...")
ocr = PaddleOCR(lang='vi')
print("✅ PaddleOCR initialized successfully!")

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    image = request.files['image']
    
    # Create temporary file with proper extension
    temp_path = None
    try:
        # Save to temporary file with .png extension
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
            temp_path = tmp.name
            image.save(temp_path)
        
        # Process OCR
        result = ocr.predict(temp_path)
        print(f"✅ OCR result: {result}")
        
    except Exception as e:
        print(f"❌ OCR Error: {e}")
        return jsonify({'error': f'OCR processing failed: {str(e)}'}), 500
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
    
    # Parse new PaddleOCR result format
    lines = []
    if result and len(result) > 0:
        first_result = result[0]  # Get first page result
        
        # Extract texts and scores from new format
        if 'rec_texts' in first_result and 'rec_scores' in first_result:
            texts = first_result['rec_texts']
            scores = first_result['rec_scores']
            
            for text, score in zip(texts, scores):
                lines.append({
                    'text': text,
                    'confidence': float(score)
                })
        else:
            print("⚠️ Unexpected result format")
            
    return jsonify({'lines': lines})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'PaddleOCR Server'})

@app.route('/', methods=['GET'])
def root():
    return jsonify({'service': 'PaddleOCR Server', 'status': 'running', 'endpoints': ['/ocr', '/health']})

if __name__ == '__main__':
    print("🚀 Starting PaddleOCR Server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)