import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/ItemList';
import ItemDetail from './pages/ItemDetail';
import InventoryCurrent from './pages/InventoryCurrent';
import TransactionHistory from './pages/TransactionHistory';
import DailyReconciliation from './pages/DailyReconciliation';
import DocumentManagement from './pages/DocumentManagement';
import CameraCapture from './pages/CameraCapture';
import OcrReceiptFlow from './pages/OcrReceiptFlow';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items" element={<ItemList />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/inventory" element={<InventoryCurrent />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/reconciliation" element={<DailyReconciliation />} />
          <Route path="/documents" element={<DocumentManagement />} />
          <Route path="/camera" element={<CameraCapture />} />
          <Route path="/ocr" element={<OcrReceiptFlow />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
