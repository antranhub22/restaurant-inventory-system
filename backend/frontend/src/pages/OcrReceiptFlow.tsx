import React, { useRef, useState } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import axios from 'axios';
import sampleData from '../data/sample_data.json';
import { SampleData, Receipt } from '../types/sample_data';

const data = sampleData as SampleData;
const sampleReceipts = data.sample_receipts;

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

const OcrReceiptFlow: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

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
        formData.append('image', blob, 'receipt.png');
      } else {
        setError('Vui lòng chọn hoặc tải lên ảnh hóa đơn.');
        setLoading(false);
        return;
      }
      // Có thể bổ sung các trường khác như department/type nếu cần
      const response = await axios.post<{ data: OcrResult }>('/api/ocr/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Lỗi khi gửi ảnh lên OCR.');
      } else {
        setError('Lỗi không xác định khi xử lý OCR.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout header={<div className="text-2xl font-bold">Xử lý biên lai OCR</div>}>
      <div className="max-w-md mx-auto flex flex-col items-center gap-4">
        <div className="w-full flex flex-col gap-2">
          <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />
          <Button variant="primary" onClick={() => fileInput.current?.click()}>Tải ảnh hóa đơn</Button>
          <div className="flex flex-wrap gap-2">
            {sampleReceipts.map((r: Receipt) => (
              <Button key={r.id} variant="secondary" onClick={() => handleSample(r.image)}>{r.supplier} ({r.type})</Button>
            ))}
          </div>
        </div>
        {image && (
          <div className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <img src={image} alt="Hóa đơn" className="w-full h-full object-contain rounded-lg" />
          </div>
        )}
        {image && !result && (
          <Button variant="primary" loading={loading} onClick={handleOcr}>Gửi OCR</Button>
        )}
        {loading && <div className="text-blue-600">Đang xử lý OCR...</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {result && (
          <div className="w-full bg-gray-100 rounded p-4 mt-2">
            <div className="font-semibold mb-2">Kết quả OCR:</div>
            <pre className="mb-2 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
            <Button variant="secondary" onClick={() => setResult(null)}>Đánh giá lại</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OcrReceiptFlow; 