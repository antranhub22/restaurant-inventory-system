import React from 'react';
import { FormType } from '../../types/form-template';
import { exportToExcel, exportToPdf } from '../../utils/exportReport';

interface AdjustmentPreviewProps {
  data: any;
  onClose: () => void;
  onConfirm: () => void;
}

const AdjustmentPreview: React.FC<AdjustmentPreviewProps> = ({
  data,
  onClose,
  onConfirm
}) => {
  const calculateTotalDiscrepancy = () => {
    return (data.items || []).reduce((total: number, item: any) => {
      const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
      return total + Math.abs(difference);
    }, 0);
  };

  const calculateTotalValue = () => {
    return (data.items || []).reduce((total: number, item: any) => {
      const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
      const value = Math.abs(difference) * (item.unit_price || 0);
      return total + value;
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleExportExcel = () => {
    const fileName = `kiem-ke-${data.date.replace(/\//g, '-')}.xlsx`;
    exportToExcel(data, { fileName });
  };

  const handleExportPdf = async () => {
    const fileName = `kiem-ke-${data.date.replace(/\//g, '-')}.pdf`;
    await exportToPdf(data, { fileName });
  };

  return (
    <div className="adjustment-preview bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Xem trước Phiếu Kiểm Kê</h2>
        <p className="text-gray-600">
          Ngày kiểm kê: {formatDate(data.date)}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Thông tin chung</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Loại kiểm kê:</span> {data.type}</p>
            <p><span className="font-medium">Khu vực:</span> {data.area}</p>
          </div>
          <div>
            <p><span className="font-medium">Nhân viên:</span> {data.staff}</p>
            <p><span className="font-medium">Ghi chú:</span> {data.notes || 'Không có'}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Chi tiết kiểm kê</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên hàng
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SL hệ thống
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SL thực tế
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lý do
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data.items || []).map((item: any, index: number) => {
                const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
                const discrepancyRate = item.system_quantity 
                  ? (Math.abs(difference) / item.system_quantity) * 100 
                  : 0;

                return (
                  <tr key={index} className={discrepancyRate > 10 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.item_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.system_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.actual_quantity}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right
                      ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {difference > 0 ? '+' : ''}{difference}
                      {discrepancyRate > 0 && (
                        <span className="text-xs ml-1">
                          ({discrepancyRate.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.reason || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Tổng kết</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Tổng số mặt hàng: {data.items?.length || 0}</p>
            <p className="text-gray-600">Tổng chênh lệch: {calculateTotalDiscrepancy()}</p>
          </div>
          <div>
            <p className="text-gray-600">Giá trị chênh lệch: {formatCurrency(calculateTotalValue())}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={handleExportExcel}
          >
            Xuất Excel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={handleExportPdf}
          >
            Xuất PDF
          </button>
        </div>
        <div className="space-x-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={onConfirm}
          >
            Xác nhận và lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentPreview; 