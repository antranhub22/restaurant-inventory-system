import React, { useState, useEffect } from 'react';
import { FormTemplate, FormType, FormField } from '../../types/form-template';
import { useForm } from '../../contexts/FormContext';
import JSONEditor from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

interface FormTemplateManagerProps {
  className?: string;
}

const FormTemplateManager: React.FC<FormTemplateManagerProps> = ({ className = '' }) => {
  const { templates, getTemplate, updateTemplate } = useForm();
  const [selectedType, setSelectedType] = useState<FormType>(FormType.IMPORT);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [selectedType]);

  const loadTemplate = async () => {
    try {
      const template = await getTemplate(selectedType);
      setSelectedTemplate(template);
      setError(null);
    } catch (err) {
      setError('Failed to load template');
      console.error(err);
    }
  };

  const handleTypeChange = (type: FormType) => {
    setSelectedType(type);
    setEditMode(false);
    setPreviewMode(false);
  };

  const handleTemplateChange = (newTemplate: any) => {
    try {
      // Validate template structure
      if (!newTemplate.name || !newTemplate.sections) {
        throw new Error('Invalid template structure');
      }
      setSelectedTemplate(newTemplate);
      setError(null);
    } catch (err) {
      setError('Invalid template format');
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      if (!selectedTemplate) return;
      await updateTemplate(selectedTemplate);
      setEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    }
  };

  const renderFieldEditor = (field: FormField, onChange: (field: FormField) => void) => {
    return (
      <div className="field-editor">
        <div className="field-row">
          <input
            type="text"
            value={field.name}
            onChange={e => onChange({ ...field, name: e.target.value })}
            placeholder="Field name"
            className="form-control"
          />
          <input
            type="text"
            value={field.label}
            onChange={e => onChange({ ...field, label: e.target.value })}
            placeholder="Field label"
            className="form-control"
          />
          <select
            value={field.type}
            onChange={e => onChange({ ...field, type: e.target.value })}
            className="form-control"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
            <option value="textarea">Textarea</option>
            <option value="array">Array</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onChange({ ...field, required: e.target.checked })}
            />
            Required
          </label>
          <label>
            <input
              type="checkbox"
              checked={field.readOnly}
              onChange={e => onChange({ ...field, readOnly: e.target.checked })}
            />
            Read Only
          </label>
        </div>
        {field.type === 'select' && (
          <div className="options-editor">
            <h4>Options</h4>
            {field.options?.map((opt, i) => (
              <div key={i} className="option-row">
                <input
                  type="text"
                  value={opt.value}
                  onChange={e => {
                    const newOptions = [...(field.options || [])];
                    newOptions[i] = { ...opt, value: e.target.value };
                    onChange({ ...field, options: newOptions });
                  }}
                  placeholder="Value"
                  className="form-control"
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={e => {
                    const newOptions = [...(field.options || [])];
                    newOptions[i] = { ...opt, label: e.target.value };
                    onChange({ ...field, options: newOptions });
                  }}
                  placeholder="Label"
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = field.options?.filter((_, index) => index !== i);
                    onChange({ ...field, options: newOptions });
                  }}
                  className="btn btn-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newOptions = [...(field.options || []), { value: '', label: '' }];
                onChange({ ...field, options: newOptions });
              }}
              className="btn btn-secondary"
            >
              Add Option
            </button>
          </div>
        )}
        {field.type === 'array' && (
          <div className="subfields-editor">
            <h4>Sub Fields</h4>
            {field.subFields?.map((subField, i) => (
              <div key={i} className="subfield-container">
                {renderFieldEditor(subField, (newSubField) => {
                  const newSubFields = [...(field.subFields || [])];
                  newSubFields[i] = newSubField;
                  onChange({ ...field, subFields: newSubFields });
                })}
                <button
                  type="button"
                  onClick={() => {
                    const newSubFields = field.subFields?.filter((_, index) => index !== i);
                    onChange({ ...field, subFields: newSubFields });
                  }}
                  className="btn btn-danger"
                >
                  Remove Sub Field
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newSubField: FormField = {
                  name: '',
                  label: '',
                  type: 'text',
                  required: false
                };
                const newSubFields = [...(field.subFields || []), newSubField];
                onChange({ ...field, subFields: newSubFields });
              }}
              className="btn btn-secondary"
            >
              Add Sub Field
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTemplateEditor = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="template-editor">
        <div className="template-header">
          <input
            type="text"
            value={selectedTemplate.name}
            onChange={e => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
            placeholder="Template Name"
            className="form-control"
          />
          <input
            type="text"
            value={selectedTemplate.version || ''}
            onChange={e => setSelectedTemplate({ ...selectedTemplate, version: e.target.value })}
            placeholder="Version"
            className="form-control"
          />
          <textarea
            value={selectedTemplate.description || ''}
            onChange={e => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
            placeholder="Description"
            className="form-control"
          />
        </div>
        <div className="sections-editor">
          {selectedTemplate.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="section-container">
              <div className="section-header">
                <input
                  type="text"
                  value={section.title}
                  onChange={e => {
                    const newSections = [...selectedTemplate.sections];
                    newSections[sectionIndex] = { ...section, title: e.target.value };
                    setSelectedTemplate({ ...selectedTemplate, sections: newSections });
                  }}
                  placeholder="Section Title"
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSections = selectedTemplate.sections.filter((_, i) => i !== sectionIndex);
                    setSelectedTemplate({ ...selectedTemplate, sections: newSections });
                  }}
                  className="btn btn-danger"
                >
                  Remove Section
                </button>
              </div>
              <div className="fields-container">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="field-container">
                    {renderFieldEditor(field, (newField) => {
                      const newSections = [...selectedTemplate.sections];
                      const newFields = [...section.fields];
                      newFields[fieldIndex] = newField;
                      newSections[sectionIndex] = { ...section, fields: newFields };
                      setSelectedTemplate({ ...selectedTemplate, sections: newSections });
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = [...selectedTemplate.sections];
                        const newFields = section.fields.filter((_, i) => i !== fieldIndex);
                        newSections[sectionIndex] = { ...section, fields: newFields };
                        setSelectedTemplate({ ...selectedTemplate, sections: newSections });
                      }}
                      className="btn btn-danger"
                    >
                      Remove Field
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newField: FormField = {
                      name: '',
                      label: '',
                      type: 'text',
                      required: false
                    };
                    const newSections = [...selectedTemplate.sections];
                    newSections[sectionIndex] = {
                      ...section,
                      fields: [...section.fields, newField]
                    };
                    setSelectedTemplate({ ...selectedTemplate, sections: newSections });
                  }}
                  className="btn btn-secondary"
                >
                  Add Field
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newSection = {
                title: '',
                fields: []
              };
              setSelectedTemplate({
                ...selectedTemplate,
                sections: [...selectedTemplate.sections, newSection]
              });
            }}
            className="btn btn-primary"
          >
            Add Section
          </button>
        </div>
      </div>
    );
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="template-preview">
        <JSONEditor
          id="template-preview"
          placeholder={selectedTemplate}
          locale={locale}
          height="550px"
          width="100%"
          viewOnly={true}
        />
      </div>
    );
  };

  return (
    <div className={`form-template-manager ${className}`}>
      <div className="manager-header">
        <div className="type-selector">
          {Object.values(FormType).map(type => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`btn ${selectedType === type ? 'btn-primary' : 'btn-secondary'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="mode-selector">
          <button
            onClick={() => {
              setEditMode(true);
              setPreviewMode(false);
            }}
            className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            Edit
          </button>
          <button
            onClick={() => {
              setPreviewMode(true);
              setEditMode(false);
            }}
            className={`btn ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="manager-content">
        {editMode && renderTemplateEditor()}
        {previewMode && renderTemplatePreview()}
      </div>

      <div className="manager-footer">
        {editMode && (
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default FormTemplateManager; 