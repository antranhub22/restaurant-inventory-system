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

interface ReturnItem {
  itemId: number;
  itemName: string;
  quantity: number;
  condition: string;
  unit: string;
  originalExportId?: number;
  notes?: string;
}

interface ReturnForm {
  date: string;
  reason: string;
  department: string;
  items: ReturnItem[];
  notes: string;
}

const reasons = [
  { value: 'excess', label: 'Hàng thừa' },
  { value: 'defective', label: 'Hàng lỗi' },
  { value: 'menu_change', label: 'Thay đổi menu' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'other', label: 'Khác' },
];

const conditions = [
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'poor', label: 'Kém' },
  { value: 'damaged', label: 'Hỏng' },
  { value: 'expired', label: 'Hết hạn' },
];

const departments = [
  { value: 'kitchen', label: 'Bếp' },
  { value: 'bar', label: 'Quầy bar' },
  { value: 'storage', label: 'Kho' },
  { value: 'service', label: 'Phục vụ' },
];

const ReturnManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnForm, setReturnForm] = useState<ReturnForm>({
    date: new Date().toISOString().split('T')[0],
    reason: 'excess',
    department: 'kitchen',
    items: [],
    notes: ''
  });

  // Mock data for existing returns
  const [returns] = useState([
    {
      id: 1,
      date: '2024-01-15',
      reason: 'excess',
      department: 'kitchen',
      status: 'approved',
      totalItems: 3,
      totalValue: 800000,
      processedBy: 'Nguyễn Văn A'
    },
    {
      id: 2,
      date: '2024-01-14',
      reason: 'defective',
      department: 'bar',
      status: 'pending',
      totalItems: 2,
      totalValue: 500000,
      processedBy: 'Trần Thị B'
    }
  ]);

  const getUnitName = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.abbreviation : '';
  };

  const handleAddItem = () => {
    if (selectedItem) {
      const newItem: ReturnItem = {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: 1,
        condition: 'good',
        unit: getUnitName(selectedItem.unit_id),
        notes: ''
      };
      
      setReturnForm(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      setShowItemModal(false);
      setSelectedItem(null);
    }
  };

  const handleUpdateItem = (index: number, field: keyof ReturnItem, value: any) => {
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveItem = (index: number) => {
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    console.log('Tạo phiếu hoàn kho:', returnForm);
    // TODO: Call API to create return
    setShowCreateModal(false);
    setReturnForm({
      date: new Date().toISOString().split('T')[0],
      reason: 'excess',
      department: 'kitchen',
      items: [],
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Bị từ chối';
      default: return 'Không xác định';
    }
  };

  const getReasonText = (reason: string) => {
    const r = reasons.find(r => r.value === reason);
    return r ? r.label : reason;
  };

  const getDepartmentText = (department: string) => {
    const d = departments.find(d => d.value === department);
    return d ? d.label : department;
  };



  if (!user || !['owner', 'manager', 'supervisor'].includes(user.role)) {
    return (
      <Layout header={<div className='text-2xl font-bold'>Quản lý Phiếu Hoàn kho</div>}>
        <div className='text-center text-red-500 py-8'>
          Bạn không có quyền truy cập chức năng này.
        </div>
      </Layout>
    );
  }

  return (
    <Layout header={
      <div className="text-2xl font-bold flex items-center justify-between">
        🔄 Quản lý Phiếu Hoàn kho
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="text-sm"
        >
          + Tạo phiếu hoàn
        </Button>
      </div>
    }>
      {/* Return List */}
      <Card header="Danh sách phiếu hoàn kho">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-left">Lý do</th>
                <th className="px-4 py-2 text-left">Bộ phận</th>
                <th className="px-4 py-2 text-left">Số mặt hàng</th>
                <th className="px-4 py-2 text-left">Tổng giá trị</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Người tạo</th>
                <th className="px-4 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((return_item) => (
                <tr key={return_item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{return_item.date}</td>
                  <td className="px-4 py-2">{getReasonText(return_item.reason)}</td>
                  <td className="px-4 py-2">{getDepartmentText(return_item.department)}</td>
                  <td className="px-4 py-2">{return_item.totalItems}</td>
                  <td className="px-4 py-2">{return_item.totalValue.toLocaleString('vi-VN')} VND</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(return_item.status)}`}>
                      {getStatusText(return_item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">{return_item.processedBy}</td>
                  <td className="px-4 py-2">
                    <Button variant="secondary" className="text-xs mr-2">Xem</Button>
                    {return_item.status === 'pending' && (
                      <Button variant="primary" className="text-xs">Duyệt</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Return Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo phiếu hoàn kho"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày hoàn</label>
              <Input
                type="date"
                value={returnForm.date}
                onChange={(e) => setReturnForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lý do hoàn</label>
              <select
                value={returnForm.reason}
                onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bộ phận</label>
            <select
              value={returnForm.department}
              onChange={(e) => setReturnForm(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Danh sách hàng hóa</label>
              <Button variant="secondary" onClick={() => setShowItemModal(true)}>
                + Thêm hàng hóa
              </Button>
            </div>
            
            {returnForm.items.length > 0 ? (
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên hàng</th>
                      <th className="px-3 py-2 text-left">Số lượng</th>
                      <th className="px-3 py-2 text-left">Tình trạng</th>
                      <th className="px-3 py-2 text-left">Ghi chú</th>
                      <th className="px-3 py-2 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnForm.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{item.itemName}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                            className="w-20"
                            min="1"
                          />
                          <span className="ml-1 text-xs text-gray-500">{item.unit}</span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.condition}
                            onChange={(e) => handleUpdateItem(index, 'condition', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {conditions.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                            placeholder="Ghi chú"
                            className="text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleRemoveItem(index)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
                Chưa có hàng hóa nào. Nhấn "Thêm hàng hóa" để bắt đầu.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú</label>
            <textarea
              value={returnForm.notes}
              onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú thêm..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={returnForm.items.length === 0}
            >
              Tạo phiếu hoàn
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        title="Chọn hàng hóa"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedItem?.id === item.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Đơn vị: {getUnitName(item.unit_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.unit_cost.toLocaleString('vi-VN')} VND</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>
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
    </Layout>
  );
};

export default ReturnManagement; 