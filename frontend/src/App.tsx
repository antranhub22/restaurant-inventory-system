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
import ImportManagement from './pages/ImportManagement';
import WasteManagement from './pages/WasteManagement';
import InventoryCheck from './pages/InventoryCheck';
import VarianceReport from './pages/VarianceReport';
import ApprovalDashboard from './pages/ApprovalDashboard';
import ReportsOverview from './pages/ReportsOverview';
import ManualEntryOverview from './pages/ManualEntryOverview';
import OCROverview from './pages/OCROverview';
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
          
          {/* Group Overview Routes */}
          <Route path="/reports-overview" element={
            <ProtectedRoute>
              <ReportsOverview />
            </ProtectedRoute>
          } />
          
          <Route path="/manual-overview" element={
            <ProtectedRoute>
              <ManualEntryOverview />
            </ProtectedRoute>
          } />
          
          <Route path="/ocr-overview" element={
            <ProtectedRoute>
              <OCROverview />
            </ProtectedRoute>
          } />
          
          {/* Manual Data Entry Routes */}
          <Route path="/manual/import" element={
            <ProtectedRoute>
              <ImportManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/manual/export" element={
            <ProtectedRoute>
              <ExportManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/manual/return" element={
            <ProtectedRoute>
              <ReturnManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/manual/waste" element={
            <ProtectedRoute>
              <WasteManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/manual/inventory-check" element={
            <ProtectedRoute>
              <InventoryCheck />
            </ProtectedRoute>
          } />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/export" element={<Navigate to="/manual/export" replace />} />
          <Route path="/exports" element={<Navigate to="/manual/export" replace />} />
          <Route path="/return" element={<Navigate to="/manual/return" replace />} />
          <Route path="/returns" element={<Navigate to="/manual/return" replace />} />
          
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
          
          <Route path="/approval" element={
            <ProtectedRoute>
              <ApprovalDashboard />
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
