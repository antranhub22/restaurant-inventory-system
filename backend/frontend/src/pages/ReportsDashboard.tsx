import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../store';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import sampleData from '../../../docs/du_lieu/sample_data.json';

const stats = sampleData.mockup_data.dashboard_stats;
const departments = sampleData.mockup_data.department_performance;
const inventoryTrend = sampleData.mockup_data.inventory_trend;
const lossAnalysis = sampleData.mockup_data.loss_analysis;
const quickReports = [
  { key: 'daily', label: '📊 Báo cáo ngày' },
  { key: 'loss', label: '📈 Phân tích thất thoát' },
  { key: 'inventory', label: '📋 Tổng hợp tồn kho' },
];

const dateRanges = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'week', label: 'Tuần này' },
  { key: 'custom', label: 'Tùy chọn...' },
];

const LOSS_COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFBB28', '#FF6666'];

function getReportData(type: string) {
  if (type === 'daily') {
    return [
      ['Chỉ số', 'Giá trị'],
      ['Tổng mặt hàng', stats.total_items],
      ['Tổng giá trị kho', stats.total_value.toLocaleString('vi-VN') + ' VND'],
      ['Tỷ lệ thất thoát', stats.loss_rate + '%'],
      ['Độ chính xác đối chiếu', stats.accuracy + '%'],
    ];
  }
  if (type === 'loss') {
    return [
      ['Nhóm hàng', 'Giá trị thất thoát (VND)'],
      ...lossAnalysis.map((l: any) => [l.category, l.value.toLocaleString('vi-VN')]),
    ];
  }
  if (type === 'inventory') {
    return [
      ['Bộ phận', 'Hiệu suất (%)', 'Vấn đề', 'Đối chiếu gần nhất'],
      ...departments.map((d: any) => [d.department, d.efficiency, d.issues, new Date(d.last_reconciliation).toLocaleDateString('vi-VN')]),
    ];
  }
  return [];
}

function exportExcel(type: string) {
  const data = getReportData(type);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
  XLSX.writeFile(wb, `bao_cao_${type}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportCSV(type: string) {
  const data = getReportData(type);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', RS: '\r\n' });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `bao_cao_${type}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPDF(type: string) {
  const data = getReportData(type);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFont('Helvetica', 'normal');
  doc.text(`BÁO CÁO: ${quickReports.find(q => q.key === type)?.label || ''}`, 40, 40);
  // @ts-ignore
  doc.autoTable({
    startY: 60,
    head: [data[0]],
    body: data.slice(1),
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [41,128,185] },
    margin: { left: 40, right: 40 },
  });
  doc.save(`bao_cao_${type}_${new Date().toISOString().slice(0,10)}.pdf`);
}

const ReportsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('today');
  const [quickReport, setQuickReport] = useState('daily');

  if (!user || !['owner','manager','supervisor'].includes(user.role)) {
    return <Layout header={<div className='text-2xl font-bold'>Báo cáo & Phân tích</div>}><div className='text-center text-red-500 py-8'>Bạn không có quyền truy cập chức năng này.</div></Layout>;
  }

  return (
    <Layout header={<div className="text-2xl font-bold flex items-center justify-between">Báo cáo & Phân tích
      <div className="flex gap-2">
        {dateRanges.map(dr => (
          <Button key={dr.key} variant={dateRange === dr.key ? 'primary' : 'secondary'} onClick={() => setDateRange(dr.key)}>{dr.label}</Button>
        ))}
      </div>
    </div>}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card header="Tổng mặt hàng">
          <div className="text-3xl font-bold text-blue-600">{stats.total_items}</div>
        </Card>
        <Card header="Tổng giá trị kho">
          <div className="text-2xl font-bold text-green-600">{stats.total_value.toLocaleString('vi-VN')} VND</div>
        </Card>
        <Card header="Tỷ lệ thất thoát">
          <div className="text-3xl font-bold text-red-500">{stats.loss_rate}%</div>
        </Card>
        <Card header="Độ chính xác đối chiếu">
          <div className="text-3xl font-bold text-green-700">{stats.accuracy}%</div>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card header="Xu hướng tồn kho (7 ngày)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => v.toLocaleString('vi-VN')} />
                <Tooltip formatter={v => v.toLocaleString('vi-VN')} labelFormatter={l => `Ngày: ${l}`}/>
                <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={3} dot={{ r: 4 }} name="Giá trị tồn kho (VND)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card header="Phân tích thất thoát">
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={lossAnalysis} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {lossAnalysis.map((entry: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={LOSS_COLORS[idx % LOSS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => v.toLocaleString('vi-VN')} labelFormatter={l => `Nhóm: ${l}`}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {quickReports.map(qr => (
          <Card key={qr.key} header={qr.label}>
            <div className="flex flex-col gap-2 items-start">
              <Button variant={quickReport === qr.key ? 'primary' : 'secondary'} onClick={() => setQuickReport(qr.key)}>Xem báo cáo</Button>
              <Button variant="secondary" onClick={() => exportPDF(qr.key)}>Xuất PDF</Button>
              <Button variant="secondary" onClick={() => exportExcel(qr.key)}>Xuất Excel</Button>
              <Button variant="secondary" onClick={() => exportCSV(qr.key)}>Xuất CSV</Button>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default ReportsDashboard; 