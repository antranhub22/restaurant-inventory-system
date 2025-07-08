import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import type { FormType, FormTemplate, FormConfig, CustomField, FormTemplateWithHistory, FormUpdate } from '../types/form-template';

class FormRegistry {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;
  private cache: Map<string, FormTemplate>;
  private static instance: FormRegistry;

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || '');
    this.eventEmitter = new EventEmitter();
    this.cache = new Map();

    // Đăng ký lắng nghe sự kiện thay đổi form
    this.eventEmitter.on('formUpdated', this.handleFormUpdate.bind(this));
    this.eventEmitter.on('formDeleted', this.handleFormDelete.bind(this));

    // Khởi tạo cache từ Redis khi service start
    this.initializeCache();
  }

  public static getInstance(): FormRegistry {
    if (!FormRegistry.instance) {
      FormRegistry.instance = new FormRegistry();
    }
    return FormRegistry.instance;
  }

  private async initializeCache(): Promise<void> {
    try {
      // Lấy tất cả form template từ database
      const templates = await this.prisma.formTemplate.findMany({
        where: { isActive: true },
        include: { history: true }
      });

      // Cập nhật cache và Redis
      for (const template of templates) {
        const key = this.getCacheKey(template.type, template.id);
        const formTemplate = this.mapPrismaToFormTemplate(template);
        await this.redis.set(key, JSON.stringify(formTemplate));
        this.cache.set(key, formTemplate);
      }
    } catch (error) {
      console.error('Failed to initialize form registry cache:', error);
    }
  }

  private getCacheKey(type: string, id?: string): string {
    return id ? `form:${type}:${id}` : `form:${type}:default`;
  }

  private mapPrismaToFormTemplate(prismaTemplate: FormTemplateWithHistory): FormTemplate {
    return {
      id: prismaTemplate.id,
      name: prismaTemplate.name,
      type: prismaTemplate.type as FormType,
      sections: prismaTemplate.sections,
      isDefault: prismaTemplate.isDefault,
      version: prismaTemplate.version || undefined,
      description: prismaTemplate.description || undefined,
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt
    };
  }

  private async handleFormUpdate(template: FormTemplate): Promise<void> {
    try {
      const key = this.getCacheKey(template.type, template.id);
      
      // Cập nhật Redis
      await this.redis.set(key, JSON.stringify(template));
      
      // Cập nhật local cache
      this.cache.set(key, template);
      
      // Broadcast thông báo thay đổi
      await this.redis.publish('form-updates', JSON.stringify({
        type: 'UPDATE',
        formType: template.type,
        formId: template.id
      }));
    } catch (error) {
      console.error('Failed to handle form update:', error);
    }
  }

  private async handleFormDelete(type: string, id: string): Promise<void> {
    try {
      const key = this.getCacheKey(type, id);
      
      // Xóa khỏi Redis
      await this.redis.del(key);
      
      // Xóa khỏi local cache
      this.cache.delete(key);
      
      // Broadcast thông báo xóa
      await this.redis.publish('form-updates', JSON.stringify({
        type: 'DELETE',
        formType: type,
        formId: id
      }));
    } catch (error) {
      console.error('Failed to handle form deletion:', error);
    }
  }

  public async getTemplate(type: FormType, id?: string): Promise<FormTemplate | null> {
    try {
      const key = this.getCacheKey(type, id);
      
      // Thử lấy từ local cache
      let template = this.cache.get(key);
      
      if (!template) {
        // Thử lấy từ Redis
        const redisTemplate = await this.redis.get(key);
        if (redisTemplate) {
          template = JSON.parse(redisTemplate);
          this.cache.set(key, template as FormTemplate);
        } else {
          // Lấy từ database
          const dbTemplate = await this.prisma.formTemplate.findFirst({
            where: {
              type,
              id: id || undefined,
              isActive: true
            },
            include: { history: true }
          });
          
          if (dbTemplate) {
            template = this.mapPrismaToFormTemplate(dbTemplate as FormTemplateWithHistory);
            // Cập nhật cả Redis và local cache
            await this.redis.set(key, JSON.stringify(template));
            this.cache.set(key, template);
          }
        }
      }
      
      return template || null;
    } catch (error) {
      console.error('Failed to get form template:', error);
      return null;
    }
  }

  public async updateTemplate(template: FormTemplate): Promise<FormTemplate> {
    try {
      // Cập nhật trong database
      const updated = await this.prisma.formTemplate.update({
        where: { id: template.id },
        data: {
          name: template.name,
          structure: template.sections,
          isDefault: template.isDefault,
          version: template.version,
          description: template.description,
          updatedAt: new Date()
        },
        include: { history: true }
      });

      const formTemplate = this.mapPrismaToFormTemplate(updated);

      // Emit sự kiện cập nhật
      this.eventEmitter.emit('formUpdated', formTemplate);

      return formTemplate;
    } catch (error) {
      console.error('Failed to update form template:', error);
      throw error;
    }
  }

  public async deleteTemplate(type: FormType, id: string): Promise<void> {
    try {
      // Soft delete trong database
      await this.prisma.formTemplate.update({
        where: { id },
        data: { isActive: false }
      });

      // Emit sự kiện xóa
      this.eventEmitter.emit('formDeleted', type, id);
    } catch (error) {
      console.error('Failed to delete form template:', error);
      throw error;
    }
  }

  public async getFormConfig(type: FormType): Promise<FormConfig | null> {
    try {
      const config = await this.prisma.formConfig.findUnique({
        where: { type }
      });
      return config as FormConfig | null;
    } catch (error) {
      console.error('Failed to get form config:', error);
      return null;
    }
  }

  public async updateFormConfig(type: FormType, config: Partial<FormConfig>): Promise<FormConfig> {
    try {
      const updated = await this.prisma.formConfig.upsert({
        where: { type },
        update: { config: config.config },
        create: {
          type,
          config: config.config || {}
        }
      });
      return updated as FormConfig;
    } catch (error) {
      console.error('Failed to update form config:', error);
      throw error;
    }
  }

  public async getCustomFields(): Promise<CustomField[]> {
    try {
      const fields = await this.prisma.customField.findMany();
      return fields as CustomField[];
    } catch (error) {
      console.error('Failed to get custom fields:', error);
      return [];
    }
  }

  public async addCustomField(field: Omit<CustomField, 'id'>): Promise<CustomField> {
    try {
      const created = await this.prisma.customField.create({
        data: field
      });
      return created as CustomField;
    } catch (error) {
      console.error('Failed to add custom field:', error);
      throw error;
    }
  }

  public subscribeToUpdates(callback: (update: FormUpdate) => void): void {
    const subscriber = new Redis(process.env.REDIS_URL || '');
    
    subscriber.subscribe('form-updates', (err: Error | null) => {
      if (err) {
        console.error('Failed to subscribe to form updates:', err);
        return;
      }
    });

    subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'form-updates') {
        callback(JSON.parse(message));
      }
    });
  }
}

export default FormRegistry.getInstance(); 