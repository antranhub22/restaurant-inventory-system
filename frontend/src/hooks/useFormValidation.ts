import { useState, useCallback } from 'react';
import { FormType, FormField } from '../types/form-template';

export interface ValidationError {
  field: string;
  message: string;
  display: 'inline_with_field' | 'banner';
  timing: 'on_blur_or_submit' | 'real_time_after_first_attempt';
  suggestions?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const useFormValidation = (type: FormType) => {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showRealTimeValidation, setShowRealTimeValidation] = useState(false);

  const validateField = useCallback((field: FormField, value: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Kiểm tra trường bắt buộc
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push({
        field: field.name,
        message: 'Trường này là bắt buộc',
        display: 'inline_with_field',
        timing: 'on_blur_or_submit'
      });
    }

    // Kiểm tra validation theo loại trường
    if (value) {
      switch (field.type) {
        case 'number':
          if (field.validation?.min !== undefined && value < field.validation.min) {
            errors.push({
              field: field.name,
              message: `Giá trị phải lớn hơn hoặc bằng ${field.validation.min}`,
              display: 'inline_with_field',
              timing: 'real_time_after_first_attempt',
              suggestions: [`Giá trị tối thiểu: ${field.validation.min}`]
            });
          }
          if (field.validation?.max !== undefined && value > field.validation.max) {
            errors.push({
              field: field.name,
              message: `Giá trị phải nhỏ hơn hoặc bằng ${field.validation.max}`,
              display: 'inline_with_field',
              timing: 'real_time_after_first_attempt',
              suggestions: [`Giá trị tối đa: ${field.validation.max}`]
            });
          }
          break;

        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            errors.push({
              field: field.name,
              message: 'Ngày không hợp lệ',
              display: 'inline_with_field',
              timing: 'real_time_after_first_attempt'
            });
          }
          break;
      }
    }

    // Kiểm tra pattern nếu có
    if (value && field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value.toString())) {
        errors.push({
          field: field.name,
          message: field.validation.message || 'Giá trị không đúng định dạng',
          display: 'inline_with_field',
          timing: 'real_time_after_first_attempt'
        });
      }
    }

    return errors;
  }, []);

  const validateForm = useCallback((formData: any, fields: FormField[]): ValidationResult => {
    let allErrors: ValidationError[] = [];

    const validateFieldAndSubfields = (field: FormField, value: any, prefix = '') => {
      const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
      
      // Validate field
      const fieldErrors = validateField(field, value);
      allErrors = [...allErrors, ...fieldErrors];

      // Validate subfields if any
      if (field.type === 'array' && Array.isArray(value)) {
        value.forEach((item, index) => {
          field.subFields?.forEach(subField => {
            validateFieldAndSubfields(
              subField,
              item[subField.name],
              `${fieldPath}[${index}]`
            );
          });
        });
      }
    };

    fields.forEach(field => {
      validateFieldAndSubfields(field, formData[field.name]);
    });

    // Kiểm tra logic nghiệp vụ theo loại form
    if (type === FormType.ADJUSTMENT) {
      // Kiểm tra chênh lệch
      const items = formData.items || [];
      items.forEach((item: any, index: number) => {
        const difference = (item.actual_quantity || 0) - (item.system_quantity || 0);
        const discrepancyRate = item.system_quantity ? (Math.abs(difference) / item.system_quantity) * 100 : 0;

        // Cảnh báo chênh lệch lớn
        if (discrepancyRate > 10) {
          allErrors.push({
            field: `items[${index}].actual_quantity`,
            message: `Chênh lệch ${discrepancyRate.toFixed(1)}% vượt quá ngưỡng cho phép`,
            display: 'banner',
            timing: 'real_time_after_first_attempt',
            suggestions: ['Vui lòng kiểm tra lại số liệu', 'Cung cấp lý do cho sự chênh lệch']
          });
        }
      });
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }, [validateField, type]);

  const handleBlur = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  }, []);

  const shouldShowError = useCallback((error: ValidationError): boolean => {
    if (error.timing === 'on_blur_or_submit') {
      return touchedFields.has(error.field);
    }
    return showRealTimeValidation;
  }, [touchedFields, showRealTimeValidation]);

  const resetValidation = useCallback(() => {
    setTouchedFields(new Set());
    setShowRealTimeValidation(false);
  }, []);

  return {
    validateForm,
    validateField,
    handleBlur,
    shouldShowError,
    resetValidation,
    setShowRealTimeValidation
  };
}; 