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
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        image.save(tmp.name)
        result = ocr.ocr(tmp.name, cls=True)
        os.unlink(tmp.name)
    # Chuyển kết quả về định dạng đơn giản
    lines = []
    if result and result[0]:  # Check if result is not None and not empty
        for line in result[0]:  # result[0] contains the OCR results
            if len(line) >= 2:  # Ensure line has both box and text info
                box, (text, conf) = line
                lines.append({'text': text, 'confidence': float(conf)})
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