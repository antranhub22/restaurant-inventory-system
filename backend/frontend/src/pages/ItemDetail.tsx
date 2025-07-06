import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
// @ts-ignore
import sampleData from '../../../docs/du_lieu/sample_data.json';
import { useAuthStore } from '../store';

const units = sampleData.units;
const itemsData = sampleData.sample_items;
const transactions = sampleData.sample_transactions;
const categories = sampleData.categories;

function getUnitName(unit_id: number) {
  const unit = units.find((u: any) => u.id === unit_id);
  return unit ? unit.abbreviation : '';
}

const defaultEditItem = (item: any) => ({
  name: item.name,
  category_id: item.category_id,
  unit_id: item.unit_id,
  unit_cost: item.unit_cost,
  selling_price: item.selling_price || '',
  min_stock: item.min_stock,
  max_stock: item.max_stock,
  reorder_point: item.reorder_point,
  description: item.description || '',
});

const ItemDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>(itemsData);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const { user } = useAuthStore();

  const item = items.find((i: any) => String(i.id) === id);
  if (!item) {
    return (
      <Layout header={<div>Chi tiết hàng hóa</div>}>
        <div className="text-center text-red-500 py-8">Không tìm thấy hàng hóa.</div>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </Layout>
    );
  }
  const itemTransactions = transactions.filter((t: any) => t.item_id === item.id);

  const handleOpenEdit = () => {
    setEditItem(defaultEditItem(item));
    setError('');
    setShowEdit(true);
  };
  const handleCloseEdit = () => {
    setShowEdit(false);
    setError('');
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem.name || !editItem.category_id || !editItem.unit_id || !editItem.unit_cost) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    setItems(items.map((it: any) => it.id === item.id ? {
      ...it,
      ...editItem,
      category_id: Number(editItem.category_id),
      unit_id: Number(editItem.unit_id),
      unit_cost: Number(editItem.unit_cost),
      selling_price: editItem.selling_price ? Number(editItem.selling_price) : null,
      min_stock: editItem.min_stock ? Number(editItem.min_stock) : 0,
      max_stock: editItem.max_stock ? Number(editItem.max_stock) : 0,
      reorder_point: editItem.reorder_point ? Number(editItem.reorder_point) : 0,
    } : it));
    setShowEdit(false);
    setSuccess('Cập nhật hàng hóa thành công!');
    setTimeout(() => setSuccess(''), 2000);
  };
  const handleDelete = () => {
    setItems(items.filter((it: any) => it.id !== item.id));
    setShowDelete(false);
    setSuccess('Đã xóa hàng hóa khỏi danh sách!');
    setTimeout(() => {
      setSuccess('');
      navigate('/items');
    }, 1200);
  };

  return (
    <Layout header={<div className="text-2xl font-bold flex items-center justify-between">Chi tiết: {item.name}
      {user && ['owner','manager','supervisor'].includes(user.role) && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleOpenEdit}>Sửa</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Xóa</Button>
        </div>
      )}
    </div>}>
      {success && <div className="mb-2 text-green-600 font-semibold">{success}</div>}
      <Card>
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Đơn vị: {getUnitName(item.unit_id)}</span>
          {item.is_perishable && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Dễ hỏng</span>}
          {!item.is_active && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">Ngừng KD</span>}
        </div>
        <div className="mb-1">Mã SKU: <span className="font-semibold">{item.sku}</span></div>
        <div className="mb-1">Barcode: <span className="font-semibold">{item.barcode}</span></div>
        <div className="mb-1">Giá nhập: <span className="font-semibold">{item.unit_cost.toLocaleString('vi-VN')} VND</span></div>
        {item.selling_price && <div className="mb-1">Giá bán: <span className="font-semibold">{item.selling_price.toLocaleString('vi-VN')} VND</span></div>}
        <div className="mb-1">Tồn kho tối thiểu: <span className="font-semibold">{item.min_stock}</span></div>
        <div className="mb-1">Tồn kho tối đa: <span className="font-semibold">{item.max_stock}</span></div>
        <div className="mb-1">Điểm đặt hàng lại: <span className="font-semibold">{item.reorder_point}</span></div>
        <div className="mb-1">Mô tả: <span className="text-gray-700">{item.description}</span></div>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.aliases.map((alias: string) => (
            <span key={alias} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{alias}</span>
          ))}
        </div>
      </Card>
      <Card header="Lịch sử giao dịch">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1">Số phiếu</th>
                <th className="px-2 py-1">Loại</th>
                <th className="px-2 py-1">Số lượng</th>
                <th className="px-2 py-1">Giá trị</th>
                <th className="px-2 py-1">Bộ phận</th>
                <th className="px-2 py-1">Ngày</th>
                <th className="px-2 py-1">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {itemTransactions.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-4">Chưa có giao dịch</td></tr>
              )}
              {itemTransactions.map((t: any) => (
                <tr key={t.id} className="border-b">
                  <td className="px-2 py-1">{t.transaction_number}</td>
                  <td className="px-2 py-1">{t.type}</td>
                  <td className="px-2 py-1">{t.quantity} {getUnitName(item.unit_id)}</td>
                  <td className="px-2 py-1">{t.total_value.toLocaleString('vi-VN')} VND</td>
                  <td className="px-2 py-1">{t.department}</td>
                  <td className="px-2 py-1">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                  <td className="px-2 py-1">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-4">
        <Button onClick={() => navigate(-1)}>Quay lại danh sách</Button>
      </div>
      {/* Modal Sửa */}
      <Modal open={showEdit} onClose={handleCloseEdit} title="Chỉnh sửa hàng hóa">
        {editItem && (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <Input label="Tên hàng hóa*" name="name" value={editItem.name} onChange={handleEditChange} fullWidth required />
            <div>
              <label className="block mb-1 font-medium text-gray-700">Loại hàng*</label>
              <select name="category_id" value={editItem.category_id} onChange={handleEditChange} required className="w-full rounded border border-gray-300 px-3 py-2">
                <option value="">Chọn loại hàng</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Đơn vị tính*</label>
              <select name="unit_id" value={editItem.unit_id} onChange={handleEditChange} required className="w-full rounded border border-gray-300 px-3 py-2">
                <option value="">Chọn đơn vị</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.abbreviation}</option>
                ))}
              </select>
            </div>
            <Input label="Giá nhập*" name="unit_cost" type="number" value={editItem.unit_cost} onChange={handleEditChange} fullWidth required />
            <Input label="Giá bán" name="selling_price" type="number" value={editItem.selling_price} onChange={handleEditChange} fullWidth />
            <Input label="Tồn kho tối thiểu" name="min_stock" type="number" value={editItem.min_stock} onChange={handleEditChange} fullWidth />
            <Input label="Tồn kho tối đa" name="max_stock" type="number" value={editItem.max_stock} onChange={handleEditChange} fullWidth />
            <Input label="Điểm đặt hàng lại" name="reorder_point" type="number" value={editItem.reorder_point} onChange={handleEditChange} fullWidth />
            <div>
              <label className="block mb-1 font-medium text-gray-700">Mô tả</label>
              <textarea name="description" value={editItem.description} onChange={handleEditChange} className="w-full rounded border border-gray-300 px-3 py-2" rows={2} />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleCloseEdit}>Hủy</Button>
              <Button type="submit" variant="primary">Lưu</Button>
            </div>
          </form>
        )}
      </Modal>
      {/* Modal Xóa */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Xác nhận xóa hàng hóa">
        <div className="mb-4">Bạn có chắc chắn muốn xóa <span className="font-semibold">{item.name}</span> khỏi danh sách không?</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default ItemDetail; 