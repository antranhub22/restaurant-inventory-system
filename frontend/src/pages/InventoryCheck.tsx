import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { useAuthStore } from '../store';
import sampleData from '../data/sample_data.json';
import { SampleData } from '../types/sample_data';

const data = sampleData as SampleData;
const items = data.sample_items;
const units = data.units;

interface InventoryCheckItem {
  itemId: number;
  itemName: string;
  unit: string;
  recordedQuantity: number;
  actualQuantity: number;
  variance: number;
  variancePercentage: number;
  reason: string;
  notes?: string;
}

interface InventoryCheckForm {
  date: string;
  checkType: string;
  location: string;
  checker: string;
  supervisor: string;
  items: InventoryCheckItem[];
  totalVarianceValue: number;
  notes: string;
}

const checkTypes = [
  { value: 'daily', label: 'Kiểm kho hàng ngày' },
  { value: 'weekly', label: 'Kiểm kho hàng tuần' },
  { value: 'monthly', label: 'Kiểm kho hàng tháng' },
  { value: 'quarterly', label: 'Kiểm kho quý' },
  { value: 'annual', label: 'Kiểm kho năm' },
  { value: 'spot_check', label: 'Kiểm tra đột xuất' },
  { value: 'cycle_count', label: 'Kiểm kho tuần hoàn' },
  { value: 'full_inventory', label: 'Kiểm kho toàn bộ' }
];

const locations = [
  { value: 'main_storage', label: 'Kho chính' },
  { value: 'cold_storage', label: 'Kho lạnh' },
  { value: 'dry_storage', label: 'Kho khô' },
  { value: 'kitchen_storage', label: 'Kho bếp' },
  { value: 'bar_storage', label: 'Kho quầy bar' },
  { value: 'preparation_area', label: 'Khu sơ chế' },
  { value: 'service_area', label: 'Khu phục vụ' }
];

const varianceReasons = [
  { value: 'counting_error', label: 'Lỗi đếm' },
  { value: 'recording_error', label: 'Lỗi ghi chép' },
  { value: 'theft', label: 'Mất trộm' },
  { value: 'spoilage', label: 'Hỏng hóc' },
  { value: 'unreported_usage', label: 'Sử dụng không báo cáo' },
  { value: 'delivery_error', label: 'Lỗi giao hàng' },
  { value: 'system_error', label: 'Lỗi hệ thống' },
  { value: 'measurement_error', label: 'Lỗi đo lường' },
  { value: 'unknown', label: 'Không rõ nguyên nhân' }
];

