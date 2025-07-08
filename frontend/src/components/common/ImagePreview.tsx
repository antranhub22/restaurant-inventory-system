import React from 'react';

interface ImagePreviewProps {
  file: File | null;
  onRemove: () => void;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  file, 
  onRemove, 
  className = '' 
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!file || !previewUrl) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-48 object-cover rounded-lg border border-gray-200"
        />
        
        {/* Overlay with remove button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200"
            title="Xóa ảnh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">{file.name}</p>
        <p>{(file.size / 1024).toFixed(1)} KB</p>
        <p className="text-xs text-gray-500">
          {file.type} • {new Date(file.lastModified).toLocaleDateString('vi-VN')}
        </p>
      </div>
    </div>
  );
};

export default ImagePreview; 