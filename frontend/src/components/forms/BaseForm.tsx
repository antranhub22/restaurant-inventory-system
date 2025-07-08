import React, { useEffect, useState } from 'react';
import { FormTemplate, FormType } from '../../types/form-template';
import { useForm } from '../../contexts/FormContext';
import { useFormValidation, ValidationError } from '../../hooks/useFormValidation';
import FormError from '../common/FormError';

interface BaseFormProps {
  type: FormType;
  onSubmit: (data: any) => void;
  formId?: string;
  className?: string;
}

const BaseForm: React.FC<BaseFormProps> = ({
  type,
  onSubmit,
  formId,
  className = ''
}) => {
  const { getTemplate, subscribeToUpdates } = useForm();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  
  const {
    validateForm,
    validateField,
    handleBlur,
    shouldShowError,
    resetValidation,
    setShowRealTimeValidation
  } = useFormValidation(type);

  useEffect(() => {
    loadTemplate();
    
    // Subscribe to template updates
    subscribeToUpdates((update) => {
      if (update.formType === type && update.formId === formId) {
        loadTemplate();
      }
    });

    return () => {
      resetValidation();
    };
  }, [type, formId]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedTemplate = await getTemplate(type, formId);
      if (!loadedTemplate) {
        throw new Error('Form template not found');
      }
      setTemplate(loadedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle special cases (e.g., auto-calculations)
    handleSpecialCases(field, value);

    // Validate field on change
    if (template) {
      const fieldDef = findField(template.sections, field);
      if (fieldDef) {
        const errors = validateField(fieldDef, value);
        setFormErrors(prev => {
          const filtered = prev.filter(e => e.field !== field);
          return [...filtered, ...errors];
        });
      }
    }
  };

  const findField = (sections: any[], fieldPath: string) => {
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.name === fieldPath) {
          return field;
        }
        if (field.type === 'array' && field.subFields) {
          const match = fieldPath.match(/(\w+)\[(\d+)\]\.(\w+)/);
          if (match && match[1] === field.name) {
            const subFieldName = match[3];
            const subField = field.subFields.find(sf => sf.name === subFieldName);
            if (subField) {
              return subField;
            }
          }
        }
      }
    }
    return null;
  };

  const handleSpecialCases = (field: string, value: any) => {
    // Example: Auto-calculate difference in adjustment form
    if (field.includes('actual_quantity')) {
      const itemIndex = parseInt(field.match(/\[(\d+)\]/)?.[1] || '0');
      const systemQty = formData.items?.[itemIndex]?.system_quantity || 0;
      const actualQty = value || 0;
      const difference = actualQty - systemQty;
      
      handleInputChange(`items[${itemIndex}].difference`, difference);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    handleBlur(fieldName);
  };

  const renderField = (field: any) => {
    const fieldErrors = formErrors.filter(e => e.field === field.name);
    const showErrors = fieldErrors.some(e => shouldShowError(e));

    const commonProps = {
      id: `${type.toLowerCase()}-${field.name}`,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e: any) => handleInputChange(field.name, e.target.value),
      onBlur: () => handleFieldBlur(field.name),
      required: field.required,
      className: `form-control ${showErrors ? 'border-red-500' : ''}`
    };

    const renderErrors = () => (
      showErrors && fieldErrors.map((error, index) => (
        <FormError key={index} error={error} />
      ))
    );

    switch (field.type) {
      case 'date':
        return (
          <>
            <input
              type="date"
              {...commonProps}
            />
            {renderErrors()}
          </>
        );

      case 'select':
        return (
          <>
            <select {...commonProps}>
              <option value="">Chọn {field.label.toLowerCase()}</option>
              {field.options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {renderErrors()}
          </>
        );

      case 'number':
        return (
          <>
            <input
              type="number"
              {...commonProps}
              onChange={e => handleInputChange(field.name, parseFloat(e.target.value))}
              readOnly={field.readOnly}
            />
            {renderErrors()}
          </>
        );

      case 'textarea':
        return (
          <>
            <textarea
              {...commonProps}
              rows={3}
            />
            {renderErrors()}
          </>
        );

      case 'array':
        return (
          <div className="array-field">
            {(formData[field.name] || [{}]).map((item: any, index: number) => (
              <div key={index} className="array-item">
                {field.subFields?.map((subField: any) => (
                  <div key={subField.name} className="form-group">
                    <label htmlFor={`${type.toLowerCase()}-${field.name}-${index}-${subField.name}`}>
                      {subField.label}
                    </label>
                    {renderField({
                      ...subField,
                      name: `${field.name}[${index}].${subField.name}`,
                    })}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    const newItems = [...(formData[field.name] || [])];
                    newItems.splice(index, 1);
                    handleInputChange(field.name, newItems);
                  }}
                >
                  Xóa
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const newItems = [...(formData[field.name] || []), {}];
                handleInputChange(field.name, newItems);
              }}
            >
              Thêm {field.label.toLowerCase()}
            </button>
          </div>
        );

      default:
        return (
          <>
            <input
              type="text"
              {...commonProps}
              readOnly={field.readOnly}
            />
            {renderErrors()}
          </>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowRealTimeValidation(true);

    if (template) {
      const { isValid, errors } = validateForm(formData, template.sections.flatMap(s => s.fields));
      setFormErrors(errors);

      if (isValid) {
        onSubmit(formData);
      } else {
        // Scroll to first error
        const firstError = errors[0];
        const element = document.getElementById(`${type.toLowerCase()}-${firstError.field}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!template) {
    return <div className="error">Form template not found</div>;
  }

  // Render banner errors
  const bannerErrors = formErrors.filter(e => e.display === 'banner' && shouldShowError(e));

  return (
    <form onSubmit={handleSubmit} className={`base-form ${className}`}>
      {bannerErrors.length > 0 && (
        <div className="mb-4">
          {bannerErrors.map((error, index) => (
            <FormError key={index} error={error} className="mb-2" />
          ))}
        </div>
      )}

      {template.sections.map(section => (
        <div key={section.title} className="form-section">
          <h3>{section.title}</h3>
          <div className="form-grid">
            {section.fields.map(field => (
              <div key={field.name} className="form-group">
                <label htmlFor={`${type.toLowerCase()}-${field.name}`}>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Lưu {template.name.toLowerCase()}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setFormData({});
            resetValidation();
          }}
        >
          Xóa form
        </button>
      </div>
    </form>
  );
};

export default BaseForm; 