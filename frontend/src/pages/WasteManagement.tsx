import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { useAuthStore } from '../store';
import sampleData from '../data/sample_data.json';
import { SampleData } from '../types/sample_data';
import approvalService from '../services/approval.service';

const data = sampleData as SampleData;
const items = data.sample_items;
const units = data.units;

interface WasteItem {
  itemId: number;
  itemName: string;
  quantity: number;
  currentStock: number;
  unit: string;
  reason: string;
  condition: string;
  disposalMethod: string;
  estimatedValue: number;
  notes?: string;
}

interface WasteForm {
  date: string;
  department: string;
  category: string;
  items: WasteItem[];
  totalValue: number;
  responsiblePerson: string;
  notes: string;
}

const wasteReasons = [
  { value: 'expired', label: 'Hết hạn sử dụng' },
  { value: 'spoiled', label: 'Hỏng, thối' },
  { value: 'damaged', label: 'Bị hư hại' },
  { value: 'overproduction', label: 'Sản xuất dư thừa' },
  { value: 'contaminated', label: 'Bị ô nhiễm' },
  { value: 'recalled', label: 'Thu hồi sản phẩm' },
  { value: 'preparation_waste', label: 'Hao phí chế biến' },
  { value: 'quality_issue', label: 'Không đạt chất lượng' },
  { value: 'customer_return', label: 'Khách hàng trả lại' },
  { value: 'other', label: 'Khác' }
];

const wasteCategories = [
  { value: 'raw_materials', label: 'Nguyên liệu thô' },
  { value: 'prepared_food', label: 'Thực phẩm chế biến' },
  { value: 'finished_products', label: 'Thành phẩm' },
  { value: 'packaging', label: 'Bao bì' },
  { value: 'cleaning_supplies', label: 'Vật tư vệ sinh' },
  { value: 'other_supplies', label: 'Vật tư khác' }
];

const disposalMethods = [
  { value: 'landfill', label: 'Chôn lấp' },
  { value: 'compost', label: 'Ủ phân hữu cơ' },
  { value: 'recycle', label: 'Tái chế' },
  { value: 'incineration', label: 'Đốt' },
  { value: 'donation', label: 'Từ thiện' },
  { value: 'staff_consumption', label: 'Nhân viên sử dụng' },
  { value: 'vendor_return', label: 'Trả nhà cung cấp' },
  { value: 'other', label: 'Khác' }
];

const departments = [
  { value: 'kitchen', label: 'Bếp' },
  { value: 'bar', label: 'Quầy bar' },
  { value: 'storage', label: 'Kho' },
  { value: 'service', label: 'Phục vụ' },
  { value: 'preparation', label: 'Sơ chế' },
  { value: 'cleaning', label: 'Vệ sinh' }
];

const conditions = [
  { value: 'expired', label: 'Hết hạn' },
  { value: 'moldy', label: 'Bị mốc' },
  { value: 'rotten', label: 'Thối rữa' },
  { value: 'damaged_packaging', label: 'Bao bì hỏng' },
  { value: 'contaminated', label: 'Bị ô nhiễm' },
  { value: 'discolored', label: 'Đổi màu' },
  { value: 'bad_smell', label: 'Mùi lạ' },
  { value: 'physical_damage', label: 'Hư hại vật lý' },
  { value: 'overcooked', label: 'Nấu quá' },
  { value: 'undercooked', label: 'Nấu thiếu' },
  { value: 'presentation_issue', label: 'Không đẹp mắt' },
  { value: 'excess', label: 'Thừa' }
];

const WasteManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWaste, setSelectedWaste] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wasteForm, setWasteForm] = useState<WasteForm>({
    date: new Date().toISOString().split('T')[0],
    department: 'kitchen',
    category: 'raw_materials',
    items: [],
    totalValue: 0,
    responsiblePerson: user?.full_name || '',
    notes: ''
  });

  // Mock data for existing waste records
  const [wasteRecords, setWasteRecords] = useState([
    {
      id: 1,
      date: '2024-01-15',
      department: 'Bếp',
      category: 'Nguyên liệu thô',
      status: 'approved',
      totalItems: 3,
      totalValue: 450000,
      responsiblePerson: 'Nguyễn Văn A',
      processedBy: 'Trần Thị B'
    },
    {
      id: 2,
      date: '2024-01-14',
      department: 'Quầy bar',
      category: 'Thành phẩm',
      status: 'pending',
      totalItems: 2,
      totalValue: 320000,
      responsiblePerson: 'Lê Văn C',
      processedBy: 'Hoàng Thị D'
    }
  ]);

  const getUnitName = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.abbreviation : '';
  };

  const getItemStock = (itemId: number) => {
    // Mock inventory data
    const mockInventory = [
      { itemId: 1, currentStock: 100 },
      { itemId: 2, currentStock: 50 },
      { itemId: 3, currentStock: 200 },
      { itemId: 4, currentStock: 75 },
      { itemId: 5, currentStock: 120 },
    ];
    const inv = mockInventory.find(i => i.itemId === itemId);
    return inv ? inv.currentStock : 0;
  };

  const estimateItemValue = (itemId: number, quantity: number) => {
    // Mock price estimation based on item
    const mockPrices = [
      { itemId: 1, unitPrice: 25000 },
      { itemId: 2, unitPrice: 45000 },
      { itemId: 3, unitPrice: 12000 },
      { itemId: 4, unitPrice: 80000 },
      { itemId: 5, unitPrice: 150000 },
    ];
    const price = mockPrices.find(p => p.itemId === itemId);
    return price ? price.unitPrice * quantity : 0;
  };

  const handleAddItem = () => {
    if (selectedItem) {
      const currentStock = getItemStock(selectedItem.id);
      const newItem: WasteItem = {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: 1,
        currentStock,
        unit: getUnitName(selectedItem.unit_id),
        reason: 'expired',
        condition: 'expired',
        disposalMethod: 'landfill',
        estimatedValue: estimateItemValue(selectedItem.id, 1),
        notes: ''
      };
      
      setWasteForm(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      setShowItemModal(false);
      setSelectedItem(null);
    }
  };

  const handleUpdateItem = (index: number, field: keyof WasteItem, value: any) => {
    setWasteForm(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate estimated value when quantity changes
          if (field === 'quantity') {
            updatedItem.estimatedValue = estimateItemValue(item.itemId, value);
          }
          return updatedItem;
        }
        return item;
      });
      
      const totalValue = updatedItems.reduce((total, item) => total + item.estimatedValue, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalValue
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setWasteForm(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const totalValue = updatedItems.reduce((total, item) => total + item.estimatedValue, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalValue
      };
    });
  };

  const handleSubmit = () => {
    console.log('Tạo phiếu hao phí:', wasteForm);
    // TODO: Call API to create waste
    setShowCreateModal(false);
    setWasteForm({
      date: new Date().toISOString().split('T')[0],
      department: 'kitchen',
      category: 'raw_materials',
      items: [],
      totalValue: 0,
      responsiblePerson: user?.full_name || '',
      notes: ''
    });
  };

  // Approval handlers
  const handleApprovalClick = (wasteItem: any, action: 'approve' | 'reject') => {
    setSelectedWaste(wasteItem);
    setApprovalAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedWaste) return;

    setIsLoading(true);
    try {
      if (approvalAction === 'approve') {
        await approvalService.approveWaste(selectedWaste.id);
        
        setWasteRecords(prev => prev.map(record => 
          record.id === selectedWaste.id 
            ? { ...record, status: 'approved' }
            : record
        ));
        
        alert('Đã duyệt phiếu hao phí thành công!');
      } else {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối');
          return;
        }
        
        await approvalService.rejectWaste(selectedWaste.id, rejectionReason);
        
        setWasteRecords(prev => prev.map(record => 
          record.id === selectedWaste.id 
            ? { ...record, status: 'rejected' }
            : record
        ));
        
        alert('Đã từ chối phiếu hao phí');
      }
      
      setShowApprovalModal(false);
      setSelectedWaste(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Approval error:', error);
      alert('Có lỗi xảy ra khi xử lý phê duyệt');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return status;
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const canApprove = user && ['owner', 'manager'].includes(user.role);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🗑️ Quản lý Hao Phí</h1>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Tạo phiếu hao phí
          </Button>
        </div>

        {/* Waste Records List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Danh sách phiếu hao phí</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Ngày</th>
                  <th className="text-left py-3 px-4">Bộ phận</th>
                  <th className="text-left py-3 px-4">Loại hao phí</th>
                  <th className="text-left py-3 px-4">Số mặt hàng</th>
                  <th className="text-left py-3 px-4">Giá trị ước tính</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Người chịu trách nhiệm</th>
                  <th className="text-left py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {wasteRecords.map(record => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(record.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">{record.department}</td>
                    <td className="py-3 px-4">{record.category}</td>
                    <td className="py-3 px-4">{record.totalItems}</td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {formatCurrency(record.totalValue)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{record.responsiblePerson}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {record.status === 'pending' && canApprove && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => handleApprovalClick(record, 'approve')}
                              className="text-xs px-2 py-1"
                            >
                              Duyệt
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleApprovalClick(record, 'reject')}
                              className="text-xs px-2 py-1"
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button
                          variant="secondary"
                          className="text-xs px-2 py-1"
                          onClick={() => console.log('View details:', record)}
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

        {/* Create Waste Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tạo phiếu hao phí"
        >
          <div className="space-y-4">
            {/* Waste Form Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ngày ghi nhận"
                type="date"
                value={wasteForm.date}
                onChange={(e) => setWasteForm(prev => ({ ...prev, date: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bộ phận
                </label>
                <select
                  value={wasteForm.department}
                  onChange={(e) => setWasteForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại hao phí
                </label>
                <select
                  value={wasteForm.category}
                  onChange={(e) => setWasteForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {wasteCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Người chịu trách nhiệm"
                value={wasteForm.responsiblePerson}
                onChange={(e) => setWasteForm(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                placeholder="Tên người chịu trách nhiệm"
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Danh sách hàng hóa hao phí</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowItemModal(true)}
                >
                  Thêm hàng hóa
                </Button>
              </div>

              {wasteForm.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium">Hàng hóa</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Số lượng</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Tồn kho</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Lý do</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Tình trạng</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Xử lý</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Giá trị ước tính</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteForm.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 px-3 text-sm">
                            {item.itemName} ({item.unit})
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                              className="w-20 text-sm"
                              min="0"
                              max={item.currentStock}
                              step="0.01"
                            />
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-600">
                            {item.currentStock}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.reason}
                              onChange={(e) => handleUpdateItem(index, 'reason', e.target.value)}
                              className="w-32 text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              {wasteReasons.map(reason => (
                                <option key={reason.value} value={reason.value}>
                                  {reason.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.condition}
                              onChange={(e) => handleUpdateItem(index, 'condition', e.target.value)}
                              className="w-32 text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              {conditions.map(condition => (
                                <option key={condition.value} value={condition.value}>
                                  {condition.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.disposalMethod}
                              onChange={(e) => handleUpdateItem(index, 'disposalMethod', e.target.value)}
                              className="w-32 text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              {disposalMethods.map(method => (
                                <option key={method.value} value={method.value}>
                                  {method.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold text-red-600">
                            {formatCurrency(item.estimatedValue)}
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
                        <td colSpan={6} className="py-2 px-3 text-sm font-semibold text-right">
                          Tổng giá trị hao phí:
                        </td>
                        <td className="py-2 px-3 text-sm font-bold text-red-600">
                          {formatCurrency(wasteForm.totalValue)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có hàng hóa nào. Nhấn "Thêm hàng hóa" để bắt đầu.
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={wasteForm.notes}
                onChange={(e) => setWasteForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú về phiếu hao phí, nguyên nhân, biện pháp khắc phục..."
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
                disabled={wasteForm.items.length === 0}
              >
                Tạo phiếu hao phí
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Item Modal */}
        <Modal
          open={showItemModal}
          onClose={() => setShowItemModal(false)}
          title="Chọn hàng hóa hao phí"
        >
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    Mã: {item.id} | ĐVT: {getUnitName(item.unit_id)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Tồn kho: {getItemStock(item.id)} {getUnitName(item.unit_id)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowItemModal(false);
                  setSelectedItem(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleAddItem}
                disabled={!selectedItem}
              >
                Thêm hàng hóa
              </Button>
            </div>
          </div>
        </Modal>

        {/* Approval Modal */}
        <Modal
          open={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title={approvalAction === 'approve' ? 'Duyệt phiếu hao phí' : 'Từ chối phiếu hao phí'}
        >
          {selectedWaste && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Thông tin phiếu hao phí</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Ngày: {new Date(selectedWaste.date).toLocaleDateString('vi-VN')}</div>
                  <div>Bộ phận: {selectedWaste.department}</div>
                  <div>Loại: {selectedWaste.category}</div>
                  <div>Giá trị: {formatCurrency(selectedWaste.totalValue)}</div>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do từ chối *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Nhập lý do từ chối phiếu hao phí..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  variant={approvalAction === 'approve' ? 'primary' : 'secondary'}
                  onClick={handleApprovalSubmit}
                  disabled={isLoading || (approvalAction === 'reject' && !rejectionReason.trim())}
                >
                  {isLoading ? 'Đang xử lý...' : (approvalAction === 'approve' ? 'Duyệt' : 'Từ chối')}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default WasteManagement; 