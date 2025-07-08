import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>🍽️ Restaurant Inventory</h2>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link to="/inventory" className={isActive('/inventory') ? 'active' : ''}>
              📦 Inventory
            </Link>
          </li>
          <li>
            <Link to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
              📝 Transactions
            </Link>
          </li>
          <li>
            <Link to="/reports" className={isActive('/reports') ? 'active' : ''}>
              📈 Reports
            </Link>
          </li>
          <li>
            <Link to="/ocr-demo" className={isActive('/ocr-demo') ? 'active' : ''}>
              🧾 Xử lý hóa đơn OCR
            </Link>
          </li>
          <li className="nav-divider">Admin</li>
          <li>
            <Link to="/admin/form-templates" className={isActive('/admin/form-templates') ? 'active' : ''}>
              📋 Form Templates
            </Link>
          </li>
          <li>
            <Link to="/admin/settings" className={isActive('/admin/settings') ? 'active' : ''}>
              ⚙️ Settings
            </Link>
          </li>
        </ul>
        
        {/* Logout button */}
        {onLogout && (
          <div className="sidebar-footer">
            <button
              onClick={onLogout}
              className="logout-button"
            >
              🚪 Đăng xuất
            </button>
          </div>
        )}
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout; 