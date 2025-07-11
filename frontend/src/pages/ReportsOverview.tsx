import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../store';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  link: string;
  roles: string[];
  bgColor: string;
  features: string[];
}

const reportCards: ReportCard[] = [
  {
    title: 'Phân tích & Báo cáo',
    description: 'Báo cáo tổng quan về doanh thu, chi phí và hiệu quả kinh doanh',
    icon: '📊',
    link: '/reports',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-blue-50 border-blue-200',
    features: ['Báo cáo doanh thu', 'Phân tích chi phí', 'Hiệu quả kinh doanh', 'Xu hướng bán hàng']
  },
  {
    title: 'Báo cáo Chênh lệch',
    description: 'Theo dõi và phân tích các chênh lệch tồn kho, tìm nguyên nhân',
    icon: '⚖️',
    link: '/variance',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-amber-50 border-amber-200',
    features: ['Chênh lệch tồn kho', 'Phân tích nguyên nhân', 'Báo cáo tổn thất', 'Khuyến nghị cải thiện']
  },
  {
    title: 'Đối chiếu Hàng ngày',
    description: 'Đối chiếu tồn kho hàng ngày, kiểm tra tính nhất quán của dữ liệu',
    icon: '🔄',
    link: '/reconciliation',
    roles: ['owner', 'manager', 'supervisor', 'staff'],
    bgColor: 'bg-green-50 border-green-200',
    features: ['Đối chiếu tự động', 'Báo cáo khác biệt', 'Lịch sử đối chiếu', 'Cảnh báo sai lệch']
  },
  {
    title: 'Phiếu & Báo cáo',
    description: 'Quản lý tài liệu, phiếu và các báo cáo in ấn',
    icon: '📄',
    link: '/documents',
    roles: ['owner', 'manager'],
    bgColor: 'bg-purple-50 border-purple-200',
    features: ['Tạo phiếu tự động', 'Mẫu báo cáo', 'Xuất PDF/Excel', 'Lưu trữ tài liệu']
  },
  {
    title: 'Lịch sử Giao dịch',
    description: 'Theo dõi tất cả các giao dịch nhập, xuất, hoàn trả và hao phí',
    icon: '📋',
    link: '/transactions',
    roles: ['owner', 'manager', 'supervisor', 'staff'],
    bgColor: 'bg-indigo-50 border-indigo-200',
    features: ['Lịch sử đầy đủ', 'Tìm kiếm nâng cao', 'Bộ lọc linh hoạt', 'Xuất báo cáo']
  }
];

const ReportsOverview: React.FC = () => {
  const { user } = useAuthStore();

  const filteredReports = reportCards.filter(report => 
    user && report.roles.includes(user.role)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Báo cáo & Phân tích</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tổng quan toàn diện về hoạt động kinh doanh của nhà hàng. 
            Từ báo cáo tài chính đến phân tích tồn kho, tất cả thông tin quan trọng đều có ở đây.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Báo cáo tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-gray-600">Độ chính xác tồn kho</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-amber-600">3</div>
            <div className="text-sm text-gray-600">Chênh lệch cần xử lý</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">25</div>
            <div className="text-sm text-gray-600">Tài liệu đã tạo</div>
          </Card>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <Card key={index} className={`${report.bgColor} border-2 hover:shadow-lg transition-shadow`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{report.icon}</div>
                  <div className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full">
                    {report.roles.includes('staff') ? 'Tất cả' : 'Quản lý'}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {report.title}
                </h3>
                
                <p className="text-gray-700 mb-4 text-sm">
                  {report.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Tính năng chính:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {report.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link to={report.link}>
                  <Button variant="primary" className="w-full">
                    Truy cập
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📊</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Báo cáo doanh thu tháng 1</div>
                  <div className="text-xs text-gray-500">Được tạo bởi Nguyễn Văn A</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">2 giờ trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-sm">⚖️</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Phát hiện chênh lệch tồn kho</div>
                  <div className="text-xs text-gray-500">Cần xem xét 3 mặt hàng</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">5 giờ trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🔄</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Đối chiếu tồn kho hoàn thành</div>
                  <div className="text-xs text-gray-500">Tất cả dữ liệu khớp chính xác</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">1 ngày trước</div>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="bg-gray-50">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cần hỗ trợ?</h3>
            <p className="text-gray-600 mb-4">
              Tham khảo hướng dẫn sử dụng hoặc liên hệ bộ phận hỗ trợ kỹ thuật
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary">
                📖 Hướng dẫn sử dụng
              </Button>
              <Button variant="secondary">
                💬 Hỗ trợ trực tuyến
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportsOverview; 