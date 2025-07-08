import React, { useState, useEffect } from 'react';
import { testOCRConnection, getOCRStatus, OCRConnectionTestResult } from '../../utils/ocrConnectionTest';

interface OCRStatusPanelProps {
  onStatusChange?: (status: OCRConnectionTestResult) => void;
  showDetails?: boolean;
}

const OCRStatusPanel: React.FC<OCRStatusPanelProps> = ({ 
  onStatusChange, 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<OCRConnectionTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testOCRConnection();
      setStatus(result);
      setLastUpdated(new Date());
      onStatusChange?.(result);
    } catch (error) {
      console.error('Error testing OCR connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Đang kiểm tra kết nối OCR...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium text-red-800">
            Không thể kiểm tra kết nối OCR
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md p-4 ${
      status.overall.success 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            status.overall.success ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-medium ${
            status.overall.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {status.overall.success ? 'OCR Demo Sẵn Sàng' : 'OCR Demo Có Vấn Đề'}
          </span>
        </div>
        <button
          onClick={testConnection}
          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          🔄 Kiểm tra lại
        </button>
      </div>

      {/* Overall Status */}
      <p className={`text-sm ${
        status.overall.success ? 'text-green-700' : 'text-red-700'
      }`}>
        {status.overall.message}
      </p>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-gray-500 mt-1">
          Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
        </p>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* Backend Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Backend Server</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status.backend.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-xs ${
                status.backend.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.backend.success ? 'Hoạt động' : 'Lỗi'}
              </span>
            </div>
          </div>

          {/* OCR Endpoint Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">OCR Endpoint</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status.ocrEndpoint.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-xs ${
                status.ocrEndpoint.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.ocrEndpoint.success ? 'Sẵn sàng' : 'Lỗi'}
              </span>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Authentication</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status.auth.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-xs ${
                status.auth.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.auth.success ? 'Hợp lệ' : 'Cần đăng nhập'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!status.overall.success && status.overall.recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-800 mb-2">Khuyến nghị khắc phục:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            {status.overall.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span>•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      {!status.overall.success && (
        <div className="mt-4 flex space-x-2">
          {!status.backend.success && (
            <button
              onClick={() => window.open('https://restaurant-inventory-backend.onrender.com/api/health', '_blank')}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Kiểm tra Backend
            </button>
          )}
          {!status.auth.success && (
            <button
              onClick={() => window.location.href = '/login'}
              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Đăng nhập
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRStatusPanel;