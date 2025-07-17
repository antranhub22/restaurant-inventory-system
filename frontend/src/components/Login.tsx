import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from './common/Input';
import Button from './common/Button';
import Card from './common/Card';
import authService from '../services/auth.service';
import { checkApiHealth } from '../utils/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  // Check API health on component mount
  React.useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkApiHealth();
      setApiHealthy(healthy);
    };
    checkHealth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password.length < 4) {
      setError('Mật khẩu phải có ít nhất 4 ký tự');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) return;

    // Check API health before attempting login
    if (apiHealthy === false) {
      setError('Hệ thống đang bảo trì. Vui lòng thử lại sau.');
      return;
    }

    setLoading(true);

    try {
      await authService.login({
        email: formData.username, // Backend accepts both email and username
        password: formData.password
      });
      
      // Success - redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('Thông tin đăng nhập không chính xác');
      } else if (err.response?.status === 403) {
        setError('Tài khoản của bạn đã bị khóa');
      } else if (err.response?.status >= 500) {
        setError('Lỗi hệ thống. Vui lòng thử lại sau.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = () => {
    if (apiHealthy === null) {
      return (
        <div className="bg-gray-50 text-gray-600 p-3 rounded-md text-sm mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            Đang kiểm tra kết nối...
          </div>
        </div>
      );
    } else if (apiHealthy === false) {
      return (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          <div className="flex items-center">
            <span className="mr-2">🔴</span>
            Không thể kết nối đến server
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-4">
          <div className="flex items-center">
            <span className="mr-2">🟢</span>
            Hệ thống hoạt động bình thường
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Card header={
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
            <p className="text-gray-600 mt-2">Restaurant Inventory System</p>
          </div>
        }>
          {/* Connection Status */}
          {getConnectionStatus()}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
            
            <Input
              label="Tên đăng nhập hoặc Email"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên đăng nhập hoặc email"
              autoComplete="username"
              disabled={loading || apiHealthy === false}
            />

            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              showPasswordToggle={true}
              autoComplete="current-password"
              disabled={loading || apiHealthy === false}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              disabled={apiHealthy === false}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Tài khoản demo:</h4>
            <div className="text-xs text-blue-600 space-y-1">
              <div>• Username: <code className="bg-blue-100 px-1 rounded">owner</code> - Password: <code className="bg-blue-100 px-1 rounded">1234</code></div>
              <div>• Username: <code className="bg-blue-100 px-1 rounded">admin</code> - Password: <code className="bg-blue-100 px-1 rounded">admin123</code></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;