const InventoryCheck: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkForm, setCheckForm] = useState<InventoryCheckForm>({
    date: new Date().toISOString().split('T')[0],
    checkType: 'daily',
    location: 'main_storage',
    checker: user?.full_name || '',
    supervisor: '',
    items: [],
    totalVarianceValue: 0,
    notes: ''
  });

  // Mock data for existing inventory checks
  const [inventoryChecks, setInventoryChecks] = useState([
    {
      id: 1,
      date: '2024-01-15',
      checkType: 'Kiểm kho hàng ngày',
      location: 'Kho chính',
      status: 'completed',
      totalItems: 25,
      varianceItems: 3,
      totalVarianceValue: -250000,
      checker: 'Nguyễn Văn A',
      supervisor: 'Trần Thị B'
    },
    {
      id: 2,
      date: '2024-01-14',
      checkType: 'Kiểm tra đột xuất',
      location: 'Kho lạnh',
      status: 'pending_approval',
      totalItems: 12,
      varianceItems: 5,
      totalVarianceValue: 180000,
      checker: 'Lê Văn C',
      supervisor: 'Hoàng Thị D'
    }
  ]);

  const getUnitName = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.abbreviation : '';
  };

  const getRecordedQuantity = (itemId: number) => {
    // Mock recorded inventory data
    const mockInventory = [
      { itemId: 1, recordedQuantity: 100 },
      { itemId: 2, recordedQuantity: 50 },
      { itemId: 3, recordedQuantity: 200 },
      { itemId: 4, recordedQuantity: 75 },
      { itemId: 5, recordedQuantity: 120 },
    ];
    const inv = mockInventory.find(i => i.itemId === itemId);
    return inv ? inv.recordedQuantity : 0;
  };

  const getItemPrice = (itemId: number) => {
    // Mock price data for variance value calculation
    const mockPrices = [
      { itemId: 1, unitPrice: 25000 },
      { itemId: 2, unitPrice: 45000 },
      { itemId: 3, unitPrice: 12000 },
      { itemId: 4, unitPrice: 80000 },
      { itemId: 5, unitPrice: 150000 },
    ];
    const price = mockPrices.find(p => p.itemId === itemId);
    return price ? price.unitPrice : 0;
  };

  const calculateVariance = (recorded: number, actual: number) => {
    return actual - recorded;
  };

  const calculateVariancePercentage = (recorded: number, actual: number) => {
    if (recorded === 0) return actual > 0 ? 100 : 0;
    return ((actual - recorded) / recorded) * 100;
  };

  const handleAddItems = () => {
    if (selectedItems.length > 0) {
      const newItems: InventoryCheckItem[] = selectedItems.map(item => {
        const recordedQuantity = getRecordedQuantity(item.id);
        return {
          itemId: item.id,
          itemName: item.name,
          unit: getUnitName(item.unit_id),
          recordedQuantity,
          actualQuantity: recordedQuantity, // Start with recorded quantity
          variance: 0,
          variancePercentage: 0,
          reason: 'counting_error',
          notes: ''
        };
      });
      
      setCheckForm(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }));
      
      setShowItemModal(false);
      setSelectedItems([]);
    }
  };

  const handleUpdateItem = (index: number, field: keyof InventoryCheckItem, value: any) => {
    setCheckForm(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate variance when actual quantity changes
          if (field === 'actualQuantity') {
            updatedItem.variance = calculateVariance(item.recordedQuantity, value);
            updatedItem.variancePercentage = calculateVariancePercentage(item.recordedQuantity, value);
          }
          return updatedItem;
        }
        return item;
      });
      
      // Calculate total variance value
      const totalVarianceValue = updatedItems.reduce((total, item) => {
        const itemPrice = getItemPrice(item.itemId);
        return total + (item.variance * itemPrice);
      }, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalVarianceValue
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setCheckForm(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      
      const totalVarianceValue = updatedItems.reduce((total, item) => {
        const itemPrice = getItemPrice(item.itemId);
        return total + (item.variance * itemPrice);
      }, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalVarianceValue
      };
    });
  };

  const handleToggleItemSelection = (item: any) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSubmit = () => {
    console.log('Tạo phiếu kiểm kho:', checkForm);
    // TODO: Call API to create inventory check
    setShowCreateModal(false);
    setCheckForm({
      date: new Date().toISOString().split('T')[0],
      checkType: 'daily',
      location: 'main_storage',
      checker: user?.full_name || '',
      supervisor: '',
      items: [],
      totalVarianceValue: 0,
      notes: ''
    });
  };

  const handleCreateAdjustment = (check: any) => {
    setSelectedCheck(check);
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentSubmit = async () => {
    if (!selectedCheck) return;

    setIsLoading(true);
    try {
      // TODO: Call API to create inventory adjustment
      console.log('Creating inventory adjustment for check:', selectedCheck);
      
      setInventoryChecks(prev => prev.map(check => 
        check.id === selectedCheck.id 
          ? { ...check, status: 'adjustment_created' }
          : check
      ));
      
      alert('Đã tạo phiếu điều chỉnh tồn kho thành công!');
      setShowAdjustmentModal(false);
      setSelectedCheck(null);
    } catch (error) {
      console.error('Adjustment error:', error);
      alert('Có lỗi xảy ra khi tạo phiếu điều chỉnh');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100';
      case 'adjustment_created': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending_approval': return 'Chờ duyệt';
      case 'adjustment_created': return 'Đã tạo điều chỉnh';
      case 'in_progress': return 'Đang thực hiện';
      default: return status;
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const canCreateAdjustment = user && ['owner', 'manager'].includes(user.role);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📊 Kiểm Kho</h1>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Tạo phiếu kiểm kho
          </Button>
        </div>

        {/* Inventory Checks List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Danh sách phiếu kiểm kho</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Ngày</th>
                  <th className="text-left py-3 px-4">Loại kiểm kho</th>
                  <th className="text-left py-3 px-4">Vị trí</th>
                  <th className="text-left py-3 px-4">Tổng mặt hàng</th>
                  <th className="text-left py-3 px-4">Mặt hàng chênh lệch</th>
                  <th className="text-left py-3 px-4">Giá trị chênh lệch</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Người kiểm</th>
                  <th className="text-left py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {inventoryChecks.map(check => (
                  <tr key={check.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(check.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">{check.checkType}</td>
                    <td className="py-3 px-4">{check.location}</td>
                    <td className="py-3 px-4">{check.totalItems}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{check.varianceItems}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${getVarianceColor(check.totalVarianceValue)}`}>
                        {formatCurrency(check.totalVarianceValue)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                        {getStatusText(check.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{check.checker}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {check.status === 'completed' && check.varianceItems > 0 && canCreateAdjustment && (
                          <Button
                            variant="primary"
                            onClick={() => handleCreateAdjustment(check)}
                            className="text-xs px-2 py-1"
                          >
                            Tạo điều chỉnh
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          className="text-xs px-2 py-1"
                          onClick={() => console.log('View details:', check)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Inventory Check Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tạo phiếu kiểm kho"
        >
          <div className="space-y-4">
            {/* Check Form Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ngày kiểm kho"
                type="date"
                value={checkForm.date}
                onChange={(e) => setCheckForm(prev => ({ ...prev, date: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại kiểm kho
                </label>
                <select
                  value={checkForm.checkType}
                  onChange={(e) => setCheckForm(prev => ({ ...prev, checkType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {checkTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vị trí kiểm kho
                </label>
                <select
                  value={checkForm.location}
                  onChange={(e) => setCheckForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Người kiểm kho"
                value={checkForm.checker}
                onChange={(e) => setCheckForm(prev => ({ ...prev, checker: e.target.value }))}
                placeholder="Tên người thực hiện kiểm kho"
              />
              <Input
                label="Người giám sát"
                value={checkForm.supervisor}
                onChange={(e) => setCheckForm(prev => ({ ...prev, supervisor: e.target.value }))}
                placeholder="Tên người giám sát"
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Danh sách hàng hóa kiểm kho</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowItemModal(true)}
                >
                  Chọn hàng hóa
                </Button>
              </div>

              {checkForm.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium">Hàng hóa</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">SL Sổ sách</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">SL Thực tế</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Chênh lệch</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">% Chênh lệch</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Lý do</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Ghi chú</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkForm.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 px-3 text-sm">
                            {item.itemName} ({item.unit})
                          </td>
                          <td className="py-2 px-3 text-sm font-medium">
                            {item.recordedQuantity}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={item.actualQuantity}
                              onChange={(e) => handleUpdateItem(index, 'actualQuantity', Number(e.target.value))}
                              className="w-20 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className={`py-2 px-3 text-sm font-semibold ${getVarianceColor(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </td>
                          <td className={`py-2 px-3 text-sm font-semibold ${getVarianceColor(item.variance)}`}>
                            {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.reason}
                              onChange={(e) => handleUpdateItem(index, 'reason', e.target.value)}
                              className="w-32 text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              {varianceReasons.map(reason => (
                                <option key={reason.value} value={reason.value}>
                                  {reason.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                              className="w-32 text-sm"
                              placeholder="Ghi chú"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Button
                              variant="secondary"
                              onClick={() => handleRemoveItem(index)}
                              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-sm font-semibold text-right">
                          Tổng giá trị chênh lệch:
                        </td>
                        <td className={`py-2 px-3 text-sm font-bold ${getVarianceColor(checkForm.totalVarianceValue)}`}>
                          {formatCurrency(checkForm.totalVarianceValue)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có hàng hóa nào. Nhấn "Chọn hàng hóa" để bắt đầu.
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={checkForm.notes}
                onChange={(e) => setCheckForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú về quá trình kiểm kho, phát hiện, khuyến nghị..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={checkForm.items.length === 0}
              >
                Tạo phiếu kiểm kho
              </Button>
            </div>
          </div>
        </Modal>

        {/* Select Items Modal */}
        <Modal
          open={showItemModal}
          onClose={() => setShowItemModal(false)}
          title="Chọn hàng hóa kiểm kho"
        >
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Chọn các hàng hóa cần kiểm kho. Bạn có thể chọn nhiều mặt hàng cùng lúc.
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {items.map(item => {
                const isSelected = selectedItems.some(selected => selected.id === item.id);
                const recordedQty = getRecordedQuantity(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleItemSelection(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          Mã: {item.id} | ĐVT: {getUnitName(item.unit_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tồn kho sổ sách: {recordedQty} {getUnitName(item.unit_id)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItemSelection(item)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Đã chọn: {selectedItems.length} mặt hàng
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowItemModal(false);
                    setSelectedItems([]);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddItems}
                  disabled={selectedItems.length === 0}
                >
                  Thêm {selectedItems.length} mặt hàng
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Create Adjustment Modal */}
        <Modal
          open={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          title="Tạo phiếu điều chỉnh tồn kho"
        >
          {selectedCheck && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Thông tin phiếu kiểm kho</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Ngày: {new Date(selectedCheck.date).toLocaleDateString('vi-VN')}</div>
                  <div>Loại: {selectedCheck.checkType}</div>
                  <div>Vị trí: {selectedCheck.location}</div>
                  <div>Mặt hàng chênh lệch: {selectedCheck.varianceItems}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Giá trị chênh lệch: </span>
                    <span className={`font-bold ${getVarianceColor(selectedCheck.totalVarianceValue)}`}>
                      {formatCurrency(selectedCheck.totalVarianceValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Xác nhận tạo phiếu điều chỉnh</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Phiếu điều chỉnh sẽ cập nhật tồn kho theo số liệu thực tế từ phiếu kiểm kho. 
                      Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setShowAdjustmentModal(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAdjustmentSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo phiếu điều chỉnh'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default InventoryCheck; 