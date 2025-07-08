import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum FormType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  defaultValue?: any;
  readOnly?: boolean;
  subFields?: FormField[]; // For array/object type fields
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id?: string;
  name: string;
  type: FormType;
  sections: FormSection[];
  isDefault?: boolean;
  version?: string;
  description?: string;
}

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
    return template ? { ...template, sections: template.structure as FormSection[] } : null;
  }

  // Lấy tất cả form mẫu theo loại
  async getTemplatesByType(type: FormType): Promise<FormTemplate[]> {
    const templates = await prisma.formTemplate.findMany({
      where: {
        type,
        isActive: true
      }
    });
    return templates.map(t => ({ ...t, sections: t.structure as FormSection[] }));
  }

  // Tạo form mẫu mới
  async createTemplate(template: FormTemplate): Promise<FormTemplate> {
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
        isDefault: template.isDefault || false,
        version: template.version,
        description: template.description,
        isActive: true
      }
    });

    return { ...created, sections: created.structure as FormSection[] };
  }

  // Cập nhật form mẫu
  async updateTemplate(id: string, template: Partial<FormTemplate>): Promise<FormTemplate> {
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

    return { ...updated, sections: updated.structure as FormSection[] };
  }

  // Xóa form mẫu (soft delete)
  async deleteTemplate(id: string): Promise<void> {
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Lấy cấu hình validation của form
  async getFormConfig(type: FormType): Promise<any> {
    const config = await prisma.formConfig.findFirst({
      where: { type }
    });
    return config?.config;
  }

  // Cập nhật cấu hình validation
  async updateFormConfig(type: FormType, config: any): Promise<void> {
    await prisma.formConfig.upsert({
      where: {
        type
      },
      update: {
        config
      },
      create: {
        type,
        config
      }
    });
  }

  // Lấy danh sách trường tùy chỉnh
  async getCustomFields(): Promise<any[]> {
    return prisma.customField.findMany();
  }

  // Thêm trường tùy chỉnh mới
  async addCustomField(field: any): Promise<any> {
    return prisma.customField.create({
      data: field
    });
  }
}

export default new FormTemplateService(); 