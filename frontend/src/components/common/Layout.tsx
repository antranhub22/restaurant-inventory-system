import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import Button from './Button';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  roles: string[];
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
  roles: string[];
}

const sampleUsers = [
  { id: 1, email: 'owner@restaurant.com', full_name: 'Nguyễn Văn An', role: 'owner' as const, is_active: true },
  { id: 2, email: 'manager@restaurant.com', full_name: 'Trần Thị Bình', role: 'manager' as const, is_active: true },
  { id: 3, email: 'kitchen@restaurant.com', full_name: 'Lê Văn Cường', role: 'supervisor' as const, is_active: true },
  { id: 5, email: 'staff1@restaurant.com', full_name: 'Hoàng Văn Em', role: 'staff' as const, is_active: true },
];

// Top level navigation items (không thuộc nhóm nào)
const primaryNavItems = [
  { to: '/dashboard', label: '🏠 Bảng điều khiển', roles: ['owner', 'manager', 'supervisor', 'staff'] },
];

// Grouped navigation
const navGroups: NavGroup[] = [
  {
    id: 'reports',
    label: '📊 Báo cáo',
    icon: '📊',
    roles: ['owner', 'manager', 'supervisor', 'staff'],
    items: [
      { to: '/inventory', label: 'Tồn kho hiện tại', roles: ['owner', 'manager', 'supervisor', 'staff'] },
      { to: '/reports', label: 'Phân tích & Báo cáo', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/variance', label: 'Báo cáo chênh lệch', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/reconciliation', label: 'Đối chiếu hàng ngày', roles: ['owner', 'manager', 'supervisor', 'staff'] },
      { to: '/documents', label: 'Phiếu & Báo cáo', roles: ['owner', 'manager'] },
      { to: '/transactions', label: 'Lịch sử giao dịch', roles: ['owner', 'manager', 'supervisor', 'staff'] },
    ]
  },
  {
    id: 'manual-entry',
    label: '✏️ Nhập Dữ liệu',
    icon: '✏️',
    roles: ['owner', 'manager', 'supervisor', 'staff'],
    items: [
      { to: '/items', label: 'Quản lý hàng hóa', roles: ['owner', 'manager', 'supervisor', 'staff'] },
      { to: '/manual/import', label: 'Phiếu nhập kho', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/manual/export', label: 'Phiếu xuất kho', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/manual/return', label: 'Phiếu hoàn kho', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/manual/waste', label: 'Phiếu hao phí', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/manual/inventory-check', label: 'Phiếu kiểm kho', roles: ['owner', 'manager', 'supervisor'] },
    ]
  },
  {
    id: 'ocr',
    label: '📸 Xử lý OCR',
    icon: '📸',
    roles: ['owner', 'manager', 'supervisor'],
    items: [
      { to: '/ocr', label: 'Xử lý hóa đơn OCR', roles: ['owner', 'manager', 'supervisor'] },
      { to: '/camera', label: 'Chụp hóa đơn', roles: ['owner', 'manager', 'supervisor', 'staff'] },
    ]
  },
  {
    id: 'approval',
    label: '✅ Phê Duyệt',
    icon: '✅',
    roles: ['owner', 'manager'],
    items: [
      { to: '/approval', label: 'Phê duyệt phiếu', roles: ['owner', 'manager'] },
    ]
  },
];

// Admin navigation (separate)
const adminNavItems = [
  { to: '/users', label: '👥 Quản lý người dùng', roles: ['owner'] },
];

const DropdownMenu: React.FC<{
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  userRole: string;
  currentPath: string;
}> = ({ group, isOpen, onToggle, userRole, currentPath }) => {
  const visibleItems = group.items.filter(item => item.roles.includes(userRole));
  
  if (visibleItems.length === 0) return null;

  const isActive = visibleItems.some(item => currentPath.startsWith(item.to));

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
        }`}
      >
        {group.label}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48">
          {visibleItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2 text-sm transition-colors ${
                currentPath.startsWith(item.to)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={onToggle}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ header, footer, children, className = '' }) => {
  const { user, logout, setUser } = useAuthStore();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (groupId: string) => {
    setOpenDropdown(openDropdown === groupId ? null : groupId);
  };

  const closeAllDropdowns = () => {
    setOpenDropdown(null);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => closeAllDropdowns();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      
      <nav className="bg-white shadow-sm py-2 px-6" onClick={(e) => e.stopPropagation()}>
        {user && (
          <div className="flex gap-2 flex-wrap items-center">
            {/* Primary navigation items */}
            {primaryNavItems.filter(item => item.roles.includes(user.role)).map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname.startsWith(item.to)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Grouped navigation with dropdowns */}
            {navGroups
              .filter(group => group.roles.some(role => user.role === role))
              .map(group => (
                <DropdownMenu
                  key={group.id}
                  group={group}
                  isOpen={openDropdown === group.id}
                  onToggle={() => toggleDropdown(group.id)}
                  userRole={user.role}
                  currentPath={location.pathname}
                />
              ))}

            {/* Admin navigation */}
            {adminNavItems.filter(item => item.roles.includes(user.role)).map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname.startsWith(item.to)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
                }`}
              >
                {item.label}
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