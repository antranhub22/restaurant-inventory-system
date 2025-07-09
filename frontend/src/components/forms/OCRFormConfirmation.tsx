import React, { useState } from 'react';
import { FormType } from '../../types/form-template';

interface OCRFormConfirmationProps {
  formId: string;
  formType: FormType;
  fields: Array<{
    name: string;
    value: any;
    confidence: number;
    needsReview: boolean;
    alternatives?: string[];
  }>;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
    confidence: number;
    needsReview: boolean;
  }>;
  confidence: number;
  originalImage?: string;
  onConfirm: (formId: string, corrections: any[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Correction {
  fieldId: string;
  oldValue: any;
  newValue: any;
  confidence: number;
}

const BACKEND_BASE_URL = (import.meta as any).env.VITE_BACKEND_URL || 'https://restaurant-inventory-backend.onrender.com';

const OCRFormConfirmation: React.FC<OCRFormConfirmationProps> = ({
  formId,
  formType,
  fields,
  items,
  confidence,
  originalImage,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getFormTypeLabel = (type: FormType) => {
    const labels = {
      IMPORT: 'Nhập kho',
      EXPORT: 'Xuất kho',
      RETURN: 'Hoàn kho',
      ADJUSTMENT: 'Điều chỉnh',
      WASTE: 'Hao hụt'
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600';
    if (conf >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'Cao';
    if (conf >= 0.7) return 'Trung bình';
    return 'Thấp';
  };

  const handleFieldEdit = (fieldName: string, newValue: any) => {
    const field = fields.find(f => f.name === fieldName);
    if (field && field.value !== newValue) {
      const correction: Correction = {
        fieldId: fieldName,
        oldValue: field.value,
        newValue: newValue,
        confidence: field.confidence
      };

      setCorrections(prev => {
        const filtered = prev.filter(c => c.fieldId !== fieldName);
        return [...filtered, correction];
      });
    }
    setEditingField(null);
  };

  const handleItemEdit = (itemIndex: number, field: string, newValue: any) => {
    const item = items[itemIndex];
    if (item && item[field as keyof typeof item] !== newValue) {
      const correction: Correction = {
        fieldId: `item_${itemIndex}_${field}`,
        oldValue: item[field as keyof typeof item],
        newValue: newValue,
        confidence: item.confidence
      };

      setCorrections(prev => {
        const filtered = prev.filter(c => c.fieldId !== `item_${itemIndex}_${field}`);
        return [...filtered, correction];
      });
    }
    setEditingField(null);
  };

  const handleConfirm = () => {
    onConfirm(formId, corrections);
  };

  const renderEditableField = (field: any, fieldName: string) => {
    const isEditing = editingField === fieldName;
    const correction = corrections.find(c => c.fieldId === fieldName);
    const displayValue = correction ? correction.newValue : field.value;

    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={displayValue}
          className="w-full px-2 py-1 border border-blue-300 rounded"
          onBlur={(e) => handleFieldEdit(fieldName, e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleFieldEdit(fieldName, e.currentTarget.value);
            }
          }}
          autoFocus
        />
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => setEditingField(fieldName)}
      >
        {displayValue || '-'}
      </div>
    );
  };

  const renderEditableItemField = (item: any, itemIndex: number, field: string) => {
    const fieldId = `item_${itemIndex}_${field}`;
    const isEditing = editingField === fieldId;
    const correction = corrections.find(c => c.fieldId === fieldId);
    const displayValue = correction ? correction.newValue : item[field as keyof typeof item];

    if (isEditing) {
      return (
        <input
          type={field === 'quantity' || field === 'price' || field === 'total' ? 'number' : 'text'}
          defaultValue={displayValue}
          className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
          onBlur={(e) => handleItemEdit(itemIndex, field, e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleItemEdit(itemIndex, field, e.currentTarget.value);
            }
          }}
          autoFocus
        />
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded text-sm"
        onClick={() => setEditingField(fieldId)}
      >
        {field === 'price' || field === 'total' 
          ? formatCurrency(displayValue || 0)
          : displayValue || '-'
        }
      </div>
    );
  };

  return (
    <div className="ocr-form-confirmation bg-white p-6 rounded-lg shadow-xl max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Xác nhận {getFormTypeLabel(formType)}</h2>
        <p className="text-gray-600">
          Độ tin cậy tổng thể: 
          <span className={`ml-1 font-semibold ${getConfidenceColor(confidence)}`}>
            {getConfidenceLabel(confidence)} ({(confidence * 100).toFixed(1)}%)
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin chung */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin chung</h3>
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.name === 'date' ? 'Ngày' :
                     field.name === 'supplierId' ? 'Nhà cung cấp' :
                     field.name === 'department' ? 'Phòng ban' :
                     field.name === 'purpose' ? 'Mục đích' :
                     field.name === 'reason' ? 'Lý do' :
                     field.name === 'invoice_no' ? 'Số hóa đơn' :
                     field.name === 'total' ? 'Tổng tiền' :
                     field.name === 'notes' ? 'Ghi chú' :
                     field.name}
                    <span className={`ml-2 text-xs ${getConfidenceColor(field.confidence)}`}>
                      ({getConfidenceLabel(field.confidence)})
                    </span>
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderEditableField(field, field.name)}
                    {field.needsReview && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Cần kiểm tra
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách mặt hàng */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Danh sách mặt hàng</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên hàng
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      SL
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Đơn giá
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className={item.needsReview ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center space-x-2">
                          {renderEditableItemField(item, index, 'name')}
                          <span className={`text-xs ${getConfidenceColor(item.confidence)}`}>
                            ({getConfidenceLabel(item.confidence)})
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {renderEditableItemField(item, index, 'quantity')}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {renderEditableItemField(item, index, 'price')}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {renderEditableItemField(item, index, 'total')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ảnh gốc */}
          {originalImage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Ảnh gốc</h4>
              <img 
                src={`${BACKEND_BASE_URL}/uploads/${originalImage}`} 
                alt="Receipt" 
                className="w-full rounded border"
              />
            </div>
          )}

          {/* Thống kê */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Thống kê</h4>
            <div className="space-y-2 text-sm">
              <p>Tổng mặt hàng: {items.length}</p>
              <p>Tổng tiền: {formatCurrency(items.reduce((sum, item) => sum + (item.total || 0), 0))}</p>
              <p>Cần kiểm tra: {fields.filter(f => f.needsReview).length + items.filter(i => i.needsReview).length}</p>
            </div>
          </div>

          {/* Chỉnh sửa */}
          {corrections.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-blue-800">Chỉnh sửa ({corrections.length})</h4>
              <div className="space-y-1 text-xs text-blue-700">
                {corrections.map((correction, index) => (
                  <div key={index}>
                    {correction.fieldId}: {correction.oldValue} → {correction.newValue}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </button>
        
        <div className="space-x-4">
          <button
            type="button"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận và lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OCRFormConfirmation;