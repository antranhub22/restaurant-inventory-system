import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/ItemList';
import ItemDetail from './pages/ItemDetail';
import InventoryCurrent from './pages/InventoryCurrent';
import TransactionHistory from './pages/TransactionHistory';
import DailyReconciliation from './pages/DailyReconciliation';
import ReportsDashboard from './pages/ReportsDashboard';
import DocumentManagement from './pages/DocumentManagement';
import CameraCapture from './pages/CameraCapture';
import OCRFormDemo from './pages/OCRFormDemo';
import ExportManagement from './pages/ExportManagement';
import ReturnManagement from './pages/ReturnManagement';
import VarianceReport from './pages/VarianceReport';
import Login from './components/Login';
import { useAuthStore } from './store';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore.getState().token;
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/items" element={
            <ProtectedRoute>
              <ItemList />
            </ProtectedRoute>
          } />
          
          <Route path="/items/:id" element={
            <ProtectedRoute>
              <ItemDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute>
              <InventoryCurrent />
            </ProtectedRoute>
          } />
          
          <Route path="/transactions" element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/export" element={
            <ProtectedRoute>
              <ExportManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/return" element={
            <ProtectedRoute>
              <ReturnManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/reconciliation" element={
            <ProtectedRoute>
              <DailyReconciliation />
            </ProtectedRoute>
          } />
          
          <Route path="/variance" element={
            <ProtectedRoute>
              <VarianceReport />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <DocumentManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/camera" element={
            <ProtectedRoute>
              <CameraCapture />
            </ProtectedRoute>
          } />

          <Route path="/ocr" element={
            <ProtectedRoute>
              <OCRFormDemo />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
