import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import FormTemplatesPage from './pages/admin/FormTemplates';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin/form-templates" element={<FormTemplatesPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App; 