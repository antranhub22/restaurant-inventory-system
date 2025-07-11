import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FormType } from '../types/form-template';

// Schema cho processForm request
export const processFormSchema = z.object({
  formType: z.enum(['IMPORT', 'EXPORT', 'RETURN', 'ADJUSTMENT'] as const),
  file: z.any().refine((file) => file?.buffer, {
    message: 'File ảnh là bắt buộc'
  })
});

// Schema cho confirmFormContent request
export const confirmFormSchema = z.object({
  formId: z.string().min(1), // Allow any non-empty string, not just UUID
  corrections: z.array(z.object({
    fieldId: z.string(),
    oldValue: z.any(), // Allow any type for oldValue
    newValue: z.any(), // Allow any type for newValue  
    confidence: z.number().min(0).max(1).optional()
  })).optional().default([]) // Make corrections optional with default empty array
});

// Schema cho getPendingForms request
export const getPendingFormsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  formType: z.enum(['IMPORT', 'EXPORT', 'RETURN', 'ADJUSTMENT'] as const).optional()
});

// Middleware factory để validate request
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Merge query, body và file vào một object
      const dataToValidate = {
        ...req.query,
        ...req.body,
        file: req.file
      };

      // Validate data
      await schema.parseAsync(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}; 