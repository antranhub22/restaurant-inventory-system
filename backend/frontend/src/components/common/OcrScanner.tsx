import React, { useState, useRef } from 'react';
import Button from './Button';
import Card from './Card';
import axios from 'axios';

export interface OcrResult {
  supplier: string;
  date: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface OcrScannerProps {
  onResult: (result: OcrResult) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

const OcrScanner: React.FC<OcrScannerProps> = ({ onResult, onError, onCancel, className = '' }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const errorMsg = 'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setImage(imageData);
        stopCamera();
        processOcr(imageData);
      }
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const imageData = ev.target?.result as string;
        setImage(imageData);
        processOcr(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOcr = async (imageData: string) => {
    setLoading(true);
    setError('');
    try {
      // Convert base64 to blob
      const res = await fetch(imageData);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'receipt.jpg');

      const response = await axios.post<{ data: OcrResult }>('/api/ocr/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onResult(response.data.data);
    } catch (err) {
      let errorMsg = 'Lỗi không xác định khi xử lý OCR.';
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.error?.message || 'Lỗi khi xử lý OCR.';
      }
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    startCamera();
  };

  const handleCancel = () => {
    stopCamera();
    setImage(null);
    setError('');
    onCancel?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!image && !showCamera && (
        <div className="flex gap-2">
          <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />
          <Button variant="primary" onClick={() => fileInput.current?.click()}>Tải ảnh hóa đơn</Button>
          <Button variant="primary" onClick={startCamera}>Chụp ảnh hóa đơn</Button>
          {onCancel && <Button variant="secondary" onClick={handleCancel}>Hủy</Button>}
        </div>
      )}

      {showCamera && (
        <Card>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-[3/4] object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <Button variant="primary" onClick={capturePhoto}>Chụp ảnh</Button>
              <Button variant="secondary" onClick={handleCancel}>Hủy</Button>
            </div>
          </div>
        </Card>
      )}

      {image && !showCamera && (
        <Card>
          <div className="relative">
            <img
              src={image}
              alt="Hóa đơn"
              className="w-full aspect-[3/4] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <Button variant="secondary" onClick={handleRetake}>Chụp lại</Button>
              <Button variant="secondary" onClick={handleCancel}>Hủy</Button>
            </div>
          </div>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {loading && <div className="text-blue-600">Đang xử lý OCR...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
};

export default OcrScanner; 