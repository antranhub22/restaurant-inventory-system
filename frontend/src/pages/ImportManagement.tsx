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

interface ImportItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  expiryDate?: string;
  notes?: string;
}

interface ImportForm {
  date: string;
  supplier: string;
  invoiceNumber: string;
  purchaseOrder: string;
  items: ImportItem[];
  totalAmount: number;
  notes: string;
}

interface ImportRecord {
  id: number;
  date: string;
  supplier: string;
  invoiceNumber: string;
  status: string;
  totalItems: number;
  totalAmount: number;
  processedBy: string;
}

const suppliers = [
  { value: '', label: 'Chọn nhà cung cấp...' },
  { value: 'supplier_a', label: 'Nhà cung cấp A' },
  { value: 'supplier_b', label: 'Nhà cung cấp B' },
  { value: 'supplier_c', label: 'Nhà cung cấp C' }
];

const ImportManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importForm, setImportForm] = useState<ImportForm>({
    date: new Date().toISOString().split('T')[0],
    supplier: 'supplier_a',
    invoiceNumber: '',
    purchaseOrder: '',
    items: [],
    totalAmount: 0,
    notes: ''
  });

  // Import records data
  const [imports, setImports] = useState<ImportRecord[]>([]);

  const getUnitName = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.abbreviation : '';
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateFormTotal = () => {
    return importForm.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleAddItem = () => {
    if (selectedItem) {
      const newItem: ImportItem = {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        unit: getUnitName(selectedItem.unit_id),
        expiryDate: '',
        notes: ''
      };
      
      setImportForm(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      setShowItemModal(false);
      setSelectedItem(null);
    }
  };

  const handleUpdateItem = (index: number, field: keyof ImportItem, value: any) => {
    setImportForm(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total price when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = calculateItemTotal(
              field === 'quantity' ? value : item.quantity,
              field === 'unitPrice' ? value : item.unitPrice
            );
          }
          return updatedItem;
        }
        return item;
      });
      
      const totalAmount = updatedItems.reduce((total, item) => total + item.totalPrice, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalAmount
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setImportForm(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = updatedItems.reduce((total, item) => total + item.totalPrice, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalAmount
      };
    });
  };

  const handleSubmit = () => {
    console.log('Tạo phiếu nhập kho:', importForm);
    // TODO: Call API to create import
    setShowCreateModal(false);
    setImportForm({
      date: new Date().toISOString().split('T')[0],
      supplier: 'supplier_a',
      invoiceNumber: '',
      purchaseOrder: '',
      items: [],
      totalAmount: 0,
      notes: ''
    });
  };

  // Approval handlers
  const handleApprovalClick = (importItem: any, action: 'approve' | 'reject') => {
    setSelectedImport(importItem);
    setApprovalAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedImport) return;

    setIsLoading(true);
    try {
      if (approvalAction === 'approve') {
        await approvalService.approveImport(selectedImport.id);
        
        setImports(prev => prev.map(imp => 
          imp.id === selectedImport.id 
            ? { ...imp, status: 'approved' }
            : imp
        ));
        
        alert('Đã duyệt phiếu nhập kho thành công!');
      } else {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối');
          return;
        }
        
        await approvalService.rejectImport(selectedImport.id, rejectionReason);
        
        setImports(prev => prev.map(imp => 
          imp.id === selectedImport.id 
            ? { ...imp, status: 'rejected' }
            : imp
        ));
        
        alert('Đã từ chối phiếu nhập kho');
      }
      
      setShowApprovalModal(false);
      setSelectedImport(null);
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
          <h1 className="text-2xl font-bold">📦 Quản lý Nhập Kho</h1>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Tạo phiếu nhập kho
          </Button>
        </div>

        {/* Imports List */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Danh sách phiếu nhập kho</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Ngày</th>
                  <th className="text-left py-3 px-4">Nhà cung cấp</th>
                  <th className="text-left py-3 px-4">Số hóa đơn</th>
                  <th className="text-left py-3 px-4">Số mặt hàng</th>
                  <th className="text-left py-3 px-4">Tổng tiền</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Người tạo</th>
                  <th className="text-left py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {imports.map(imp => (
                  <tr key={imp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(imp.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">{imp.supplier}</td>
                    <td className="py-3 px-4 font-mono">{imp.invoiceNumber}</td>
                    <td className="py-3 px-4">{imp.totalItems}</td>
                    <td className="py-3 px-4 font-semibold">
                      {formatCurrency(imp.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(imp.status)}`}>
                        {getStatusText(imp.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{imp.processedBy}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {imp.status === 'pending' && canApprove && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => handleApprovalClick(imp, 'approve')}
                              className="text-xs px-2 py-1"
                            >
                              Duyệt
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleApprovalClick(imp, 'reject')}
                              className="text-xs px-2 py-1"
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button
                          variant="secondary"
                          className="text-xs px-2 py-1"
                          onClick={() => console.log('View details:', imp)}
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

        {/* Create Import Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tạo phiếu nhập kho"
        >
          <div className="space-y-4">
            {/* Import Form Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ngày nhập"
                type="date"
                value={importForm.date}
                onChange={(e) => setImportForm(prev => ({ ...prev, date: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp
                </label>
                <select
                  value={importForm.supplier}
                  onChange={(e) => setImportForm(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suppliers.map(supplier => (
                    <option key={supplier.value} value={supplier.value}>
                      {supplier.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Số hóa đơn"
                value={importForm.invoiceNumber}
                onChange={(e) => setImportForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="VD: HĐ001"
              />
              <Input
                label="Số đơn hàng"
                value={importForm.purchaseOrder}
                onChange={(e) => setImportForm(prev => ({ ...prev, purchaseOrder: e.target.value }))}
                placeholder="VD: PO001"
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Danh sách hàng hóa</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowItemModal(true)}
                >
                  Thêm hàng hóa
                </Button>
              </div>

              {importForm.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium">Hàng hóa</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Số lượng</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Đơn giá</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Thành tiền</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Hạn sử dụng</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Ghi chú</th>
                        <th className="text-left py-2 px-3 text-sm font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importForm.items.map((item, index) => (
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
                              step="0.01"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-24 text-sm"
                              min="0"
                              step="1000"
                            />
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold">
                            {formatCurrency(item.totalPrice)}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleUpdateItem(index, 'expiryDate', e.target.value)}
                              className="w-32 text-sm"
                            />
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
                        <td colSpan={3} className="py-2 px-3 text-sm font-semibold text-right">
                          Tổng cộng:
                        </td>
                        <td className="py-2 px-3 text-sm font-bold">
                          {formatCurrency(calculateFormTotal())}
                        </td>
                        <td colSpan={3}></td>
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
                value={importForm.notes}
                onChange={(e) => setImportForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú về phiếu nhập kho..."
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
                disabled={importForm.items.length === 0}
              >
                Tạo phiếu nhập kho
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
              {items.length > 0 ? (
                items.map(item => (
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
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-lg font-medium mb-2">Chưa có hàng hóa nào</div>
                  <div className="text-sm text-gray-400 mb-4">
                    Vui lòng thêm hàng hóa vào hệ thống trước khi tạo phiếu nhập kho
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowItemModal(false);
                      // Navigate to items management page
                      window.location.href = '/items';
                    }}
                  >
                    Quản lý hàng hóa
                  </Button>
                </div>
              )}
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
          title={approvalAction === 'approve' ? 'Duyệt phiếu nhập kho' : 'Từ chối phiếu nhập kho'}
        >
          {selectedImport && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Thông tin phiếu nhập kho</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Ngày: {new Date(selectedImport.date).toLocaleDateString('vi-VN')}</div>
                  <div>Nhà cung cấp: {selectedImport.supplier}</div>
                  <div>Số hóa đơn: {selectedImport.invoiceNumber}</div>
                  <div>Tổng tiền: {formatCurrency(selectedImport.totalAmount)}</div>
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
                    placeholder="Nhập lý do từ chối phiếu nhập kho..."
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

export default ImportManagement; 