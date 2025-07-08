import React, { useRef, useState } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';

const CameraCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      setStreaming(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        setPhoto(canvasRef.current.toDataURL('image/png'));
      }
      stopCamera();
    }
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const handleOCR = async () => {
    setLoading(true);
    try {
      // Giả lập gọi API OCR
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('OCR xử lý thành công!');
    } catch (err) {
      setError('Lỗi khi xử lý OCR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout header={<div className="text-2xl font-bold">Chụp ảnh hóa đơn</div>}>
      <div className="max-w-md mx-auto flex flex-col items-center gap-4">
        {!streaming && !photo && (
          <Button variant="primary" onClick={startCamera}>Bắt đầu chụp ảnh</Button>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
          {streaming && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
          )}
          {!streaming && photo && (
            <img src={photo} alt="Hóa đơn đã chụp" className="w-full h-full object-contain rounded-lg" />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {streaming && (
          <Button variant="primary" onClick={takePhoto}>Chụp ảnh</Button>
        )}
        {photo && !loading && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={retake}>Chụp lại</Button>
            <Button variant="primary" onClick={handleOCR}>Gửi OCR</Button>
          </div>
        )}
        {loading && <div className="text-blue-600">Đang xử lý OCR...</div>}
      </div>
    </Layout>
  );
};

export default CameraCapture; 