import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useAuthStore } from '../store';

interface Item {
  id: number;
  name: string;
  unit_id: string;
  min_stock: number;
}

interface InventoryItem {
  item_id: number;
  current_stock: number;
  reserved_stock: number;
  average_cost: number;
  stock_status: 'low_stock' | 'in_stock';
  next_expiry_date?: string;
  last_updated: string;
}

// Import sample data from public directory
const sampleData = {
  sample_inventory_current: [
    {
      item_id: 1,
      current_stock: 100,
      reserved_stock: 20,
      average_cost: 15000,
      stock_status: 'in_stock' as const,
      last_updated: new Date().toISOString()
    }
  ],
  sample_items: [
    {
      id: 1,
      name: 'Gạo',
      unit_id: 'kg',
      min_stock: 50
    }
  ]
};

const inventory: InventoryItem[] = sampleData.sample_inventory_current;
const items: Item[] = sampleData.sample_items;

function getItem(item_id: number): Item | undefined {
  return items.find(i => i.id === item_id);
}

function getStockStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'low_stock': return { label: 'Tồn kho thấp', color: 'red' };
    case 'in_stock': return { label: 'Đủ hàng', color: 'green' };
    default: return { label: 'Không rõ', color: 'gray' };
  }
}

const InventoryCurrent: React.FC = () => {
  const [showAction, setShowAction] = useState<{id: number, type: 'import'|'export'|'adjust'}|null>(null);
  const { user } = useAuthStore();

  const handleAction = (itemId: number, type: 'import'|'export'|'adjust') => {
    setShowAction({ id: itemId, type });
  };

  const selectedItem = showAction ? getItem(showAction.id) : null;
  const selectedInventory = showAction ? inventory.find(i => i.item_id === showAction.id) : null;

  return (
    <Layout header={<div className="text-2xl font-bold">Tồn kho thực tế</div>}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((inv) => {
          const item = getItem(inv.item_id);
          const stock = getStockStatus(inv.stock_status);
          return (
            <Card key={inv.item_id} header={item?.name || 'Không rõ'}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-${stock.color}-100 text-${stock.color}-700`}>{stock.label}</span>
                {inv.current_stock <= (item?.min_stock || 0) && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Dưới mức tối thiểu</span>}
              </div>
              <div className="mb-1">Tồn kho hiện tại: <span className="font-semibold">{inv.current_stock} {item?.unit_id}</span></div>
              <div className="mb-1">Tồn kho dự phòng: <span className="font-semibold">{inv.reserved_stock}</span></div>
              <div className="mb-1">Giá trung bình: <span className="font-semibold">{inv.average_cost.toLocaleString('vi-VN')} VND</span></div>
              {inv.next_expiry_date && <div className="mb-1 text-xs text-orange-600">HSD: {new Date(inv.next_expiry_date).toLocaleDateString('vi-VN')}</div>}
              <div className="mb-1 text-xs text-gray-400">Cập nhật: {new Date(inv.last_updated).toLocaleString('vi-VN')}</div>
              {user && ['owner','manager','supervisor'].includes(user.role) && (
                <div className="flex gap-2 mt-2">
                  <Button variant="primary" onClick={() => handleAction(inv.item_id, 'import')}>Nhập kho</Button>
                  <Button variant="secondary" onClick={() => handleAction(inv.item_id, 'export')}>Xuất kho</Button>
                  <Button variant="danger" onClick={() => handleAction(inv.item_id, 'adjust')}>Điều chỉnh</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showAction && selectedItem && selectedInventory && (
        <Modal
          title={`${showAction.type === 'import' ? 'Nhập kho' : showAction.type === 'export' ? 'Xuất kho' : 'Điều chỉnh'} - ${selectedItem.name}`}
          onClose={() => setShowAction(null)}
          open={true}
        >
          <div className="p-4">
            <div className="mb-4">
              <div>Tồn kho hiện tại: {selectedInventory.current_stock} {selectedItem.unit_id}</div>
              <div>Giá trung bình: {selectedInventory.average_cost.toLocaleString('vi-VN')} VND</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAction(null)}>Hủy</Button>
              <Button variant="primary" onClick={() => {
                alert('Chức năng đang phát triển');
                setShowAction(null);
              }}>Xác nhận</Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default InventoryCurrent; 