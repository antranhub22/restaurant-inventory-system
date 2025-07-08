import React, { useState, useEffect } from 'react';
import { FormType } from '../types/form-template';
import OCRFormConfirmation from '../components/forms/OCRFormConfirmation';
import OCRProcessingModal from '../components/common/OCRProcessingModal';
import OCRStatusPanel from '../components/common/OCRStatusPanel';
import ImagePreview from '../components/common/ImagePreview';
import useOCRForm from '../hooks/useOCRForm';
import { OCRConnectionTestResult } from '../utils/ocrConnectionTest';

const OCRFormDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<FormType>(FormType.IMPORT);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<OCRConnectionTestResult | null>(null);
  
  const { processOCRForm, confirmOCRForm, isLoading, error, clearError } = useOCRForm();

  const handleStatusChange = (status: OCRConnectionTestResult) => {
    setConnectionStatus(status);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    clearError();
  };

  const handleFormTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormType(event.target.value as FormType);
  };

  const handleProcessOCR = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (!connectionStatus?.overall.success) {
      alert('Không thể kết nối đến OCR service. Vui lòng kiểm tra lại.');
      return;
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const result = await processOCRForm(selectedFile, selectedFormType);
      setProcessingProgress(100);
      setTimeout(() => {
        setOcrResult(result);
        setShowConfirmation(true);
        setProcessingProgress(0);
      }, 500);
    } catch (err) {
      setProcessingProgress(0);
      console.error('Error processing OCR:', err);
    }
  };

  const handleConfirm = async (formId: string, corrections: any[]) => {
    try {
      const result = await confirmOCRForm(formId, corrections);
      alert('Đã xác nhận và lưu thành công!');
      setShowConfirmation(false);
      setOcrResult(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error confirming form:', err);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setOcrResult(null);
  };

  if (showConfirmation && ocrResult) {
    return (
      <OCRFormConfirmation
        formId={ocrResult.formId}
        formType={ocrResult.type}
        fields={ocrResult.fields}
        items={ocrResult.items}
        confidence={ocrResult.confidence}
        originalImage={ocrResult.originalImage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            Demo OCR Form Processing
          </h1>

          {/* Connection Status */}
          <OCRStatusPanel 
            onStatusChange={handleStatusChange}
            showDetails={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Upload and Settings */}
            <div>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ảnh hóa đơn/phiếu
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Form Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phiếu
                </label>
                <select
                  value={selectedFormType}
                  onChange={handleFormTypeChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={FormType.IMPORT}>Nhập kho</option>
                  <option value={FormType.EXPORT}>Xuất kho</option>
                  <option value={FormType.RETURN}>Hoàn kho</option>
                  <option value={FormType.ADJUSTMENT}>Điều chỉnh</option>
                  <option value={FormType.WASTE}>Hao hụt</option>
                </select>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Process Button */}
              <div className="text-center">
                <button
                  onClick={handleProcessOCR}
                  disabled={!selectedFile || isLoading || !connectionStatus?.overall.success}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang xử lý...' : 'Xử lý OCR'}
                </button>
              </div>
            </div>

            {/* Right Column - Image Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview ảnh</h3>
              {selectedFile ? (
                <ImagePreview 
                  file={selectedFile} 
                  onRemove={handleRemoveFile}
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Chưa có ảnh được chọn
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Chọn file ảnh hóa đơn hoặc phiếu kho</li>
              <li>Chọn loại phiếu tương ứng</li>
              <li>Nhấn "Xử lý OCR" để trích xuất thông tin</li>
              <li>Kiểm tra và chỉnh sửa thông tin nếu cần</li>
              <li>Xác nhận để lưu vào hệ thống</li>
            </ol>
          </div>

          {/* Sample Data for Testing */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dữ liệu mẫu để test:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Hóa đơn nhập hàng từ nhà cung cấp</p>
              <p>• Phiếu xuất kho cho bộ phận</p>
              <p>• Phiếu hoàn trả hàng</p>
              <p>• Báo cáo hao hụt/điều chỉnh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      <OCRProcessingModal 
        isOpen={isLoading || processingProgress > 0}
        progress={processingProgress}
      />
    </div>
  );
};

export default OCRFormDemo; 