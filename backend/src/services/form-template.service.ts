import { PrismaClient } from '.prisma/client';
import type { FormType, FormTemplate, FormConfig, CustomField } from '../types/form-template';

const prisma = new PrismaClient();

class FormTemplateService {
  // Lấy form mẫu mặc định theo loại
  async getDefaultTemplate(type: FormType): Promise<FormTemplate | null> {
    const template = await prisma.formTemplate.findFirst({
      where: {
        type,
        isDefault: true,
        isActive: true
      }
    });
    return template ? { 
      ...template, 
      sections: template.structure as Record<string, any>,
      type: template.type as FormType
    } : null;
  }

  // Lấy tất cả form mẫu theo loại
  async getTemplatesByType(type: FormType): Promise<FormTemplate[]> {
    const templates = await prisma.formTemplate.findMany({
      where: {
        type,
        isActive: true
      }
    });
    return templates.map((template: any) => ({ 
      ...template, 
      sections: template.structure as Record<string, any>,
      type: template.type as FormType
    }));
  }

  // Tạo form mẫu mới
  async createTemplate(template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormTemplate> {
    // Nếu là form mặc định, hủy form mặc định cũ
    if (template.isDefault) {
      await prisma.formTemplate.updateMany({
        where: {
          type: template.type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    const created = await prisma.formTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        structure: template.sections,
        isDefault: template.isDefault,
        version: template.version,
        description: template.description,
        isActive: true
      }
    });

    return { 
      ...created, 
      sections: created.structure as Record<string, any>,
      type: created.type as FormType
    };
  }

  // Cập nhật form mẫu
  async updateTemplate(id: string, template: Partial<Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FormTemplate> {
    // Lưu lịch sử trước khi cập nhật
    const current = await prisma.formTemplate.findUnique({ where: { id } });
    if (current) {
      await prisma.formTemplateHistory.create({
        data: {
          formTemplateId: id,
          structure: current.structure,
          changeNote: 'Template updated'
        }
      });
    }

    const updated = await prisma.formTemplate.update({
      where: { id },
      data: {
        name: template.name,
        structure: template.sections,
        isDefault: template.isDefault,
        version: template.version,
        description: template.description,
        updatedAt: new Date()
      }
    });

    return { 
      ...updated, 
      sections: updated.structure as Record<string, any>,
      type: updated.type as FormType
    };
  }

  // Xóa form mẫu (soft delete)
  async deleteTemplate(id: string): Promise<void> {
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Lấy cấu hình validation của form
  async getFormConfig(type: FormType): Promise<FormConfig | null> {
    const config = await prisma.formConfig.findFirst({
      where: { type }
    });
    return config as FormConfig | null;
  }

  // Cập nhật cấu hình validation
  async updateFormConfig(type: FormType, config: Partial<FormConfig>): Promise<FormConfig> {
    const updated = await prisma.formConfig.upsert({
      where: {
        type
      },
      update: {
        config: config.config
      },
      create: {
        type,
        config: config.config || {}
      }
    });
    return updated as FormConfig;
  }

  // Lấy danh sách trường tùy chỉnh
  async getCustomFields(): Promise<CustomField[]> {
    const fields = await prisma.customField.findMany();
    return fields as CustomField[];
  }

  // Thêm trường tùy chỉnh mới
  async addCustomField(field: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomField> {
    const created = await prisma.customField.create({
      data: field
    });
    return created as CustomField;
  }
}

export default new FormTemplateService(); 