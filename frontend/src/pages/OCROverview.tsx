import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../store';

interface OCRFeatureCard {
  title: string;
  description: string;
  icon: string;
  link: string;
  roles: string[];
  bgColor: string;
  features: string[];
  accuracy: string;
}

const ocrFeatureCards: OCRFeatureCard[] = [
  {
    title: 'Xử lý Hóa đơn OCR',
    description: 'Sử dụng AI và OCR để tự động nhận diện và nhập liệu từ hóa đơn, biên lai',
    icon: '📄',
    link: '/ocr',
    roles: ['owner', 'manager', 'supervisor'],
    bgColor: 'bg-blue-50 border-blue-200',
    features: ['Nhận diện tự động', 'AI thông minh', 'Xác nhận thủ công', 'Học từ sửa lỗi'],
    accuracy: '95%'
  },
  {
    title: 'Chụp Hóa đơn',
    description: 'Chụp ảnh hóa đơn trực tiếp từ camera để xử lý OCR nhanh chóng',
    icon: '📷',
    link: '/camera',
    roles: ['owner', 'manager', 'supervisor', 'staff'],
    bgColor: 'bg-green-50 border-green-200',
    features: ['Chụp trực tiếp', 'Tối ưu chất lượng', 'Xử lý ngay lập tức', 'Hỗ trợ mobile'],
    accuracy: '90%'
  }
];

const OCROverview: React.FC = () => {
  const { user } = useAuthStore();

  const filteredFeatures = ocrFeatureCards.filter(feature => 
    user && feature.roles.includes(user.role)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Xử lý văn bản OCR</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sử dụng công nghệ AI và OCR tiên tiến để tự động nhận diện và nhập liệu từ hóa đơn, biên lai. 
            Tiết kiệm thời gian và giảm thiểu sai sót trong quá trình nhập liệu.
          </p>
        </div>

        {/* OCR Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-600">Hóa đơn xử lý tháng này</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">94.8%</div>
            <div className="text-sm text-gray-600">Độ chính xác OCR</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <div className="text-sm text-gray-600">Tiết kiệm thời gian</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-amber-600">15s</div>
            <div className="text-sm text-gray-600">Thời gian xử lý trung bình</div>
          </Card>
        </div>

        {/* OCR Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatures.map((feature, index) => (
            <Card key={index} className={`${feature.bgColor} border-2 hover:shadow-lg transition-shadow`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full">
                    Độ chính xác: {feature.accuracy}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-700 mb-4 text-sm">
                  {feature.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Tính năng chính:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {feature.features.map((featureItem, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {featureItem}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link to={feature.link}>
                  <Button variant="primary" className="w-full">
                    Sử dụng ngay
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* OCR Process Flow */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">🔄 Quy trình xử lý OCR</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Chụp ảnh</h3>
              <p className="text-xs text-gray-600">
                Chụp hoặc tải lên hình ảnh hóa đơn
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">AI xử lý</h3>
              <p className="text-xs text-gray-600">
                AI nhận diện và trích xuất thông tin
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Tự động điền</h3>
              <p className="text-xs text-gray-600">
                Form được điền tự động với dữ liệu
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👀</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Xác nhận</h3>
              <p className="text-xs text-gray-600">
                Người dùng kiểm tra và xác nhận
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Tạo phiếu</h3>
              <p className="text-xs text-gray-600">
                Tạo phiếu chờ phê duyệt
              </p>
            </div>
          </div>
        </Card>

        {/* Supported Document Types */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">📄 Loại tài liệu hỗ trợ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">🧾</div>
              <h3 className="font-semibold mb-1">Hóa đơn bán hàng</h3>
              <p className="text-sm text-gray-600">Độ chính xác: 96%</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold mb-1">Biên lai thu chi</h3>
              <p className="text-sm text-gray-600">Độ chính xác: 94%</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Bảng kê hàng hóa</h3>
              <p className="text-sm text-gray-600">Độ chính xác: 92%</p>
            </div>
          </div>
        </Card>

        {/* Recent OCR Activity */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Hoạt động OCR gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📄</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Xử lý hóa đơn #HD2024001</div>
                  <div className="text-xs text-gray-500">Nhận diện thành công 8/8 mặt hàng</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">30 phút trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📷</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Chụp hóa đơn mới</div>
                  <div className="text-xs text-gray-500">Chất lượng ảnh: Tốt</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">1 giờ trước</div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🤖</span>
                </div>
                <div>
                  <div className="font-medium text-sm">AI học từ sửa lỗi</div>
                  <div className="text-xs text-gray-500">Cải thiện độ chính xác nhận diện</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">2 giờ trước</div>
            </div>
          </div>
        </Card>

        {/* OCR Tips */}
        <Card className="bg-green-50">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">💡 Mẹo tăng độ chính xác OCR</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Chụp ảnh tốt</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Đảm bảo đủ ánh sáng</li>
                  <li>• Giữ camera ổn định</li>
                  <li>• Chụp thẳng góc, không nghiêng</li>
                  <li>• Tránh bóng che hoặc phản chiếu</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Chuẩn bị tài liệu</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Làm phẳng giấy, tránh nhăn</li>
                  <li>• Lau sạch bụi bẩn</li>
                  <li>• Đảm bảo chữ rõ nét</li>
                  <li>• Kiểm tra toàn bộ nội dung</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Technology Info */}
        <Card className="bg-gray-50">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Công nghệ sử dụng</h3>
            <p className="text-gray-600 mb-4">
              Hệ thống OCR được tối ưu đặc biệt cho tiếng Việt với sự kết hợp của nhiều công nghệ AI tiên tiến
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-sm">Google Vision API</h4>
                <p className="text-xs text-gray-600">Nhận diện chính xác</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-sm">Tesseract OCR</h4>
                <p className="text-xs text-gray-600">Xử lý văn bản nhanh</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">🧠</div>
                <h4 className="font-semibold text-sm">OpenAI GPT</h4>
                <p className="text-xs text-gray-600">Hiểu nghĩa và sửa lỗi</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default OCROverview; 