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

interface ExportItem {
  itemId: number;
  itemName: string;
  quantity: number;
  currentStock: number;
  unit: string;
  notes?: string;
}

interface ExportForm {
  date: string;
  purpose: string;
  department: string;
  items: ExportItem[];
  notes: string;
}

const purposes = [
  { value: 'production', label: 'Sản xuất' },
  { value: 'sale', label: 'Bán hàng' },
  { value: 'damage', label: 'Hỏng hóc' },
  { value: 'return', label: 'Trả nhà cung cấp' },
  { value: 'transfer', label: 'Chuyển kho' },
];

const departments = [
  { value: 'kitchen', label: 'Bếp' },
  { value: 'bar', label: 'Quầy bar' },
  { value: 'storage', label: 'Kho' },
  { value: 'service', label: 'Phục vụ' },
];

const ExportManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedExport, setSelectedExport] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exportForm, setExportForm] = useState<ExportForm>({
    date: new Date().toISOString().split('T')[0],
    purpose: 'production',
    department: 'kitchen',
    items: [],
    notes: ''
  });

  // Mock data for existing exports
  const [exports, setExports] = useState([
    {
      id: 1,
      date: '2024-01-15',
      purpose: 'production',
      department: 'kitchen',
      status: 'approved',
      totalItems: 5,
      totalValue: 2500000,
      processedBy: 'Nguyễn Văn A'
    },
    {
      id: 2,
      date: '2024-01-14',
      purpose: 'sale',
      department: 'bar',
      status: 'pending',
      totalItems: 3,
      totalValue: 1200000,
      processedBy: 'Trần Thị B'
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

  const handleAddItem = () => {
    if (selectedItem) {
      const newItem: ExportItem = {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: 1,
        currentStock: getItemStock(selectedItem.id),
        unit: getUnitName(selectedItem.unit_id),
        notes: ''
      };
      
      setExportForm(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      setShowItemModal(false);
      setSelectedItem(null);
    }
  };

  const handleUpdateItem = (index: number, field: keyof ExportItem, value: any) => {
    setExportForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveItem = (index: number) => {
    setExportForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    console.log('Tạo phiếu xuất kho:', exportForm);
    // TODO: Call API to create export
    setShowCreateModal(false);
    setExportForm({
      date: new Date().toISOString().split('T')[0],
      purpose: 'production',
      department: 'kitchen',
      items: [],
      notes: ''
    });
  };

  // New approval handlers
  const handleApprovalClick = (exportItem: any, action: 'approve' | 'reject') => {
    setSelectedExport(exportItem);
    setApprovalAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedExport) return;

    setIsLoading(true);
    try {
      if (approvalAction === 'approve') {
        await approvalService.approveExport(selectedExport.id);
        
        // Update local state
        setExports(prev => prev.map(exp => 
          exp.id === selectedExport.id 
            ? { ...exp, status: 'approved' }
            : exp
        ));
        
        alert('Đã duyệt phiếu xuất kho thành công!');
      } else {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối');
          return;
        }
        
        await approvalService.rejectExport(selectedExport.id, rejectionReason);
        
        // Update local state
        setExports(prev => prev.map(exp => 
          exp.id === selectedExport.id 
            ? { ...exp, status: 'rejected' }
            : exp
        ));
        
        alert('Đã từ chối phiếu xuất kho');
      }
      
      setShowApprovalModal(false);
      setSelectedExport(null);
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

  const getPurposeText = (purpose: string) => {
    const p = purposes.find(p => p.value === purpose);
    return p ? p.label : purpose;
  };

  const getDepartmentText = (department: string) => {
    const d = departments.find(d => d.value === department);
    return d ? d.label : department;
  };

  if (!user || !['owner', 'manager', 'supervisor'].includes(user.role)) {
    return (
      <Layout header={<div className='text-2xl font-bold'>Quản lý Phiếu Xuất kho</div>}>
        <div className='text-center text-red-500 py-8'>
          Bạn không có quyền truy cập chức năng này.
        </div>
      </Layout>
    );
  }

  return (
    <Layout header={
      <div className="text-2xl font-bold flex items-center justify-between">
        📦 Quản lý Phiếu Xuất kho
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="text-sm"
        >
          + Tạo phiếu xuất
        </Button>
      </div>
    }>
      {/* Export List */}
      <Card header="Danh sách phiếu xuất kho">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-left">Mục đích</th>
                <th className="px-4 py-2 text-left">Bộ phận</th>
                <th className="px-4 py-2 text-left">Số mặt hàng</th>
                <th className="px-4 py-2 text-left">Tổng giá trị</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Người tạo</th>
                <th className="px-4 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((export_item) => (
                <tr key={export_item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{export_item.date}</td>
                  <td className="px-4 py-2">{getPurposeText(export_item.purpose)}</td>
                  <td className="px-4 py-2">{getDepartmentText(export_item.department)}</td>
                  <td className="px-4 py-2">{export_item.totalItems}</td>
                  <td className="px-4 py-2">{export_item.totalValue.toLocaleString('vi-VN')} VND</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(export_item.status)}`}>
                      {getStatusText(export_item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">{export_item.processedBy}</td>
                  <td className="px-4 py-2">
                    <Button variant="secondary" className="text-xs mr-2">Xem</Button>
                    {export_item.status === 'pending' && user && ['owner', 'manager'].includes(user.role) && (
                      <>
                        <Button 
                          variant="primary" 
                          className="text-xs mr-2"
                          onClick={() => handleApprovalClick(export_item, 'approve')}
                        >
                          Duyệt
                        </Button>
                        <Button 
                          variant="danger" 
                          className="text-xs"
                          onClick={() => handleApprovalClick(export_item, 'reject')}
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
      {showApprovalModal && selectedExport && (
        <Modal
          title={`${approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'} phiếu xuất kho #${selectedExport.id}`}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedExport(null);
            setRejectionReason('');
          }}
          open={showApprovalModal}
        >
          <div className="p-4">
            <div className="mb-4">
              <p><strong>Ngày:</strong> {selectedExport.date}</p>
              <p><strong>Mục đích:</strong> {getPurposeText(selectedExport.purpose)}</p>
              <p><strong>Bộ phận:</strong> {getDepartmentText(selectedExport.department)}</p>
              <p><strong>Số mặt hàng:</strong> {selectedExport.totalItems}</p>
              <p><strong>Tổng giá trị:</strong> {selectedExport.totalValue.toLocaleString('vi-VN')} VND</p>
              <p><strong>Người tạo:</strong> {selectedExport.processedBy}</p>
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
                  setSelectedExport(null);
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

      {/* Create Export Modal */}
      <Modal
        title="Tạo phiếu xuất kho"
        onClose={() => setShowCreateModal(false)}
        open={showCreateModal}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày xuất</label>
              <Input
                type="date"
                value={exportForm.date}
                onChange={(e) => setExportForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mục đích</label>
              <select
                value={exportForm.purpose}
                onChange={(e) => setExportForm(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {purposes.map(purpose => (
                  <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bộ phận</label>
            <select
              value={exportForm.department}
              onChange={(e) => setExportForm(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
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
            
            {exportForm.items.length > 0 ? (
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên hàng</th>
                      <th className="px-3 py-2 text-left">Tồn kho</th>
                      <th className="px-3 py-2 text-left">Số lượng xuất</th>
                      <th className="px-3 py-2 text-left">Ghi chú</th>
                      <th className="px-3 py-2 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportForm.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{item.itemName}</td>
                        <td className="px-3 py-2">{item.currentStock} {item.unit}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                            className="w-20"
                            min="1"
                            max={item.currentStock}
                          />
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
              value={exportForm.notes}
              onChange={(e) => setExportForm(prev => ({ ...prev, notes: e.target.value }))}
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
              Tạo phiếu xuất
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
                    Tồn kho: {getItemStock(item.id)} {getUnitName(item.unit_id)}
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

export default ExportManagement; 