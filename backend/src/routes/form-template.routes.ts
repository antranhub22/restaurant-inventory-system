import { Router } from 'express';
import formTemplateController from '../controllers/form-template.controller';

const router: Router = Router();

// Form mẫu routes
router.get('/templates/:type/default', formTemplateController.getDefaultTemplate);
router.get('/templates/:type', formTemplateController.getTemplatesByType);
router.post('/templates', formTemplateController.createTemplate);
router.put('/templates/:id', formTemplateController.updateTemplate);
router.delete('/templates/:id', formTemplateController.deleteTemplate);

// Cấu hình form routes
router.get('/config/:type', formTemplateController.getFormConfig);
router.put('/config/:type', formTemplateController.updateFormConfig);

// Trường tùy chỉnh routes
router.get('/custom-fields', formTemplateController.getCustomFields);
router.post('/custom-fields', formTemplateController.addCustomField);

export default router; 