import React, { useEffect, useState } from 'react';
import { FormTemplate, FormType } from '../../types/form-template';
import { useForm } from '../../contexts/FormContext';

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

  useEffect(() => {
    loadTemplate();
    
    // Subscribe to template updates
    subscribeToUpdates((update) => {
      if (update.formType === type && update.formId === formId) {
        loadTemplate();
      }
    });
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

  const renderField = (field: any) => {
    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            id={`${type.toLowerCase()}-${field.name}`}
            value={formData[field.name] || ''}
            onChange={e => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="form-control"
          />
        );
      case 'select':
        return (
          <select
            id={`${type.toLowerCase()}-${field.name}`}
            value={formData[field.name] || ''}
            onChange={e => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="form-control"
          >
            <option value="">Chọn {field.label.toLowerCase()}</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            id={`${type.toLowerCase()}-${field.name}`}
            value={formData[field.name] || ''}
            onChange={e => handleInputChange(field.name, parseFloat(e.target.value))}
            required={field.required}
            readOnly={field.readOnly}
            className="form-control"
          />
        );
      case 'textarea':
        return (
          <textarea
            id={`${type.toLowerCase()}-${field.name}`}
            value={formData[field.name] || ''}
            onChange={e => handleInputChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
            className="form-control"
          />
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
          <input
            type="text"
            id={`${type.toLowerCase()}-${field.name}`}
            value={formData[field.name] || ''}
            onChange={e => handleInputChange(field.name, e.target.value)}
            required={field.required}
            readOnly={field.readOnly}
            className="form-control"
          />
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  return (
    <form onSubmit={handleSubmit} className={`base-form ${className}`}>
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
          onClick={() => setFormData({})}
        >
          Xóa form
        </button>
      </div>
    </form>
  );
};

export default BaseForm; 