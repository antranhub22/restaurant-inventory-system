import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import sampleData from '../data/sample_data.json';
import { SampleData, Item, Transaction, Unit } from '../types/sample_data';

const data = sampleData as SampleData;
const transactions = data.sample_transactions;
const items = data.sample_items;
const units = data.units;

function getUnitName(unit_id: number): string {
  const unit = units.find(u => u.id === unit_id);
  return unit ? unit.abbreviation : '';
}

const TransactionHistory: React.FC = () => {
  const [itemId, setItemId] = useState('');
  const filtered = itemId ? transactions.filter(t => String(t.item_id) === itemId) : transactions;

  return (
    <Layout header={<div className="text-2xl font-bold">Lịch sử giao dịch</div>}>
      <div className="mb-4 max-w-xs">
        <label className="block mb-1 font-medium text-gray-700">Lọc theo hàng hóa</label>
        <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2">
          <option value="">Tất cả hàng hóa</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <Card header="Danh sách giao dịch">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1">Số phiếu</th>
                <th className="px-2 py-1">Hàng hóa</th>
                <th className="px-2 py-1">Loại</th>
                <th className="px-2 py-1">Số lượng</th>
                <th className="px-2 py-1">Giá trị</th>
                <th className="px-2 py-1">Bộ phận</th>
                <th className="px-2 py-1">Ngày</th>
                <th className="px-2 py-1">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-4">Không có giao dịch</td></tr>
              )}
              {filtered.map(t => {
                const item = items.find(i => i.id === t.item_id);
                return (
                  <tr key={t.id} className="border-b">
                    <td className="px-2 py-1">{t.transaction_number}</td>
                    <td className="px-2 py-1">{item?.name || 'Không rõ'}</td>
                    <td className="px-2 py-1">{t.type}</td>
                    <td className="px-2 py-1">{t.quantity} {item ? getUnitName(item.unit_id) : ''}</td>
                    <td className="px-2 py-1">{t.total_value.toLocaleString('vi-VN')} VND</td>
                    <td className="px-2 py-1">{t.department}</td>
                    <td className="px-2 py-1">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    <td className="px-2 py-1">{t.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
};

export default TransactionHistory; 