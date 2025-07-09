#!/bin/bash

echo "🚀 Starting PaddleOCR Server..."
echo "📍 Working directory: $(pwd)"
echo "🐍 Python version: $(python3 --version)"

# Start PaddleOCR server
python3 paddle_ocr_server.py 