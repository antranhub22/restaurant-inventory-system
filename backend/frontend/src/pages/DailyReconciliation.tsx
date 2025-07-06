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

function calcWithdrawn(r: any) {
  // RÚT HÀNG = BÁN + TRẢ HÀNG + LÃNG PHÍ + NHÂN VIÊN TIÊU THỤ + MẪU
  return (
    (r.sold || 0) + (r.returned || 0) + (r.wasted || 0) + (r.staff_consumed || 0) + (r.sampled || 0)
  );
}

function getAlertLevel(r: any) {
  const withdrawn = calcWithdrawn(r);
  const diff = Math.abs((r.withdrawn || 0) - withdrawn);
  if (diff === 0) return { level: 'ok', label: 'Chuẩn', color: 'green' };
  if (diff <= 1) return { level: 'warning', label: 'Cảnh báo', color: 'yellow' };
  return { level: 'critical', label: 'Sai lệch lớn', color: 'red' };
}

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
                <th className="px-2 py-1">Rút hàng</th>
                <th className="px-2 py-1">Tính toán</th>
                <th className="px-2 py-1">Chênh lệch</th>
                <th className="px-2 py-1">Cảnh báo</th>
                <th className="px-2 py-1">Trạng thái</th>
                <th className="px-2 py-1">Phê duyệt</th>
                <th className="px-2 py-1">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.length === 0 && (
                <tr><td colSpan={11} className="text-center text-gray-400 py-4">Không có dữ liệu</td></tr>
              )}
              {reconciliations.map((r: any) => {
                const item = items.find((i: any) => i.id === r.item_id);
                const status = statusMap[r.status] || { label: r.status, color: 'gray' };
                const withdrawnCalc = calcWithdrawn(r);
                const diff = (r.withdrawn || 0) - withdrawnCalc;
                const alert = getAlertLevel(r);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-1">{r.shift_date}</td>
                    <td className="px-2 py-1">{r.shift_type}</td>
                    <td className="px-2 py-1">{r.department}</td>
                    <td className="px-2 py-1">{item?.name || 'Không rõ'}</td>
                    <td className="px-2 py-1">{r.withdrawn}</td>
                    <td className="px-2 py-1">{withdrawnCalc}</td>
                    <td className={`px-2 py-1 font-semibold ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>{diff}</td>
                    <td className="px-2 py-1"><span className={`px-2 py-0.5 rounded text-xs bg-${alert.color}-100 text-${alert.color}-700`}>{alert.label}</span></td>
                    <td className="px-2 py-1"><span className={`px-2 py-0.5 rounded text-xs bg-${status.color}-100 text-${status.color}-700`}>{status.label}</span></td>
                    <td className="px-2 py-1">{r.status === 'pending' ? 'Chờ duyệt' : r.status === 'investigation' ? 'Cần điều tra' : 'Đã duyệt'}</td>
                    <td className="px-2 py-1">{user && ['owner','manager'].includes(user.role) && <Button onClick={() => setSelected(r.id)}>Chi tiết</Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {/* TODO: Modal chi tiết đối chiếu, quy trình phê duyệt, upload bằng chứng, giải trình... */}
    </Layout>
  );
};

export default DailyReconciliation; 