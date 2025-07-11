import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import { useAuthStore } from '../store';
import approvalService from '../services/approval.service';

const Dashboard: React.FC = () => {
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

  useEffect(() => {
    loadPendingRecords();
  }, []);

  const loadPendingRecords = async () => {
    try {
      if (user && ['owner', 'manager'].includes(user.role)) {
        const data = await approvalService.getAllPendingRecords();
        setPendingRecords(data);
      }
    } catch (error) {
      console.error('Error loading pending records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dashboard stats data
  const stats = {
    totalItems: 0,
    lowStockItems: 0,
    todayTransactions: 0,
    pendingApprovals: pendingRecords.totalCount,
    totalValue: 0,
  };

  const recentTransactions: any[] = [];

  return (
    <Layout header={<div className="text-2xl font-bold">Bảng điều khiển</div>}>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Tổng mặt hàng</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <div className="text-sm text-gray-600">Sắp hết hàng</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-2xl font-bold text-green-600">{stats.todayTransactions}</div>
              <div className="text-sm text-gray-600">Giao dịch hôm nay</div>
            </div>
          </Card>
          
          {/* Show pending approvals widget for managers and owners */}
          {user && ['owner', 'manager'].includes(user.role) && (
            <Card>
              <div className="text-center">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {loading ? '...' : stats.pendingApprovals}
                </div>
                <div className="text-sm text-gray-600">Chờ phê duyệt</div>
                {pendingRecords.totalCount > 0 && (
                  <Link 
                    to="/approval" 
                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                  >
                    Xem chi tiết
                  </Link>
                )}
              </div>
            </Card>
          )}
          
          <Card>
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-2xl font-bold text-purple-600">
                {(stats.totalValue / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Tổng giá trị kho</div>
            </div>
          </Card>
        </div>

        {/* Pending Approvals Detail (Show for managers/owners) */}
        {user && ['owner', 'manager'].includes(user.role) && pendingRecords.totalCount > 0 && (
          <Card header="Phiếu chờ phê duyệt">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {pendingRecords.imports.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <div>
                      <div className="font-semibold text-blue-800">{pendingRecords.imports.length}</div>
                      <div className="text-xs text-blue-600">Phiếu nhập kho</div>
                    </div>
                  </div>
                </div>
              )}
              
              {pendingRecords.exports.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📤</span>
                    <div>
                      <div className="font-semibold text-green-800">{pendingRecords.exports.length}</div>
                      <div className="text-xs text-green-600">Phiếu xuất kho</div>
                    </div>
                  </div>
                </div>
              )}
              
              {pendingRecords.returns.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">↩️</span>
                    <div>
                      <div className="font-semibold text-orange-800">{pendingRecords.returns.length}</div>
                      <div className="text-xs text-orange-600">Phiếu hoàn trả</div>
                    </div>
                  </div>
                </div>
              )}
              
              {pendingRecords.wastes.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗑️</span>
                    <div>
                      <div className="font-semibold text-red-800">{pendingRecords.wastes.length}</div>
                      <div className="text-xs text-red-600">Báo cáo hao hụt</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <Link 
                to="/approval"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">✅</span>
                Đi đến trang phê duyệt
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card header="Giao dịch gần đây">
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{transaction.type}</div>
                    <div className="text-sm text-gray-500">{transaction.time}</div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} VND
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link to="/transactions" className="text-blue-600 hover:text-blue-800">
                Xem tất cả giao dịch →
              </Link>
            </div>
          </Card>

          {/* Low Stock Alert */}
          <Card header="Cảnh báo tồn kho thấp">
            <div className="space-y-3">
              {stats.lowStockItems === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Không có cảnh báo tồn kho
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link to="/inventory" className="text-blue-600 hover:text-blue-800">
                Xem tồn kho →
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card header="Thao tác nhanh">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/ocr" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Xử lý OCR</div>
            </Link>
            
            <Link to="/transactions" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-2">➕</div>
              <div className="font-medium">Thêm giao dịch</div>
            </Link>
            
            <Link to="/inventory" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium">Kiểm kê</div>
            </Link>
            
            <Link to="/reports" className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Báo cáo</div>
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard; 