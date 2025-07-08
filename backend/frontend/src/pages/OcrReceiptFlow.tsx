import React, { useRef, useState } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import api from '../utils/api';
import { AxiosError } from 'axios';
import sampleData from '../data/sample_data.json';
import { SampleData, Receipt } from '../types/sample_data';
import { useAuthStore } from '../store';

const data = sampleData as SampleData;
const sampleReceipts = data.sample_receipts;

interface OcrResult {
  rawText: string;           // Toàn bộ text trích xuất được
  confidence: number;        // Độ tin cậy trung bình
  wordCount: number;         // Số từ đã trích xuất
  processingTime: number;    // Thời gian xử lý (ms)
}

const OcrReceiptFlow: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Khởi động camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  // Dừng camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setShowCamera(false);
    }
  };

  // Chụp ảnh từ camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Lấy kích thước thực của video
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Vẽ frame hiện tại từ video lên canvas
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // Chuyển canvas thành base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setImage(imageData);
        
        // Chuyển base64 thành file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            setFile(file);
          }
        }, 'image/jpeg', 0.8);
      }
      
      stopCamera();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSample = (img: string) => {
    setImage(img);
    setFile(null);
    setResult(null);
    setError('');
  };

  const handleOcr = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let formData = new FormData();
      if (file) {
        formData.append('image', file);
      } else if (image) {
        // convert base64 to blob
        const res = await fetch(image);
        const blob = await res.blob();
        formData.append('image', blob, 'receipt.jpg');
      } else {
        setError('Vui lòng chọn hoặc tải lên ảnh hóa đơn.');
        setLoading(false);
        return;
      }

      const token = useAuthStore.getState().token;
      if (!token) {
        setError('Vui lòng đăng nhập để sử dụng tính năng này.');
        setLoading(false);
        return;
      }

      const response = await api.post<{ data: OcrResult }>('/ocr/process-receipt', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.data) {
        setResult(response.data.data);
      } else {
        throw new Error('Không nhận được kết quả OCR');
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi gửi ảnh lên OCR.';
        setError(errorMsg);
        if (err.response?.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
        }
      } else {
        setError('Lỗi không xác định khi xử lý OCR.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError('');
    startCamera();
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (result?.rawText) {
      navigator.clipboard.writeText(result.rawText).then(() => {
        alert('Đã sao chép văn bản vào clipboard!');
      }).catch(() => {
        alert('Không thể sao chép văn bản!');
      });
    }
  };

  return (
    <Layout header={<div className="text-2xl font-bold">Xử lý biên lai OCR</div>}>
      <div className="max-w-md mx-auto flex flex-col items-center gap-4">
        <div className="w-full flex flex-col gap-2">
          <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" onClick={() => fileInput.current?.click()}>Tải ảnh lên</Button>
            <Button variant="primary" onClick={startCamera}>Chụp ảnh mới</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleReceipts.map((r: Receipt) => (
              <Button key={r.id} variant="secondary" onClick={() => handleSample(r.image)}>
                {r.supplier} ({r.type})
              </Button>
            ))}
          </div>
        </div>

        {/* Camera View */}
        {showCamera && (
          <Card className="w-full">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-[3/4] object-cover rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button variant="primary" onClick={capturePhoto}>Chụp ảnh</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Preview Image */}
        {image && !showCamera && (
          <Card className="w-full">
            <div className="relative">
              <img
                src={image}
                alt="Hóa đơn"
                className="w-full aspect-[3/4] object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <Button variant="secondary" onClick={handleRetake}>Chụp lại</Button>
                {!result && <Button variant="primary" onClick={handleOcr} loading={loading}>Xử lý OCR</Button>}
              </div>
            </div>
          </Card>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {loading && <div className="text-blue-600">Đang xử lý OCR...</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}

        {/* OCR Results */}
        {result && (
          <Card className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Kết quả OCR</h3>
              <Button variant="secondary" onClick={handleCopyText}>
                Sao chép văn bản
              </Button>
            </div>
            
            {/* Metadata */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Số từ trích xuất:</span>
                <span className="font-medium">{result.wordCount} từ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Độ tin cậy:</span>
                <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian xử lý:</span>
                <span className="font-medium">{result.processingTime}ms</span>
              </div>
            </div>

            {/* Raw text content */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-2 text-sm text-gray-600">Nội dung văn bản:</h4>
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {result.rawText}
              </pre>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setResult(null)}>Xử lý lại</Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default OcrReceiptFlow; 