import React, { useState, useRef } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import sampleData from '../data/sample_data.json';
import { SampleData } from '../types/sample_data';
import api from '../utils/api';

const data = sampleData as SampleData;
const transactions = data.sample_transactions;
const items = data.sample_items;
const units = data.units;

interface OcrResult {
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

function getUnitName(unit_id: number): string {
  const unit = units.find(u => u.id === unit_id);
  return unit ? unit.abbreviation : '';
}

const TransactionHistory: React.FC = () => {
  const [itemId, setItemId] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filtered = itemId ? transactions.filter(t => String(t.item_id) === itemId) : transactions;

  // Camera functions
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

      const response = await api.post<{ data: OcrResult }>('/ocr/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOcrResult(response.data.data);
    } catch (err: any) {
      if (err.response) {
        setError(err.response?.data?.error?.message || 'Lỗi khi xử lý OCR.');
      } else {
        setError('Lỗi không xác định khi xử lý OCR.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = () => {
    // TODO: Implement create transaction logic
    setShowNewModal(false);
    setImage(null);
    setOcrResult(null);
  };

  return (
    <Layout header={
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">Lịch sử giao dịch</div>
        <Button variant="primary" onClick={() => setShowNewModal(true)}>+ Tạo phiếu nhập kho</Button>
      </div>
    }>
      <div className="mb-4 max-w-xs">
        <label className="block mb-1 font-medium text-gray-700">Lọc theo hàng hóa</label>
        <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2">
          <option value="">Tất cả hàng hóa</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <Card header="Danh sách giao dịch">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1">Số phiếu</th>
                <th className="px-2 py-1">Hàng hóa</th>
                <th className="px-2 py-1">Loại</th>
                <th className="px-2 py-1">Số lượng</th>
                <th className="px-2 py-1">Giá trị</th>
                <th className="px-2 py-1">Bộ phận</th>
                <th className="px-2 py-1">Ngày</th>
                <th className="px-2 py-1">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-4">Không có giao dịch</td></tr>
              )}
              {filtered.map(t => {
                const item = items.find(i => i.id === t.item_id);
                return (
                  <tr key={t.id} className="border-b">
                    <td className="px-2 py-1">{t.transaction_number}</td>
                    <td className="px-2 py-1">{item?.name || 'Không rõ'}</td>
                    <td className="px-2 py-1">{t.type}</td>
                    <td className="px-2 py-1">{t.quantity} {item ? getUnitName(item.unit_id) : ''}</td>
                    <td className="px-2 py-1">{t.total_value.toLocaleString('vi-VN')} VND</td>
                    <td className="px-2 py-1">{t.department}</td>
                    <td className="px-2 py-1">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    <td className="px-2 py-1">{t.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal tạo phiếu nhập kho */}
      <Modal 
        open={showNewModal} 
        onClose={() => {
          setShowNewModal(false);
          setImage(null);
          setOcrResult(null);
          stopCamera();
        }}
        title="Tạo phiếu nhập kho"
      >
        <div className="p-4 space-y-4">
          {!image && !showCamera && (
            <div className="flex gap-2">
              <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />
              <Button variant="primary" onClick={() => fileInput.current?.click()}>Tải ảnh hóa đơn</Button>
              <Button variant="primary" onClick={startCamera}>Chụp ảnh hóa đơn</Button>
            </div>
          )}

          {showCamera && (
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
          )}

          {image && !showCamera && (
            <div className="relative">
              <img
                src={image}
                alt="Hóa đơn"
                className="w-full aspect-[3/4] object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => {
                  setImage(null);
                  setOcrResult(null);
                }}>Chụp lại</Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {loading && <div className="text-blue-600">Đang xử lý OCR...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {ocrResult && (
            <div className="space-y-4">
              <div className="font-semibold">Kết quả OCR:</div>
              <div>Nhà cung cấp: {ocrResult.supplier}</div>
              <div>Ngày: {ocrResult.date}</div>
              <div>Tổng tiền: {ocrResult.total.toLocaleString('vi-VN')} VND</div>
              
              <div className="font-semibold">Chi tiết sản phẩm:</div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 text-left">Tên</th>
                    <th className="px-2 py-1 text-right">SL</th>
                    <th className="px-2 py-1 text-right">Đơn giá</th>
                    <th className="px-2 py-1 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrResult.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-2 py-1">{item.name}</td>
                      <td className="px-2 py-1 text-right">{item.quantity}</td>
                      <td className="px-2 py-1 text-right">{item.unit_price.toLocaleString('vi-VN')}</td>
                      <td className="px-2 py-1 text-right">{item.total.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => {
                  setImage(null);
                  setOcrResult(null);
                }}>Hủy</Button>
                <Button variant="primary" onClick={handleCreateTransaction}>Tạo phiếu nhập</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default TransactionHistory; 