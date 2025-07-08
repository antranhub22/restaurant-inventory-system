import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Login from './components/Login';
// import Dashboard from './pages/Dashboard';
import FormTemplatesPage from './pages/admin/FormTemplates';
import OCRFormDemo from './pages/OCRFormDemo';
import { apiService } from './services/api.service';
import './styles/Layout.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = apiService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = () => {
      const authenticated = apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/ocr-demo" replace />} />
          <Route path="/ocr-demo" element={
            <ProtectedRoute>
              <OCRFormDemo />
            </ProtectedRoute>
          } />
          <Route path="/admin/form-templates" element={
            <ProtectedRoute>
              <FormTemplatesPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Navigate to="/ocr-demo" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App; 