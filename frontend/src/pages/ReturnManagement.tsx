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

interface ReturnItem {
  itemId: number;
  itemName: string;
  quantity: number;
  condition: 'good' | 'damaged' | 'expired';
  unit: string;
  originalExportId?: number;
  notes?: string;
}

interface ReturnForm {
  date: string;
  department: string;
  reason: string;
  items: ReturnItem[];
  notes: string;
}

const reasons = [
  { value: 'overstock', label: 'Thừa kho' },
  { value: 'quality_issue', label: 'Vấn đề chất lượng' },
  { value: 'expired', label: 'Quá hạn sử dụng' },
  { value: 'wrong_order', label: 'Đặt sai hàng' },
  { value: 'customer_return', label: 'Khách hàng trả lại' },
];

const departments = [
  { value: 'kitchen', label: 'Bếp' },
  { value: 'bar', label: 'Quầy bar' },
  { value: 'storage', label: 'Kho' },
  { value: 'service', label: 'Phục vụ' },
];

const conditions = [
  { value: 'good', label: 'Tốt', color: 'bg-green-100 text-green-800' },
  { value: 'damaged', label: 'Hư hỏng', color: 'bg-orange-100 text-orange-800' },
  { value: 'expired', label: 'Hết hạn', color: 'bg-red-100 text-red-800' },
];

const ReturnManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [returnForm, setReturnForm] = useState<ReturnForm>({
    date: new Date().toISOString().split('T')[0],
    department: 'kitchen',
    reason: 'overstock',
    items: [],
    notes: ''
  });

  // Mock data for existing returns
  const [returns, setReturns] = useState([
    {
      id: 1,
      date: '2024-01-15',
      department: 'kitchen',
      reason: 'overstock',
      status: 'approved',
      totalItems: 3,
      totalValue: 500000,
      processedBy: 'Nguyễn Văn A'
    },
    {
      id: 2,
      date: '2024-01-14',
      department: 'bar',
      reason: 'quality_issue',
      status: 'pending',
      totalItems: 2,
      totalValue: 300000,
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
    console.log('Tạo phiếu hoàn trả:', returnForm);
    // TODO: Call API to create return
    setShowCreateModal(false);
    setReturnForm({
      date: new Date().toISOString().split('T')[0],
      department: 'kitchen',
      reason: 'overstock',
      items: [],
      notes: ''
    });
  };

  // New approval handlers
  const handleApprovalClick = (returnItem: any, action: 'approve' | 'reject') => {
    setSelectedReturn(returnItem);
    setApprovalAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedReturn) return;

    setIsLoading(true);
    try {
      if (approvalAction === 'approve') {
        await approvalService.approveReturn(selectedReturn.id);
        
        // Update local state
        setReturns(prev => prev.map(ret => 
          ret.id === selectedReturn.id 
            ? { ...ret, status: 'approved' }
            : ret
        ));
        
        alert('Đã duyệt phiếu hoàn trả thành công!');
      } else {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối');
          return;
        }
        
        await approvalService.rejectReturn(selectedReturn.id, rejectionReason);
        
        // Update local state
        setReturns(prev => prev.map(ret => 
          ret.id === selectedReturn.id 
            ? { ...ret, status: 'rejected' }
            : ret
        ));
        
        alert('Đã từ chối phiếu hoàn trả');
      }
      
      setShowApprovalModal(false);
      setSelectedReturn(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error processing approval:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý phê duyệt');
    } finally {
      setIsLoading(false);
    }
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
      <Layout header={<div className='text-2xl font-bold'>Quản lý Hoàn kho</div>}>
        <div className='text-center text-red-500 py-8'>
          Bạn không có quyền truy cập chức năng này.
        </div>
      </Layout>
    );
  }

  return (
    <Layout header={
      <div className="text-2xl font-bold flex items-center justify-between">
        ↩️ Quản lý Hoàn kho
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="text-sm"
        >
          + Tạo phiếu hoàn trả
        </Button>
      </div>
    }>
      {/* Return List */}
      <Card header="Danh sách phiếu hoàn trả">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-left">Bộ phận</th>
                <th className="px-4 py-2 text-left">Lý do</th>
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
                  <td className="px-4 py-2">{getDepartmentText(return_item.department)}</td>
                  <td className="px-4 py-2">{getReasonText(return_item.reason)}</td>
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
                    {return_item.status === 'pending' && user && ['owner', 'manager'].includes(user.role) && (
                      <>
                        <Button 
                          variant="primary" 
                          className="text-xs mr-2"
                          onClick={() => handleApprovalClick(return_item, 'approve')}
                        >
                          Duyệt
                        </Button>
                        <Button 
                          variant="danger" 
                          className="text-xs"
                          onClick={() => handleApprovalClick(return_item, 'reject')}
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Modal */}
      {showApprovalModal && selectedReturn && (
        <Modal
          title={`${approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'} phiếu hoàn trả #${selectedReturn.id}`}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedReturn(null);
            setRejectionReason('');
          }}
          open={showApprovalModal}
        >
          <div className="p-4">
            <div className="mb-4">
              <p><strong>Ngày:</strong> {selectedReturn.date}</p>
              <p><strong>Bộ phận:</strong> {getDepartmentText(selectedReturn.department)}</p>
              <p><strong>Lý do:</strong> {getReasonText(selectedReturn.reason)}</p>
              <p><strong>Số mặt hàng:</strong> {selectedReturn.totalItems}</p>
              <p><strong>Tổng giá trị:</strong> {selectedReturn.totalValue.toLocaleString('vi-VN')} VND</p>
              <p><strong>Người tạo:</strong> {selectedReturn.processedBy}</p>
            </div>

            {approvalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Lý do từ chối *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedReturn(null);
                  setRejectionReason('');
                }}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button 
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                onClick={handleApprovalSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : (approvalAction === 'approve' ? 'Duyệt' : 'Từ chối')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Return Modal */}
      <Modal
        title="Tạo phiếu hoàn trả"
        onClose={() => setShowCreateModal(false)}
        open={showCreateModal}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày hoàn trả</label>
              <Input
                type="date"
                value={returnForm.date}
                onChange={(e) => setReturnForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bộ phận</label>
              <select
                value={returnForm.department}
                onChange={(e) => setReturnForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Lý do hoàn trả</label>
            <select
              value={returnForm.reason}
              onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {reasons.map(reason => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
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
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.condition}
                            onChange={(e) => handleUpdateItem(index, 'condition', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            {conditions.map(condition => (
                              <option key={condition.value} value={condition.value}>
                                {condition.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                            placeholder="Ghi chú"
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

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              value={returnForm.notes}
              onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Ghi chú thêm..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Tạo phiếu hoàn trả
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Selection Modal */}
      <Modal
        title="Chọn hàng hóa"
        onClose={() => setShowItemModal(false)}
        open={showItemModal}
      >
        <div className="p-4">
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                    selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    Đơn vị: {getUnitName(item.unit_id)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddItem}
              disabled={!selectedItem}
            >
              Thêm
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ReturnManagement; 