import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import sampleData from '../../../docs/du_lieu/sample_data.json';
import { useAuthStore } from '../store';

const units = sampleData.units;
const categories = sampleData.categories;
const inventoryCurrent = sampleData.sample_inventory_current;

function getUnitName(unit_id: number) {
  const unit = units.find((u: any) => u.id === unit_id);
  return unit ? unit.abbreviation : '';
}

function getStockStatus(item_id: number) {
  const inv = inventoryCurrent.find((i: any) => i.item_id === item_id);
  if (!inv) return { status: 'unknown', label: 'Không rõ', color: 'gray' };
  switch (inv.stock_status) {
    case 'low_stock': return { status: 'low', label: 'Tồn kho thấp', color: 'red' };
    case 'in_stock': return { status: 'ok', label: 'Đủ hàng', color: 'green' };
    default: return { status: 'unknown', label: 'Không rõ', color: 'gray' };
  }
}

const defaultNewItem = {
  name: '',
  category_id: '',
  unit_id: '',
  unit_cost: '',
  selling_price: '',
  min_stock: '',
  max_stock: '',
  reorder_point: '',
  description: '',
};

const ItemList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<any[]>(sampleData.sample_items);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<any>(defaultNewItem);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const filteredItems = items.filter((item: any) => {
    const matchName = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category ? item.category_id === Number(category) : true;
    return matchName && matchCategory;
  });

  const handleOpenModal = () => {
    setNewItem(defaultNewItem);
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    if (!newItem.name || !newItem.category_id || !newItem.unit_id || !newItem.unit_cost) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    // Thêm item mới
    const item = {
      ...newItem,
      id: Date.now(),
      category_id: Number(newItem.category_id),
      unit_id: Number(newItem.unit_id),
      unit_cost: Number(newItem.unit_cost),
      selling_price: newItem.selling_price ? Number(newItem.selling_price) : null,
      min_stock: newItem.min_stock ? Number(newItem.min_stock) : 0,
      max_stock: newItem.max_stock ? Number(newItem.max_stock) : 0,
      reorder_point: newItem.reorder_point ? Number(newItem.reorder_point) : 0,
      is_perishable: false,
      is_active: true,
      sku: '',
      barcode: '',
      aliases: [],
    };
    setItems([item, ...items]);
    setShowModal(false);
    setSuccess('Thêm hàng hóa thành công!');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Phân trang
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout header={<div className="flex items-center justify-between"><span className="text-2xl font-bold">Danh sách hàng hóa</span>{user && ['owner','manager','supervisor'].includes(user.role) && (<Button variant="primary" onClick={handleOpenModal}>+ Thêm hàng hóa</Button>)}</div>}>
      {success && <div className="mb-2 text-green-600 font-semibold">{success}</div>}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Tìm kiếm theo tên hàng hóa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
        />
        <select
          className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all w-full"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Tất cả loại hàng</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagedItems.map((item: any) => {
          const stock = getStockStatus(item.id);
          return (
            <Card key={item.id} header={item.name} className="relative cursor-pointer hover:shadow-lg" onClick={() => navigate(`/items/${item.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{getUnitName(item.unit_id)}</span>
                {item.is_perishable && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Dễ hỏng</span>}
              </div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-${stock.color}-100 text-${stock.color}-700`}>{stock.label}</span>
                {!item.is_active && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">Ngừng KD</span>}
              </div>
              <div className="mb-1">Tồn kho tối thiểu: <span className="font-semibold">{item.min_stock}</span></div>
              <div className="mb-1">Tồn kho tối đa: <span className="font-semibold">{item.max_stock}</span></div>
              <div className="mb-1">Điểm đặt hàng lại: <span className="font-semibold">{item.reorder_point}</span></div>
              <div className="mb-1">Giá nhập: <span className="font-semibold">{item.unit_cost.toLocaleString('vi-VN')} VND</span></div>
              {item.selling_price && <div className="mb-1">Giá bán: <span className="font-semibold">{item.selling_price.toLocaleString('vi-VN')} VND</span></div>}
              <div className="mb-1 text-xs text-gray-400">SKU: {item.sku}</div>
              <div className="mb-1 text-xs text-gray-400">Barcode: {item.barcode}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {item.aliases.map((alias: string) => (
                  <span key={alias} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{alias}</span>
                ))}
              </div>
            </Card>
          );
        })}
        {pagedItems.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">Không tìm thấy hàng hóa phù hợp.</div>
        )}
      </div>
      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
          <span>Trang {page} / {totalPages}</span>
          <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}
      <Modal open={showModal} onClose={handleCloseModal} title="Thêm hàng hóa mới">
        <form onSubmit={handleAddItem} className="space-y-3">
          <Input label="Tên hàng hóa*" name="name" value={newItem.name} onChange={handleChange} fullWidth required />
          <div>
            <label className="block mb-1 font-medium text-gray-700">Loại hàng*</label>
            <select name="category_id" value={newItem.category_id} onChange={handleChange} required className="w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Chọn loại hàng</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Đơn vị tính*</label>
            <select name="unit_id" value={newItem.unit_id} onChange={handleChange} required className="w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Chọn đơn vị</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>{u.abbreviation}</option>
              ))}
            </select>
          </div>
          <Input label="Giá nhập*" name="unit_cost" type="number" value={newItem.unit_cost} onChange={handleChange} fullWidth required />
          <Input label="Giá bán" name="selling_price" type="number" value={newItem.selling_price} onChange={handleChange} fullWidth />
          <Input label="Tồn kho tối thiểu" name="min_stock" type="number" value={newItem.min_stock} onChange={handleChange} fullWidth />
          <Input label="Tồn kho tối đa" name="max_stock" type="number" value={newItem.max_stock} onChange={handleChange} fullWidth />
          <Input label="Điểm đặt hàng lại" name="reorder_point" type="number" value={newItem.reorder_point} onChange={handleChange} fullWidth />
          <div>
            <label className="block mb-1 font-medium text-gray-700">Mô tả</label>
            <textarea name="description" value={newItem.description} onChange={handleChange} className="w-full rounded border border-gray-300 px-3 py-2" rows={2} />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ItemList; 