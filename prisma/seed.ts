const { PrismaClient } = require('@prisma/client');
const { defaultTemplates } = require('../backend/src/data/default-templates');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default form templates...');

  // Xóa dữ liệu cũ
  await prisma.formTemplate.deleteMany();
  await prisma.formConfig.deleteMany();
  await prisma.customField.deleteMany();

  // Tạo form mẫu mặc định
  for (const template of defaultTemplates) {
    await prisma.formTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        structure: template.sections,
        isDefault: template.isDefault || false,
        version: template.version,
        description: template.description,
        isActive: true
      }
    });
  }

  // Tạo cấu hình mặc định cho mỗi loại form
  const defaultConfigs = [
    {
      type: 'IMPORT',
      config: {
        requireAttachments: true,
        requireApproval: true,
        autoNumbering: true,
        numberingPrefix: 'NK'
      }
    },
    {
      type: 'EXPORT',
      config: {
        requireAttachments: false,
        requireApproval: true,
        autoNumbering: true,
        numberingPrefix: 'XK'
      }
    },
    {
      type: 'RETURN',
      config: {
        requireAttachments: true,
        requireApproval: true,
        autoNumbering: true,
        numberingPrefix: 'HK'
      }
    },
    {
      type: 'ADJUSTMENT',
      config: {
        requireAttachments: true,
        requireApproval: true,
        autoNumbering: true,
        numberingPrefix: 'KK'
      }
    }
  ];

  for (const config of defaultConfigs) {
    await prisma.formConfig.create({
      data: {
        type: config.type,
        config: config.config
      }
    });
  }

  // Tạo một số trường tùy chỉnh mẫu
  const customFields = [
    {
      name: 'delivery_method',
      label: 'Phương thức giao hàng',
      type: 'select',
      options: [
        { value: 'direct', label: 'Trực tiếp' },
        { value: 'shipping', label: 'Vận chuyển' }
      ],
      isRequired: false
    },
    {
      name: 'temperature',
      label: 'Nhiệt độ bảo quản',
      type: 'number',
      validation: {
        min: -30,
        max: 30
      },
      isRequired: false
    }
  ];

  for (const field of customFields) {
    await prisma.customField.create({
      data: {
        name: field.name,
        label: field.label,
        type: field.type,
        options: field.options,
        validation: field.validation,
        isRequired: field.isRequired
      }
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 