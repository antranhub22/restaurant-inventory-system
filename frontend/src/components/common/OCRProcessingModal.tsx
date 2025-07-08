import React from 'react';

interface OCRProcessingModalProps {
  isOpen: boolean;
  progress?: number;
  currentStep?: string;
}

const OCRProcessingModal: React.FC<OCRProcessingModalProps> = ({
  isOpen,
  progress = 0,
  currentStep = 'Đang xử lý...'
}) => {
  if (!isOpen) return null;

  const steps = [
    'Đang tải ảnh...',
    'Đang trích xuất văn bản...',
    'Đang phân tích nội dung...',
    'Đang mapping với form template...',
    'Hoàn thành!'
  ];

  const currentStepIndex = Math.floor((progress / 100) * (steps.length - 1));
  const displayStep = currentStep || steps[currentStepIndex] || steps[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <svg 
                className="w-8 h-8 text-blue-600 animate-spin" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Đang xử lý OCR
          </h3>

          {/* Current Step */}
          <p className="text-sm text-gray-600 mb-4">
            {displayStep}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Text */}
          <p className="text-xs text-gray-500">
            {progress.toFixed(0)}% hoàn thành
          </p>

          {/* Tips */}
          <div className="mt-6 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-700">
              💡 <strong>Mẹo:</strong> Đảm bảo ảnh rõ nét và có đủ ánh sáng để kết quả OCR chính xác hơn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRProcessingModal;