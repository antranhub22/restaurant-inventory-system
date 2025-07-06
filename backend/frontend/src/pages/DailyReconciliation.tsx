import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../store';
// @ts-ignore
import sampleData from '../../../docs/du_lieu/sample_data.json';

const reconciliations = sampleData.sample_reconciliation;
const items = sampleData.sample_items;

const statusMap: Record<string, { label: string; color: string }> = {
  resolved: { label: 'Đã giải quyết', color: 'green' },
  investigation: { label: 'Đang điều tra', color: 'yellow' },
  pending: { label: 'Chờ xử lý', color: 'orange' },
};

const DailyReconciliation: React.FC = () => {
  const [selected, setSelected] = useState<number|null>(null);
  const { user } = useAuthStore();

  return (
    <Layout header={<div className="text-2xl font-bold">Đối chiếu cuối ngày</div>}>
      <Card header="Báo cáo đối chiếu">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1">Ngày</th>
                <th className="px-2 py-1">Ca</th>
                <th className="px-2 py-1">Bộ phận</th>
                <th className="px-2 py-1">Hàng hóa</th>
                <th className="px-2 py-1">Tồn đầu ca</th>
                <th className="px-2 py-1">Xuất</th>
                <th className="px-2 py-1">Bán</th>
                <th className="px-2 py-1">Hoàn trả</th>
                <th className="px-2 py-1">Hao hụt</th>
                <th className="px-2 py-1">Tồn thực tế</th>
                <th className="px-2 py-1">Chênh lệch</th>
                <th className="px-2 py-1">Trạng thái</th>
                <th className="px-2 py-1">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.length === 0 && (
                <tr><td colSpan={13} className="text-center text-gray-400 py-4">Không có dữ liệu</td></tr>
              )}
              {reconciliations.map((r: any) => {
                const item = items.find((i: any) => i.id === r.item_id);
                const status = statusMap[r.status] || { label: r.status, color: 'gray' };
                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-1">{r.shift_date}</td>
                    <td className="px-2 py-1">{r.shift_type}</td>
                    <td className="px-2 py-1">{r.department}</td>
                    <td className="px-2 py-1">{item?.name || 'Không rõ'}</td>
                    <td className="px-2 py-1">{r.opening_stock}</td>
                    <td className="px-2 py-1">{r.withdrawn}</td>
                    <td className="px-2 py-1">{r.sold}</td>
                    <td className="px-2 py-1">{r.returned}</td>
                    <td className="px-2 py-1">{r.wasted}</td>
                    <td className="px-2 py-1">{r.actual_remaining}</td>
                    <td className={`px-2 py-1 font-semibold ${r.discrepancy_value > 0 ? 'text-red-600' : 'text-green-600'}`}>{r.discrepancy_value.toLocaleString('vi-VN')}</td>
                    <td className={`px-2 py-1`}><span className={`px-2 py-0.5 rounded text-xs bg-${status.color}-100 text-${status.color}-700`}>{status.label}</span></td>
                    <td className="px-2 py-1">{user && ['owner','manager'].includes(user.role) && <Button onClick={() => setSelected(r.id)}>Chi tiết</Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {/* TODO: Modal chi tiết đối chiếu, xác nhận/quyết toán */}
    </Layout>
  );
};

export default DailyReconciliation; 