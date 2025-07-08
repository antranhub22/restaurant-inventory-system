const FormType = {
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT'
} as const;

const defaultTemplates = [
  // Form mẫu Nhập kho
  {
    name: 'Phiếu Nhập Kho Mặc định',
    type: FormType.IMPORT,
    isDefault: true,
    version: '1.0',
    description: 'Form mẫu nhập kho mặc định',
    sections: [
      {
        title: 'Thông tin chung',
        fields: [
          {
            name: 'date',
            label: 'Ngày nhập',
            type: 'date',
            required: true
          },
          {
            name: 'supplier',
            label: 'Nhà cung cấp',
            type: 'select',
            required: true,
            options: [
              { value: 'supplier1', label: 'Công ty TNHH ABC' },
              { value: 'supplier2', label: 'Công ty Thực phẩm XYZ' },
              { value: 'supplier3', label: 'Siêu thị Metro' }
            ]
          },
          {
            name: 'invoice_no',
            label: 'Số hóa đơn',
            type: 'text',
            required: true
          },
          {
            name: 'staff',
            label: 'Nhân viên nhận',
            type: 'select',
            required: true,
            options: [
              { value: 'staff1', label: 'Nguyễn Văn A' },
              { value: 'staff2', label: 'Trần Thị B' },
              { value: 'staff3', label: 'Lê Văn C' }
            ]
          }
        ]
      },
      {
        title: 'Chi tiết hàng hóa',
        fields: [
          {
            name: 'items',
            label: 'Danh sách hàng hóa',
            type: 'array',
            required: true,
            subFields: [
              {
                name: 'name',
                label: 'Tên hàng hóa',
                type: 'text',
                required: true
              },
              {
                name: 'category',
                label: 'Danh mục',
                type: 'select',
                required: true,
                options: [
                  { value: 'cat1', label: 'Thực phẩm tươi sống' },
                  { value: 'cat2', label: 'Thực phẩm khô' },
                  { value: 'cat3', label: 'Gia vị' }
                ]
              },
              {
                name: 'quantity',
                label: 'Số lượng',
                type: 'number',
                required: true
              },
              {
                name: 'unit',
                label: 'Đơn vị',
                type: 'select',
                required: true,
                options: [
                  { value: 'kg', label: 'Kg' },
                  { value: 'box', label: 'Thùng' },
                  { value: 'piece', label: 'Cái' }
                ]
              },
              {
                name: 'price',
                label: 'Đơn giá',
                type: 'number',
                required: true
              },
              {
                name: 'expiry_date',
                label: 'Hạn sử dụng',
                type: 'date',
                required: true
              }
            ]
          }
        ]
      },
      {
        title: 'Ghi chú',
        fields: [
          {
            name: 'notes',
            label: 'Ghi chú',
            type: 'textarea',
            required: false
          }
        ]
      }
    ]
  },

  // Form mẫu Xuất kho
  {
    name: 'Phiếu Xuất Kho Mặc định',
    type: FormType.EXPORT,
    isDefault: true,
    version: '1.0',
    description: 'Form mẫu xuất kho mặc định',
    sections: [
      {
        title: 'Thông tin chung',
        fields: [
          {
            name: 'date',
            label: 'Ngày xuất',
            type: 'date',
            required: true
          },
          {
            name: 'purpose',
            label: 'Mục đích xuất',
            type: 'select',
            required: true,
            options: [
              { value: 'production', label: 'Sản xuất' },
              { value: 'sale', label: 'Bán hàng' },
              { value: 'damage', label: 'Hỏng hóc' }
            ]
          },
          {
            name: 'department',
            label: 'Bộ phận nhận',
            type: 'select',
            required: true,
            options: [
              { value: 'kitchen', label: 'Bếp' },
              { value: 'bar', label: 'Bar' },
              { value: 'service', label: 'Phục vụ' }
            ]
          },
          {
            name: 'staff',
            label: 'Nhân viên xuất',
            type: 'select',
            required: true,
            options: [
              { value: 'staff1', label: 'Nguyễn Văn A' },
              { value: 'staff2', label: 'Trần Thị B' },
              { value: 'staff3', label: 'Lê Văn C' }
            ]
          }
        ]
      },
      {
        title: 'Chi tiết xuất kho',
        fields: [
          {
            name: 'items',
            label: 'Danh sách hàng hóa',
            type: 'array',
            required: true,
            subFields: [
              {
                name: 'item_id',
                label: 'Mã hàng hóa',
                type: 'select',
                required: true,
                options: [] // Sẽ được populate từ database
              },
              {
                name: 'quantity',
                label: 'Số lượng xuất',
                type: 'number',
                required: true
              },
              {
                name: 'unit',
                label: 'Đơn vị',
                type: 'text',
                required: true,
                readOnly: true
              }
            ]
          }
        ]
      },
      {
        title: 'Ghi chú',
        fields: [
          {
            name: 'notes',
            label: 'Ghi chú',
            type: 'textarea',
            required: false
          }
        ]
      }
    ]
  },

  // Form mẫu Hoàn kho
  {
    name: 'Phiếu Hoàn Kho Mặc định',
    type: FormType.RETURN,
    isDefault: true,
    version: '1.0',
    description: 'Form mẫu hoàn kho mặc định',
    sections: [
      {
        title: 'Thông tin chung',
        fields: [
          {
            name: 'date',
            label: 'Ngày hoàn',
            type: 'date',
            required: true
          },
          {
            name: 'reason',
            label: 'Lý do hoàn',
            type: 'select',
            required: true,
            options: [
              { value: 'excess', label: 'Hàng thừa' },
              { value: 'defect', label: 'Hàng lỗi' },
              { value: 'expired', label: 'Hết hạn' },
              { value: 'cancel', label: 'Khách hủy' }
            ]
          },
          {
            name: 'department',
            label: 'Bộ phận hoàn',
            type: 'select',
            required: true,
            options: [
              { value: 'kitchen', label: 'Bếp' },
              { value: 'bar', label: 'Bar' },
              { value: 'service', label: 'Phục vụ' }
            ]
          },
          {
            name: 'staff',
            label: 'Nhân viên hoàn',
            type: 'select',
            required: true,
            options: [
              { value: 'staff1', label: 'Nguyễn Văn A' },
              { value: 'staff2', label: 'Trần Thị B' },
              { value: 'staff3', label: 'Lê Văn C' }
            ]
          }
        ]
      },
      {
        title: 'Chi tiết hoàn kho',
        fields: [
          {
            name: 'items',
            label: 'Danh sách hàng hóa',
            type: 'array',
            required: true,
            subFields: [
              {
                name: 'item_id',
                label: 'Mã hàng hóa',
                type: 'select',
                required: true,
                options: [] // Sẽ được populate từ database
              },
              {
                name: 'quantity',
                label: 'Số lượng hoàn',
                type: 'number',
                required: true
              },
              {
                name: 'condition',
                label: 'Tình trạng',
                type: 'select',
                required: true,
                options: [
                  { value: 'good', label: 'Còn tốt' },
                  { value: 'damaged', label: 'Hỏng' },
                  { value: 'expired', label: 'Hết hạn' }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Ghi chú',
        fields: [
          {
            name: 'notes',
            label: 'Ghi chú',
            type: 'textarea',
            required: false
          }
        ]
      }
    ]
  },

  // Form mẫu Kiểm kê
  {
    name: 'Phiếu Kiểm Kê Mặc định',
    type: FormType.ADJUSTMENT,
    isDefault: true,
    version: '1.0',
    description: 'Form mẫu kiểm kê mặc định',
    sections: [
      {
        title: 'Thông tin chung',
        fields: [
          {
            name: 'date',
            label: 'Ngày kiểm kê',
            type: 'date',
            required: true
          },
          {
            name: 'type',
            label: 'Loại kiểm kê',
            type: 'select',
            required: true,
            options: [
              { value: 'periodic', label: 'Kiểm kê định kỳ' },
              { value: 'spot', label: 'Kiểm kê đột xuất' },
              { value: 'end_shift', label: 'Kiểm kê cuối ca' }
            ]
          },
          {
            name: 'staff',
            label: 'Nhân viên kiểm kê',
            type: 'select',
            required: true,
            options: [
              { value: 'staff1', label: 'Nguyễn Văn A' },
              { value: 'staff2', label: 'Trần Thị B' },
              { value: 'staff3', label: 'Lê Văn C' }
            ]
          },
          {
            name: 'area',
            label: 'Khu vực kiểm kê',
            type: 'select',
            required: true,
            options: [
              { value: 'dry', label: 'Kho khô' },
              { value: 'cold', label: 'Kho lạnh' },
              { value: 'frozen', label: 'Kho đông' },
              { value: 'bar', label: 'Quầy bar' }
            ]
          }
        ]
      },
      {
        title: 'Chi tiết kiểm kê',
        fields: [
          {
            name: 'items',
            label: 'Danh sách hàng hóa',
            type: 'array',
            required: true,
            subFields: [
              {
                name: 'item_id',
                label: 'Mã hàng hóa',
                type: 'select',
                required: true,
                options: [] // Sẽ được populate từ database
              },
              {
                name: 'system_quantity',
                label: 'Số lượng hệ thống',
                type: 'number',
                required: true,
                readOnly: true
              },
              {
                name: 'actual_quantity',
                label: 'Số lượng thực tế',
                type: 'number',
                required: true
              },
              {
                name: 'difference',
                label: 'Chênh lệch',
                type: 'number',
                required: true,
                readOnly: true
              },
              {
                name: 'reason',
                label: 'Lý do chênh lệch',
                type: 'select',
                required: false,
                options: [
                  { value: 'natural', label: 'Hao hụt tự nhiên' },
                  { value: 'error', label: 'Lỗi nhập liệu' },
                  { value: 'damage', label: 'Hỏng hóc' },
                  { value: 'other', label: 'Khác' }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Ghi chú',
        fields: [
          {
            name: 'notes',
            label: 'Ghi chú',
            type: 'textarea',
            required: false
          }
        ]
      }
    ]
  }
];

module.exports = {
  FormType,
  defaultTemplates
}; 