import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../store';

interface EntryFormCard {
  title: string;
  description: string;
  icon: string;
  link: string;
  roles: string[];
  bgColor: string;
  features: string[];
  type: string;
}

const entryFormCards: EntryFormCard[] = [
  {
    title: 'Phiếu Nhập Kho',
    description: 'Tạo phiếu nhập kho cho các lô hàng mới từ nhà cung cấp',
    icon: '📦',
    link: '/manual/import',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-green-50 border-green-200',
    features: ['Nhập từ nhà cung cấp', 'Quản lý hóa đơn', 'Theo dõi hạn sử dụng', 'Tính giá thành'],
    type: 'import'
  },
  {
    title: 'Phiếu Xuất Kho',
    description: 'Ghi nhận xuất kho cho sản xuất, bán hàng và các mục đích khác',
    icon: '📤',
    link: '/manual/export',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-blue-50 border-blue-200',
    features: ['Xuất sản xuất', 'Xuất bán hàng', 'Chuyển kho', 'Kiểm soát tồn kho'],
    type: 'export'
  },
  {
    title: 'Phiếu Hoàn Kho',
    description: 'Xử lý hàng hoàn trả từ khách hàng hoặc từ bộ phận sản xuất',
    icon: '↩️',
    link: '/manual/return',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-amber-50 border-amber-200',
    features: ['Hoàn từ khách hàng', 'Hoàn từ sản xuất', 'Kiểm tra chất lượng', 'Xử lý hoàn tiền'],
    type: 'return'
  },
  {
    title: 'Phiếu Hao Phí',
    description: 'Ghi nhận và theo dõi các khoản hao phí, mất mát trong quá trình kinh doanh',
    icon: '🗑️',
    link: '/manual/waste',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-red-50 border-red-200',
    features: ['Hao phí nguyên liệu', 'Hàng hết hạn', 'Sản phẩm lỗi', 'Phân tích nguyên nhân'],
    type: 'waste'
  },
  {
    title: 'Phiếu Kiểm Kho',
    description: 'Thực hiện kiểm kho định kỳ và đột xuất, so sánh với sổ sách',
    icon: '📊',
    link: '/manual/inventory-check',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-purple-50 border-purple-200',
    features: ['Kiểm kho định kỳ', 'Kiểm tra đột xuất', 'So sánh chênh lệch', 'Tạo điều chỉnh'],
    type: 'check'
  }
];

const ManualEntryOverview: React.FC = () => {
  const { user } = useAuthStore();

  const filteredForms = entryFormCards.filter(form => 
    user && form.roles.includes(user.role)
  );

  const getTypeStats = (type: string) => {
    // Mock data for demonstration
    const stats = {
      import: { count: 8, value: '15.2M VND' },
      export: { count: 12, value: '8.7M VND' },
      return: { count: 3, value: '1.2M VND' },
      waste: { count: 5, value: '800K VND' },
      check: { count: 2, variance: '3 mặt hàng' }
    };
    return stats[type as keyof typeof stats] || { count: 0 };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✏️ Nhập Dữ liệu Thủ công</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tạo và quản lý các phiếu nhập liệu thủ công cho tất cả hoạt động kho hàng. 
            Từ nhập kho đến kiểm kho, tất cả đều được quản lý một cách có hệ thống.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-xl font-bold text-green-600">8</div>
            <div className="text-xs text-gray-600">Phiếu nhập tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-600">Phiếu xuất tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-xl font-bold text-amber-600">3</div>
            <div className="text-xs text-gray-600">Phiếu hoàn tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-xl font-bold text-red-600">5</div>
            <div className="text-xs text-gray-600">Phiếu hao phí tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-xl font-bold text-purple-600">2</div>
            <div className="text-xs text-gray-600">Lần kiểm kho tháng này</div>
          </Card>
        </div>

        {/* Entry Form Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredForms.map((form, index) => {
            const stats = getTypeStats(form.type);
            
            return (
              <Card key={index} className={`${form.bgColor} border-2 hover:shadow-lg transition-shadow`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{form.icon}</div>
                    <div className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full">
                      Quản lý
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {form.title}
                  </h3>
                  
                  <p className="text-gray-700 mb-4 text-sm">
                    {form.description}
                  </p>

                  {/* Stats for this form type */}
                  <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-md">
                    <div className="text-xs text-gray-600 mb-1">Tháng này:</div>
                    <div className="flex justify-between text-sm">
                      <span>Số phiếu:</span>
                      <span className="font-semibold">{stats?.count || 0}</span>
                    </div>
                    {'value' in stats && stats.value && (
                      <div className="flex justify-between text-sm">
                        <span>Giá trị:</span>
                        <span className="font-semibold">{stats.value}</span>
                      </div>
                    )}
                    {'variance' in stats && stats.variance && (
                      <div className="flex justify-between text-sm">
                        <span>Chênh lệch:</span>
                        <span className="font-semibold">{stats.variance}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Tính năng chính:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {form.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link to={form.link}>
                    <Button variant="primary" className="w-full">
                      Tạo phiếu mới
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Workflow Guide */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">🔄 Quy trình làm việc</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Tạo phiếu</h3>
              <p className="text-sm text-gray-600">
                Chọn loại phiếu phù hợp và điền thông tin chi tiết
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Chờ phê duyệt</h3>
              <p className="text-sm text-gray-600">
                Phiếu sẽ được gửi đến quản lý để xem xét và phê duyệt
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Cập nhật tồn kho</h3>
              <p className="text-sm text-gray-600">
                Sau khi duyệt, hệ thống tự động cập nhật tồn kho
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📦</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Phiếu nhập kho #NK001</div>
                  <div className="text-xs text-gray-500">Nguyên liệu từ Công ty TNHH ABC</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">1 giờ trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📤</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Phiếu xuất kho #XK015</div>
                  <div className="text-xs text-gray-500">Xuất cho sản xuất bếp</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">3 giờ trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Kiểm kho định kỳ hoàn thành</div>
                  <div className="text-xs text-gray-500">Phát hiện 3 mặt hàng chênh lệch</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">6 giờ trước</div>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Mẹo sử dụng hiệu quả</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Tối ưu thời gian</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sử dụng OCR cho nhập liệu nhanh</li>
                  <li>• Tạo template cho phiếu thường dùng</li>
                  <li>• Nhập liệu theo batch cho hiệu quả</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Đảm bảo chính xác</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Kiểm tra kỹ trước khi gửi duyệt</li>
                  <li>• Đối chiếu với hóa đơn gốc</li>
                  <li>• Ghi chú rõ ràng khi cần thiết</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ManualEntryOverview; 