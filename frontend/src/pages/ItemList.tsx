import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import itemsService, { Item, Category, CreateItemRequest } from '../services/items.service';

function getStockStatus(item: Item) {
  const currentStock = item.inventory?.currentStock || 0;
  if (item.minStock > 0 && currentStock <= item.minStock) {
    return { status: 'low', label: 'Tồn kho thấp', color: 'red' };
  }
  return { status: 'ok', label: 'Đủ hàng', color: 'green' };
}

interface NewItem {
  name: string;
  categoryId: string;
  unit: string;
  unitCost: string;
  minStock: string;
  maxStock: string;
  description: string;
}

const defaultNewItem: NewItem = {
  name: '',
  categoryId: '',
  unit: '',
  unitCost: '',
  minStock: '',
  maxStock: '',
  description: '',
};

const ItemList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>(defaultNewItem);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch items using React Query
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: itemsService.getAllItems
  });

  // Fetch categories using React Query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: itemsService.getCategories
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: itemsService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowModal(false);
      setNewItem(defaultNewItem);
      setSuccess('Thêm hàng hóa thành công! Dữ liệu đã được lưu vào database.');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Có lỗi xảy ra khi tạo hàng hóa');
    }
  });

  const filteredItems = items.filter(item => {
    const matchName = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category ? item.categoryId === Number(category) : true;
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
    setError('');

    // Validate
    if (!newItem.name || !newItem.categoryId || !newItem.unit) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc: tên, loại hàng, đơn vị.');
      return;
    }

    // Create item request
    const itemData: CreateItemRequest = {
      name: newItem.name,
      categoryId: Number(newItem.categoryId),
      unit: newItem.unit,
      unitCost: newItem.unitCost ? Number(newItem.unitCost) : undefined,
      minStock: Number(newItem.minStock) || 0,
      maxStock: newItem.maxStock ? Number(newItem.maxStock) : undefined,
      description: newItem.description || undefined,
      aliases: []
    };

    createItemMutation.mutate(itemData);
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
          {categories.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemsLoading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Đang tải dữ liệu...</div>
        ) : pagedItems.map(item => {
          const stock = getStockStatus(item);
          const currentStock = item.inventory?.currentStock || 0;
          return (
            <Card key={item.id} header={item.name} className="relative cursor-pointer hover:shadow-lg" onClick={() => navigate(`/items/${item.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{item.unit}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{item.category.name}</span>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-${stock.color}-100 text-${stock.color}-700`}>{stock.label}</span>
                {!item.isActive && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">Ngừng KD</span>}
              </div>
              <div className="mb-1">Tồn kho hiện tại: <span className="font-semibold">{currentStock}</span></div>
              <div className="mb-1">Tồn kho tối thiểu: <span className="font-semibold">{item.minStock}</span></div>
              {item.maxStock && <div className="mb-1">Tồn kho tối đa: <span className="font-semibold">{item.maxStock}</span></div>}
              {item.unitCost && <div className="mb-1">Giá nhập: <span className="font-semibold">{item.unitCost.toLocaleString('vi-VN')} VND</span></div>}
              {item.barcode && <div className="mb-1 text-xs text-gray-400">Barcode: {item.barcode}</div>}
              {item.primarySupplier && <div className="mb-1 text-xs text-gray-400">NCC: {item.primarySupplier.name}</div>}
              <div className="mt-2 flex flex-wrap gap-1">
                {item.aliases.map(alias => (
                  <span key={alias} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{alias}</span>
                ))}
              </div>
            </Card>
          );
        })}
        {!itemsLoading && pagedItems.length === 0 && (
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
            <select name="categoryId" value={newItem.categoryId} onChange={handleChange} required className="w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Chọn loại hàng</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Đơn vị tính*</label>
            <Input name="unit" value={newItem.unit} onChange={handleChange} placeholder="VD: kg, lít, hộp, chai..." fullWidth required />
          </div>
          <Input label="Giá nhập" name="unitCost" type="number" value={newItem.unitCost} onChange={handleChange} fullWidth />
          <Input label="Tồn kho tối thiểu" name="minStock" type="number" value={newItem.minStock} onChange={handleChange} fullWidth />
          <Input label="Tồn kho tối đa" name="maxStock" type="number" value={newItem.maxStock} onChange={handleChange} fullWidth />
          <div>
            <label className="block mb-1 font-medium text-gray-700">Mô tả</label>
            <textarea name="description" value={newItem.description} onChange={handleChange} className="w-full rounded border border-gray-300 px-3 py-2" rows={2} />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={createItemMutation.isPending}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ItemList; 