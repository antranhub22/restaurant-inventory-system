import React from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface DashboardStats {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  critical_alerts: number;
}

interface Activity {
  id: number;
  description: string;
  timestamp: string;
}

interface Alert {
  id: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  created_at: string;
}

interface Department {
  department: string;
  efficiency: number;
  issues: number;
  last_reconciliation: string;
}

// Mock data
const sampleData = {
  mockup_data: {
    dashboard_stats: {
      total_items: 150,
      total_value: 125000000,
      low_stock_items: 5,
      critical_alerts: 2
    },
    alert_samples: [
      {
        id: 1,
        message: "Gạo dưới mức tồn kho tối thiểu",
        severity: "warning" as const,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        message: "Thịt bò sắp hết hạn sử dụng",
        severity: "critical" as const,
        created_at: new Date().toISOString()
      }
    ],
    recent_activities: [
      {
        id: 1,
        description: "Nhập kho 50kg gạo",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        description: "Xuất kho 10kg thịt bò",
        timestamp: new Date().toISOString()
      }
    ],
    department_performance: [
      {
        department: "Nhà bếp",
        efficiency: 95,
        issues: 1,
        last_reconciliation: new Date().toISOString()
      },
      {
        department: "Kho lạnh",
        efficiency: 98,
        issues: 0,
        last_reconciliation: new Date().toISOString()
      }
    ]
  }
};

const stats: DashboardStats = sampleData.mockup_data.dashboard_stats;
const alerts: Alert[] = sampleData.mockup_data.alert_samples;
const activities: Activity[] = sampleData.mockup_data.recent_activities;
const departments: Department[] = sampleData.mockup_data.department_performance;

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
            {activities.map((act) => (
              <li key={act.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between">
                <span>{act.description}</span>
                <span className="text-sm text-gray-500">{new Date(act.timestamp).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card header="Cảnh báo & Thông báo">
          <ul className="divide-y divide-gray-200">
            {alerts.map((alert) => (
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
              {departments.map((d) => (
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