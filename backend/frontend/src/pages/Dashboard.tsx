import React from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
// Import dữ liệu mẫu (giả lập import, thực tế sẽ fetch hoặc require)
// @ts-ignore
import sampleData from '../../../docs/du_lieu/sample_data.json';

const stats = sampleData.mockup_data.dashboard_stats;
const alerts = sampleData.mockup_data.alert_samples;
const activities = sampleData.mockup_data.recent_activities;
const departments = sampleData.mockup_data.department_performance;

const Dashboard: React.FC = () => {
  return (
    <Layout header={<div className="text-2xl font-bold">Bảng điều khiển</div>}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card header="Tổng mặt hàng">
          <div className="text-3xl font-bold text-blue-600">{stats.total_items}</div>
        </Card>
        <Card header="Tổng giá trị kho">
          <div className="text-2xl font-bold text-green-600">{stats.total_value.toLocaleString('vi-VN')} VND</div>
        </Card>
        <Card header="Cảnh báo tồn kho thấp">
          <div className="text-3xl font-bold text-red-500">{stats.low_stock_items}</div>
        </Card>
        <Card header="Cảnh báo nghiêm trọng">
          <div className="text-3xl font-bold text-red-700">{stats.critical_alerts}</div>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card header="Hoạt động gần đây">
          <ul className="divide-y divide-gray-200">
            {activities.map((act: any) => (
              <li key={act.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between">
                <span>{act.description}</span>
                <span className="text-sm text-gray-500">{new Date(act.timestamp).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card header="Cảnh báo & Thông báo">
          <ul className="divide-y divide-gray-200">
            {alerts.map((alert: any) => (
              <li key={alert.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between">
                <span className={`font-semibold ${alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>{alert.message}</span>
                <span className="text-sm text-gray-500">{new Date(alert.created_at).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card header="Hiệu suất các bộ phận">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Bộ phận</th>
                <th className="px-2 py-1 text-left">Hiệu suất</th>
                <th className="px-2 py-1 text-left">Vấn đề</th>
                <th className="px-2 py-1 text-left">Đối chiếu gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d: any) => (
                <tr key={d.department} className="border-b">
                  <td className="px-2 py-1 font-medium">{d.department}</td>
                  <td className="px-2 py-1">{d.efficiency}%</td>
                  <td className="px-2 py-1">{d.issues}</td>
                  <td className="px-2 py-1">{new Date(d.last_reconciliation).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
};

export default Dashboard; 