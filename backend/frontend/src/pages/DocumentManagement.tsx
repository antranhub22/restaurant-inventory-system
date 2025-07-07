import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
// @ts-ignore
import sampleData from '@docs/du_lieu/sample_data.json';
import { useAuthStore } from '../store';

const templates = sampleData.templates;
const docTypes = [
  { key: 'withdrawal_slip_template', label: 'Phiếu xuất kho' },
  { key: 'return_slip_template', label: 'Phiếu hoàn trả' },
  { key: 'waste_report_template', label: 'Báo cáo hao hụt' },
  { key: 'daily_reconciliation_template', label: 'Báo cáo đối chiếu cuối ngày' },
];

const DocumentManagement: React.FC = () => {
  const [type, setType] = useState(docTypes[0].key);
  const template = templates[type];
  const { user } = useAuthStore();

  if (!user || !['owner','manager'].includes(user.role)) {
    return <Layout header={<div className='text-2xl font-bold'>Quản lý phiếu & báo cáo</div>}><div className='text-center text-red-500 py-8'>Bạn không có quyền truy cập chức năng này.</div></Layout>;
  }

  return (
    <Layout header={<div className="text-2xl font-bold">Quản lý phiếu & báo cáo</div>}>
      <div className="mb-4 max-w-xs">
        <label className="block mb-1 font-medium text-gray-700">Chọn loại phiếu/báo cáo</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2">
          {docTypes.map(dt => (
            <option key={dt.key} value={dt.key}>{dt.label}</option>
          ))}
        </select>
      </div>
      <Card header={template.title}>
        <div className="mb-2 font-semibold">Các trường thông tin:</div>
        <ul className="list-disc pl-6 mb-4">
          {template.fields.map((f: any) => (
            <li key={f.field_name} className="mb-1">
              <span className="font-medium">{f.label}</span>
              {f.required && <span className="text-red-500 ml-1">*</span>}
              {f.type && <span className="ml-2 text-xs text-gray-500">[{f.type}]</span>}
            </li>
          ))}
        </ul>
        {template.sample_data && (
          <div className="mb-2">
            <div className="font-semibold mb-1">Dữ liệu mẫu:</div>
            <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(template.sample_data, null, 2)}</pre>
          </div>
        )}
      </Card>
    </Layout>
  );
};

export default DocumentManagement; 