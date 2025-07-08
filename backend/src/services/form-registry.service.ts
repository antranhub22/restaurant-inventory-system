import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { FormType, FormTemplate } from '../types/form-template';
import { Redis } from 'ioredis';

class FormRegistry {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;
  private cache: Map<string, FormTemplate>;
  private static instance: FormRegistry;

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
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
        where: { isActive: true }
      });

      // Cập nhật cache và Redis
      for (const template of templates) {
        const key = this.getCacheKey(template.type, template.id);
        await this.redis.set(key, JSON.stringify(template));
        this.cache.set(key, template as unknown as FormTemplate);
      }
    } catch (error) {
      console.error('Failed to initialize form registry cache:', error);
    }
  }

  private getCacheKey(type: string, id?: string): string {
    return id ? `form:${type}:${id}` : `form:${type}:default`;
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

  // API để lấy form template
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
          this.cache.set(key, template);
        } else {
          // Lấy từ database
          const dbTemplate = await this.prisma.formTemplate.findFirst({
            where: {
              type,
              id: id || undefined,
              isActive: true
            }
          });
          
          if (dbTemplate) {
            template = dbTemplate as unknown as FormTemplate;
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

  // API để cập nhật form template
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
        }
      });

      // Emit sự kiện cập nhật
      this.eventEmitter.emit('formUpdated', updated);

      return updated as unknown as FormTemplate;
    } catch (error) {
      console.error('Failed to update form template:', error);
      throw error;
    }
  }

  // API để xóa form template
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

  // API để validate form data
  public async validateFormData(type: FormType, data: any): Promise<boolean> {
    try {
      const template = await this.getTemplate(type);
      if (!template) return false;

      // Implement validation logic here
      return true;
    } catch (error) {
      console.error('Failed to validate form data:', error);
      return false;
    }
  }

  // API để lấy form history
  public async getTemplateHistory(id: string): Promise<any[]> {
    try {
      return await this.prisma.formTemplateHistory.findMany({
        where: { formTemplateId: id },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Failed to get form template history:', error);
      return [];
    }
  }

  // API để subscribe các thay đổi form
  public subscribeToUpdates(callback: (update: any) => void): void {
    const subscriber = new Redis(process.env.REDIS_URL);
    
    subscriber.subscribe('form-updates', (err) => {
      if (err) {
        console.error('Failed to subscribe to form updates:', err);
        return;
      }
    });

    subscriber.on('message', (channel, message) => {
      if (channel === 'form-updates') {
        callback(JSON.parse(message));
      }
    });
  }
}

export default FormRegistry.getInstance(); 