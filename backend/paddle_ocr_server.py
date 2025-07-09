from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import os
import tempfile

app = Flask(__name__)

# Khởi tạo PaddleOCR với tiếng Việt, tối ưu cho hóa đơn
ocr = PaddleOCR(use_angle_cls=True, lang='vi', rec=True, det=True, use_gpu=False)

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
    for line in result:
        for box, (text, conf) in line:
            lines.append({'text': text, 'confidence': float(conf)})
    return jsonify({'lines': lines})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)