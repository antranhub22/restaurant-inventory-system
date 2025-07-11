import React from 'react';
import { useAuthStore } from '../../store';
import Button from './Button';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const sampleUsers = [
  { id: 1, email: 'owner@restaurant.com', full_name: 'Nguyễn Văn An', role: 'owner' as const, is_active: true },
  { id: 2, email: 'manager@restaurant.com', full_name: 'Trần Thị Bình', role: 'manager' as const, is_active: true },
  { id: 3, email: 'kitchen@restaurant.com', full_name: 'Lê Văn Cường', role: 'supervisor' as const, is_active: true },
  { id: 5, email: 'staff1@restaurant.com', full_name: 'Hoàng Văn Em', role: 'staff' as const, is_active: true },
];

const navLinks = [
  { to: '/dashboard', label: 'Bảng điều khiển', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/items', label: 'Hàng hóa', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/inventory', label: 'Tồn kho', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/transactions', label: 'Giao dịch', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/exports', label: '📦 Phiếu xuất kho', roles: ['owner', 'manager', 'supervisor'] },
  { to: '/returns', label: '↩️ Hoàn kho', roles: ['owner', 'manager', 'supervisor'] },
  { to: '/approval', label: '✅ Phê duyệt', roles: ['owner', 'manager'] },
  { to: '/reconciliation', label: '📊 Đối chiếu', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/variance', label: 'Báo cáo chênh lệch', roles: ['owner', 'manager', 'supervisor'] },
  { to: '/reports', label: 'Phân tích & Báo cáo', roles: ['owner', 'manager', 'supervisor'] },
  { to: '/documents', label: 'Phiếu & Báo cáo', roles: ['owner', 'manager'] },
  { to: '/ocr', label: 'Xử lý hóa đơn OCR', roles: ['owner', 'manager', 'supervisor'] },
  { to: '/camera', label: 'Camera', roles: ['owner', 'manager', 'supervisor', 'staff'] },
  { to: '/users', label: 'Quản lý người dùng', roles: ['owner'] },
];

const Layout: React.FC<LayoutProps> = ({ header, footer, children, className = '' }) => {
  const { user, logout, setUser } = useAuthStore();
  const location = useLocation();

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      <header className="shadow bg-white py-4 px-6 flex items-center justify-between">
        <div className="flex-1">{header}</div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium text-gray-700">{user.full_name} ({user.role})</span>
              <Button variant="secondary" onClick={logout}>Đăng xuất</Button>
            </>
          ) : (
            <div className="flex gap-2">
              {sampleUsers.map(u => (
                <Button key={u.email} variant="primary" onClick={() => setUser(u)}>{u.role}</Button>
              ))}
            </div>
          )}
        </div>
      </header>
      <nav className="bg-white shadow-sm py-2 px-6">
        {user && (
          <div className="flex gap-2 flex-wrap">
            {navLinks.filter(l => l.roles.includes(user.role)).map(link => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname.startsWith(link.to) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      {footer && <footer className="bg-white py-4 px-6 shadow-inner">{footer}</footer>}
    </div>
  );
};

export default Layout; 