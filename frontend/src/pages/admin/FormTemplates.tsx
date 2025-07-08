import React from 'react';
import FormTemplateManager from '../../components/admin/FormTemplateManager';
import { FormProvider } from '../../contexts/FormContext';

const FormTemplatesPage: React.FC = () => {
  return (
    <div className="form-templates-page">
      <div className="page-header">
        <h1>Form Templates</h1>
        <p>Manage form templates for inventory operations</p>
      </div>
      
      <FormProvider>
        <FormTemplateManager />
      </FormProvider>
    </div>
  );
};

export default FormTemplatesPage; 