import * as XLSX from 'xlsx';

interface ExportOptions {
  fileName?: string;
  sheetName?: string;
}

export const exportToExcel = (data: any, options: ExportOptions = {}) => {
  const {
    fileName = 'report.xlsx',
    sheetName = 'Sheet1'
  } = options;

  // Tạo workbook mới
  const wb = XLSX.utils.book_new();

  // Chuyển đổi dữ liệu thành định dạng phù hợp cho Excel
  const transformData = (data: any) => {
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    // Header row
    const headers = [
      'Ngày kiểm kê',
      'Loại kiểm kê',
      'Khu vực',
      'Nhân viên',
      'Mã hàng',
      'Tên hàng',
      'SL hệ thống',
      'SL thực tế',
      'Chênh lệch',
      'Tỷ lệ chênh lệch (%)',
      'Lý do'
    ];

    // Data rows
    const rows = data.items.map((item: any) => {
      const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
      const discrepancyRate = item.system_quantity 
        ? (Math.abs(difference) / item.system_quantity) * 100 
        : 0;

      return [
        new Date(data.date).toLocaleDateString('vi-VN'),
        data.type,
        data.area,
        data.staff,
        item.item_id,
        item.name,
        item.system_quantity,
        item.actual_quantity,
        difference,
        discrepancyRate.toFixed(1),
        item.reason || ''
      ];
    });

    return [headers, ...rows];
  };

  // Tạo worksheet
  const ws = XLSX.utils.aoa_to_sheet(transformData(data));

  // Định dạng cột
  const colWidths = [
    { wch: 12 }, // Ngày
    { wch: 15 }, // Loại
    { wch: 12 }, // Khu vực
    { wch: 20 }, // Nhân viên
    { wch: 10 }, // Mã hàng
    { wch: 30 }, // Tên hàng
    { wch: 12 }, // SL hệ thống
    { wch: 12 }, // SL thực tế
    { wch: 12 }, // Chênh lệch
    { wch: 15 }, // Tỷ lệ
    { wch: 30 }  // Lý do
  ];

  ws['!cols'] = colWidths;

  // Thêm worksheet vào workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Xuất file
  XLSX.writeFile(wb, fileName);
};

export const exportToPdf = async (data: any, options: ExportOptions = {}) => {
  const { fileName = 'report.pdf' } = options;

  // Import động để tránh bundle size lớn
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // Tiêu đề
  doc.setFontSize(16);
  doc.text('Báo cáo Kiểm Kê', 14, 15);

  // Thông tin chung
  doc.setFontSize(11);
  doc.text(`Ngày kiểm kê: ${new Date(data.date).toLocaleDateString('vi-VN')}`, 14, 25);
  doc.text(`Loại kiểm kê: ${data.type}`, 14, 32);
  doc.text(`Khu vực: ${data.area}`, 14, 39);
  doc.text(`Nhân viên: ${data.staff}`, 14, 46);

  // Bảng chi tiết
  const tableHeaders = [
    ['Mã hàng', 'Tên hàng', 'SL HT', 'SL TT', 'CL', '%', 'Lý do']
  ];

  const tableBody = (data.items || []).map((item: any) => {
    const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
    const discrepancyRate = item.system_quantity 
      ? (Math.abs(difference) / item.system_quantity) * 100 
      : 0;

    return [
      item.item_id,
      item.name,
      item.system_quantity,
      item.actual_quantity,
      difference,
      `${discrepancyRate.toFixed(1)}%`,
      item.reason || ''
    ];
  });

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    startY: 55,
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 'auto' }
    }
  });

  // Tổng kết
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.text('Tổng kết:', 14, finalY + 10);
  doc.text(`Tổng số mặt hàng: ${data.items?.length || 0}`, 14, finalY + 20);

  // Xuất file
  doc.save(fileName);
}; 