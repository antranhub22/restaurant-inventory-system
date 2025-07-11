import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useAuthStore } from '../store';
import approvalService from '../services/approval.service';

const ApprovalDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [pendingRecords, setPendingRecords] = useState<{
    imports: any[];
    exports: any[];
    returns: any[];
    wastes: any[];
    totalCount: number;
  }>({
    imports: [],
    exports: [],
    returns: [],
    wastes: [],
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingRecords();
  }, []);

  const loadPendingRecords = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getAllPendingRecords();
      setPendingRecords(data);
    } catch (error) {
      console.error('Error loading pending records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalClick = (record: any, type: string, action: 'approve' | 'reject') => {
    setSelectedRecord({ ...record, recordType: type });
    setApprovalAction(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedRecord) return;

    setIsProcessing(true);
    try {
      const { id, recordType } = selectedRecord;
      
      if (approvalAction === 'approve') {
        switch (recordType) {
          case 'imports':
            await approvalService.approveImport(id);
            break;
          case 'exports':
            await approvalService.approveExport(id);
            break;
          case 'returns':
            await approvalService.approveReturn(id);
            break;
          case 'wastes':
            await approvalService.approveWaste(id);
            break;
        }
        alert(`Đã duyệt ${getRecordTypeText(recordType)} thành công!`);
      } else {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối');
          return;
        }
        
        switch (recordType) {
          case 'imports':
            await approvalService.rejectImport(id, rejectionReason);
            break;
          case 'exports':
            await approvalService.rejectExport(id, rejectionReason);
            break;
          case 'returns':
            await approvalService.rejectReturn(id, rejectionReason);
            break;
          case 'wastes':
            await approvalService.rejectWaste(id, rejectionReason);
            break;
        }
        alert(`Đã từ chối ${getRecordTypeText(recordType)}`);
      }
      
      setShowApprovalModal(false);
      setSelectedRecord(null);
      setRejectionReason('');
      
      // Reload pending records
      await loadPendingRecords();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý phê duyệt');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecordTypeText = (type: string) => {
    switch (type) {
      case 'imports': return 'phiếu nhập kho';
      case 'exports': return 'phiếu xuất kho';
      case 'returns': return 'phiếu hoàn trả';
      case 'wastes': return 'báo cáo hao hụt';
      default: return 'phiếu';
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'imports': return '📦';
      case 'exports': return '📤';
      case 'returns': return '↩️';
      case 'wastes': return '🗑️';
      default: return '📄';
    }
  };

  const getAllRecords = () => {
    const allRecords: Array<any & { recordType: string }> = [
      ...pendingRecords.imports.map(r => ({ ...r, recordType: 'imports' })),
      ...pendingRecords.exports.map(r => ({ ...r, recordType: 'exports' })),
      ...pendingRecords.returns.map(r => ({ ...r, recordType: 'returns' })),
      ...pendingRecords.wastes.map(r => ({ ...r, recordType: 'wastes' }))
    ];
    
    // Sort by creation date, newest first
    return allRecords.sort((a, b) => 
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  };

  if (!user || !['owner', 'manager'].includes(user.role)) {
    return (
      <Layout header={<div className='text-2xl font-bold'>Dashboard Phê duyệt</div>}>
        <div className='text-center text-red-500 py-8'>
          Bạn không có quyền truy cập chức năng này.
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout header={<div className='text-2xl font-bold'>Dashboard Phê duyệt</div>}>
        <div className='text-center py-8'>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout header={
      <div className="text-2xl font-bold flex items-center justify-between">
        ✅ Dashboard Phê duyệt
        <div className="text-sm font-normal">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            {pendingRecords.totalCount} phiếu chờ duyệt
          </span>
        </div>
      </div>
    }>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl">📦</div>
            <div className="text-2xl font-bold text-blue-600">{pendingRecords.imports.length}</div>
            <div className="text-sm text-gray-600">Phiếu nhập kho</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl">📤</div>
            <div className="text-2xl font-bold text-green-600">{pendingRecords.exports.length}</div>
            <div className="text-sm text-gray-600">Phiếu xuất kho</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl">↩️</div>
            <div className="text-2xl font-bold text-orange-600">{pendingRecords.returns.length}</div>
            <div className="text-sm text-gray-600">Phiếu hoàn trả</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl">🗑️</div>
            <div className="text-2xl font-bold text-red-600">{pendingRecords.wastes.length}</div>
            <div className="text-sm text-gray-600">Báo cáo hao hụt</div>
          </div>
        </Card>
      </div>

      {/* Pending Records List */}
      <Card header="Tất cả phiếu chờ duyệt">
        {pendingRecords.totalCount === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-xl mb-2">Không có phiếu nào chờ duyệt</div>
            <div className="text-sm">Tất cả phiếu đã được xử lý xong!</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Loại</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Ngày</th>
                  <th className="px-4 py-2 text-left">Người tạo</th>
                  <th className="px-4 py-2 text-left">Số mặt hàng</th>
                  <th className="px-4 py-2 text-left">Tổng giá trị</th>
                  <th className="px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {getAllRecords().map((record) => (
                  <tr key={`${record.recordType}-${record.id}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRecordTypeIcon(record.recordType)}</span>
                        <span className="text-xs font-medium">
                          {getRecordTypeText(record.recordType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">#{record.id}</td>
                    <td className="px-4 py-2">{record.date}</td>
                    <td className="px-4 py-2">{record.processedBy?.username || record.processedBy || 'N/A'}</td>
                    <td className="px-4 py-2">{record.items?.length || record.totalItems || 0}</td>
                    <td className="px-4 py-2">
                      {record.totalValue ? `${record.totalValue.toLocaleString('vi-VN')} VND` : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          className="text-xs"
                        >
                          Xem
                        </Button>
                        <Button 
                          variant="primary" 
                          className="text-xs"
                          onClick={() => handleApprovalClick(record, record.recordType, 'approve')}
                        >
                          Duyệt
                        </Button>
                        <Button 
                          variant="danger" 
                          className="text-xs"
                          onClick={() => handleApprovalClick(record, record.recordType, 'reject')}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Approval Modal */}
      {showApprovalModal && selectedRecord && (
        <Modal
          title={`${approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'} ${getRecordTypeText(selectedRecord.recordType)} #${selectedRecord.id}`}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRecord(null);
            setRejectionReason('');
          }}
          open={showApprovalModal}
        >
          <div className="p-4">
            <div className="mb-4">
              <p><strong>Loại:</strong> {getRecordTypeText(selectedRecord.recordType)}</p>
              <p><strong>Ngày:</strong> {selectedRecord.date}</p>
              <p><strong>Người tạo:</strong> {selectedRecord.processedBy?.username || selectedRecord.processedBy}</p>
              <p><strong>Số mặt hàng:</strong> {selectedRecord.items?.length || selectedRecord.totalItems || 0}</p>
              {selectedRecord.totalValue && (
                <p><strong>Tổng giá trị:</strong> {selectedRecord.totalValue.toLocaleString('vi-VN')} VND</p>
              )}
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
                  setSelectedRecord(null);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
              >
                Hủy
              </Button>
              <Button 
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                onClick={handleApprovalSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xử lý...' : (approvalAction === 'approve' ? 'Duyệt' : 'Từ chối')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ApprovalDashboard; 