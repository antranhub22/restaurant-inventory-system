import { Request, Response } from 'express';
import formTemplateService, { FormType } from '../services/form-template.service';

class FormTemplateController {
  // Lấy form mẫu mặc định
  async getDefaultTemplate(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!Object.values(FormType).includes(type as FormType)) {
        return res.status(400).json({ error: 'Invalid form type' });
      }

      const template = await formTemplateService.getDefaultTemplate(type as FormType);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lấy tất cả form mẫu theo loại
  async getTemplatesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!Object.values(FormType).includes(type as FormType)) {
        return res.status(400).json({ error: 'Invalid form type' });
      }

      const templates = await formTemplateService.getTemplatesByType(type as FormType);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Tạo form mẫu mới
  async createTemplate(req: Request, res: Response) {
    try {
      const template = req.body;
      if (!template.type || !template.name || !template.sections) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const created = await formTemplateService.createTemplate(template);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cập nhật form mẫu
  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = req.body;

      const updated = await formTemplateService.updateTemplate(id, template);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Xóa form mẫu
  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await formTemplateService.deleteTemplate(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lấy cấu hình form
  async getFormConfig(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!Object.values(FormType).includes(type as FormType)) {
        return res.status(400).json({ error: 'Invalid form type' });
      }

      const config = await formTemplateService.getFormConfig(type as FormType);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cập nhật cấu hình form
  async updateFormConfig(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const config = req.body;

      if (!Object.values(FormType).includes(type as FormType)) {
        return res.status(400).json({ error: 'Invalid form type' });
      }

      await formTemplateService.updateFormConfig(type as FormType, config);
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lấy danh sách trường tùy chỉnh
  async getCustomFields(req: Request, res: Response) {
    try {
      const fields = await formTemplateService.getCustomFields();
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Thêm trường tùy chỉnh mới
  async addCustomField(req: Request, res: Response) {
    try {
      const field = req.body;
      const created = await formTemplateService.addCustomField(field);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new FormTemplateController(); 