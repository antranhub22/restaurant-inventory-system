import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { FormType } from '../types/form-template';
import useOCRForm from '../hooks/useOCRForm';

const CameraCapture: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormType, setSelectedFormType] = useState<FormType>(FormType.IMPORT);
  
  const { processOCRForm, isLoading } = useOCRForm();

  const startCamera = async () => {
    setError('');
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
        setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
      }
      stopCamera();
    }
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  // Convert base64 to File object
  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleOCR = async () => {
    if (!photo) return;

    setLoading(true);
    try {
      const file = base64ToFile(photo, 'captured-image.jpg');
      await processOCRForm(file, selectedFormType);
      // Navigate to OCR page after successful processing
      navigate('/ocr');
    } catch (err) {
      setError('Lỗi khi xử lý OCR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToOCR = () => {
    navigate('/ocr');
  };

  return (
    <Layout header={<div className="text-2xl font-bold">Chụp ảnh hóa đơn</div>}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center gap-4">
            
            {/* Instructions */}
            <div className="w-full mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Hướng dẫn:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Nhấn "Bắt đầu chụp ảnh" để mở camera</li>
                <li>Chọn loại phiếu phù hợp</li>
                <li>Đưa hóa đơn vào khung hình và nhấn "Chụp ảnh"</li>
                <li>Kiểm tra ảnh và nhấn "Gửi OCR" để xử lý</li>
              </ol>
            </div>

            {/* Form Type Selection */}
            {(photo || streaming) && (
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phiếu
                </label>
                <select
                  value={selectedFormType}
                  onChange={(e) => setSelectedFormType(e.target.value as FormType)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={FormType.IMPORT}>Nhập kho</option>
                  <option value={FormType.EXPORT}>Xuất kho</option>
                  <option value={FormType.RETURN}>Hoàn kho</option>
                  <option value={FormType.ADJUSTMENT}>Điều chỉnh</option>
                  <option value={FormType.WASTE}>Hao hụt</option>
                </select>
              </div>
            )}

            {/* Start Camera Button */}
            {!streaming && !photo && (
              <Button 
                variant="primary" 
                onClick={startCamera}
                className="w-full max-w-md"
              >
                📷 Bắt đầu chụp ảnh
              </Button>
            )}

            {/* Error Display */}
            {error && (
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Camera/Photo Display */}
            <div className="w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
              {streaming && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                  {/* Camera overlay */}
                  <div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none">
                    <div className="absolute inset-4 border border-white/50 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white"></div>
                    </div>
                  </div>
                </>
              )}
              
              {!streaming && photo && (
                <img 
                  src={photo} 
                  alt="Hóa đơn đã chụp" 
                  className="w-full h-full object-contain" 
                />
              )}

              {!streaming && !photo && (
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">Sẵn sàng chụp ảnh</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex gap-2 w-full max-w-md">
              {streaming && (
                <Button 
                  variant="primary" 
                  onClick={takePhoto}
                  className="flex-1"
                >
                  📷 Chụp ảnh
                </Button>
              )}
              
              {photo && !loading && (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={retake}
                    className="flex-1"
                  >
                    🔄 Chụp lại
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleOCR}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Đang xử lý...' : '🚀 Gửi OCR'}
                  </Button>
                </>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800">Đang xử lý OCR...</span>
                </div>
              </div>
            )}

            {/* Alternative Action */}
            <div className="w-full pt-4 border-t border-gray-200">
              <Button 
                variant="secondary" 
                onClick={handleGoToOCR}
                className="w-full"
              >
                📝 Chuyển đến trang OCR chính
              </Button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CameraCapture; 