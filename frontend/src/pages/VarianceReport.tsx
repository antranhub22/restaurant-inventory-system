import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { VarianceData, VarianceFilter, VarianceReport as VarianceReportType } from '../types/variance';
import varianceService from '../services/variance.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const VarianceReport: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedVarianceType, setSelectedVarianceType] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVariance, setSelectedVariance] = useState<VarianceData | null>(null);
  const [reportData, setReportData] = useState<VarianceReportType | null>(null);
  const [loading, setLoading] = useState(false);

  // Load variance data
  useEffect(() => {
    const fetchVarianceData = async () => {
      setLoading(true);
      try {
        const filters: VarianceFilter = {
          startDate: dateRange.from,
          endDate: dateRange.to,
          departmentId: selectedDepartment === 'all' ? undefined : parseInt(selectedDepartment),
          varianceType: selectedVarianceType as any
        };
        
        // For now, use mock data. In production, this would be:
        // const data = await varianceService.getVarianceReport(filters);
        const data = varianceService.generateMockVarianceData(filters);
        setReportData(data);
      } catch (error) {
        console.error('Error loading variance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVarianceData();
  }, [dateRange, selectedDepartment, selectedVarianceType]);

  // Get department options
  const departments = [
    { value: 'all', label: 'Tất cả bộ phận' },
    { value: 'kitchen', label: 'Bếp' },
    { value: 'bar', label: 'Quầy bar' },
    { value: 'storage', label: 'Kho' },
    { value: 'service', label: 'Phục vụ' },
  ];

  const varianceTypes = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'positive', label: 'Chênh lệch dương (+)' },
    { value: 'negative', label: 'Chênh lệch âm (-)' },
    { value: 'critical', label: 'Chênh lệch nghiêm trọng' },
  ];

  // Filter variance data
  const filteredVariances = reportData ? reportData.variances.filter(v => {
    const matchDepartment = selectedDepartment === 'all' || v.department === selectedDepartment;
    const matchVarianceType = selectedVarianceType === 'all' || 
      (selectedVarianceType === 'positive' && v.stockVariance > 0) ||
      (selectedVarianceType === 'negative' && v.stockVariance < 0) ||
      (selectedVarianceType === 'critical' && v.status === 'critical');
    
    return matchDepartment && matchVarianceType;
  }) : [];

  // Get statistics
  const stats = reportData?.stats || {
    totalVariances: 0,
    positiveVariances: 0,
    negativeVariances: 0,
    criticalVariances: 0,
    totalVarianceValue: 0,
    averageVariancePercent: 0,
    pendingVariances: 0
  };

  // Department breakdown
  const departmentBreakdown = reportData?.byDepartment.map(dept => ({
    name: dept.departmentName,
    count: dept.varianceCount,
    value: dept.totalVarianceValue
  })) || [];

  // Trend data
  const trendData = reportData?.trend.map(t => ({
    date: t.date,
    value: t.totalValue,
    count: t.totalVariances
  })) || [];

  // Variance reasons
  const reasonData = reportData?.byReason || [];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigation': return 'bg-blue-100 text-blue-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ xử lý';
      case 'investigation': return 'Đang điều tra';
      case 'critical': return 'Nghiêm trọng';
      case 'resolved': return 'Đã giải quyết';
      default: return status;
    }
  };

  const getDepartmentText = (dept: string) => {
    switch (dept) {
      case 'kitchen': return 'Bếp';
      case 'bar': return 'Quầy bar';
      case 'storage': return 'Kho';
      case 'service': return 'Phục vụ';
      default: return dept;
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Handle variance detail view
  const handleViewDetail = (variance: VarianceData) => {
    setSelectedVariance(variance);
    setShowDetailModal(true);
  };

  // Handle variance actions
  const handleVarianceAction = async (_action: string, _notes?: string) => {
    if (selectedVariance) {
      try {
        // For now, just update locally. In production, this would be:
        // const request = {
        //   varianceId: selectedVariance.id,
        //   action: _action as 'approve' | 'reject' | 'investigate',
        //   notes: _notes
        // };
        // await varianceService.processVariance(request);
        
        setShowDetailModal(false);
        // Refresh data
        const refreshFilters: VarianceFilter = {
          startDate: dateRange.from,
          endDate: dateRange.to,
          departmentId: selectedDepartment === 'all' ? undefined : parseInt(selectedDepartment),
          varianceType: selectedVarianceType as any
        };
        const data = varianceService.generateMockVarianceData(refreshFilters);
        setReportData(data);
      } catch (error) {
        console.error('Error processing variance:', error);
      }
    }
  };

  // Export report
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      // For now, just log. In production, this would be:
      // const filters: VarianceFilter = {
      //   startDate: dateRange.from,
      //   endDate: dateRange.to,
      //   departmentId: selectedDepartment === 'all' ? undefined : parseInt(selectedDepartment),
      //   varianceType: selectedVarianceType as any
      // };
      // await varianceService.exportVarianceReport(filters, format);
      console.log(`Exporting variance report as ${format}`);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo chênh lệch</h1>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Xuất Excel</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Xuất PDF</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bộ phận
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại chênh lệch
              </label>
              <select
                value={selectedVarianceType}
                onChange={(e) => setSelectedVarianceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {varianceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tổng chênh lệch</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalVariances}</p>
                    </div>
                    <div className="text-2xl">📊</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Chênh lệch dương</p>
                      <p className="text-2xl font-bold text-green-600">{stats.positiveVariances}</p>
                    </div>
                    <div className="text-2xl">⬆️</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Chênh lệch âm</p>
                      <p className="text-2xl font-bold text-red-600">{stats.negativeVariances}</p>
                    </div>
                    <div className="text-2xl">⬇️</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Nghiêm trọng</p>
                      <p className="text-2xl font-bold text-red-600">{stats.criticalVariances}</p>
                    </div>
                    <div className="text-2xl">⚠️</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Variance Trend */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Xu hướng chênh lệch</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Department Breakdown */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Chênh lệch theo bộ phận</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Variance by Reason */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Nguyên nhân chênh lệch</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reasonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="totalValue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Variance Details Table */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Chi tiết chênh lệch</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hàng hóa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bộ phận
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dự kiến
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thực tế
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chênh lệch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá trị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVariances.map((variance) => (
                        <tr key={variance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{variance.itemName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getDepartmentText(variance.department)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{variance.expectedStock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{variance.actualStock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              variance.stockVariance > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variance.stockVariance > 0 ? '+' : ''}{variance.stockVariance}
                              ({variance.stockVariancePercent.toFixed(1)}%)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              variance.stockVarianceValue > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(variance.stockVarianceValue)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(variance.status)}`}>
                              {getStatusText(variance.status)}
                            </span>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAlertLevelColor(variance.alertLevel)}`}>
                              {variance.alertLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="secondary"
                              onClick={() => handleViewDetail(variance)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Variance Detail Modal */}
             <Modal
         open={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title="Chi tiết chênh lệch"
       >
         {selectedVariance && (
           <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <h4 className="font-medium text-gray-900">Thông tin cơ bản</h4>
                 <div className="mt-2 space-y-2">
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Hàng hóa:</span> {selectedVariance.itemName}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Bộ phận:</span> {getDepartmentText(selectedVariance.department)}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Ngày ca:</span> {selectedVariance.shiftDate}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Ca làm việc:</span> {selectedVariance.shiftType}
                   </p>
                 </div>
               </div>
               <div>
                 <h4 className="font-medium text-gray-900">Chênh lệch chi tiết</h4>
                 <div className="mt-2 space-y-2">
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Dự kiến:</span> {selectedVariance.expectedStock}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Thực tế:</span> {selectedVariance.actualStock}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Chênh lệch:</span> {selectedVariance.stockVariance}
                   </p>
                   <p className="text-sm text-gray-600">
                     <span className="font-medium">Giá trị:</span> {formatCurrency(selectedVariance.stockVarianceValue)}
                   </p>
                 </div>
               </div>
             </div>

             {selectedVariance.reason && (
               <div>
                 <h4 className="font-medium text-gray-900">Nguyên nhân</h4>
                 <p className="mt-2 text-sm text-gray-600">{selectedVariance.reason}</p>
               </div>
             )}

             {selectedVariance.resolutionNotes && (
               <div>
                 <h4 className="font-medium text-gray-900">Ghi chú xử lý</h4>
                 <p className="mt-2 text-sm text-gray-600">{selectedVariance.resolutionNotes}</p>
               </div>
             )}

             <div className="flex justify-end space-x-3">
               {selectedVariance.status === 'pending' && (
                 <>
                   <Button
                     variant="secondary"
                     onClick={() => handleVarianceAction('investigate')}
                   >
                     Điều tra
                   </Button>
                   <Button
                     variant="primary"
                     onClick={() => handleVarianceAction('approve')}
                   >
                     Phê duyệt
                   </Button>
                 </>
               )}
               <Button
                 variant="secondary"
                 onClick={() => setShowDetailModal(false)}
               >
                 Đóng
               </Button>
             </div>
           </div>
         )}
       </Modal>
    </Layout>
  );
};

export default VarianceReport; 