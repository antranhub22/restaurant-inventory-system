import React from 'react';
import BaseForm from './BaseForm';
import { FormType } from '../../types/form-template';

interface ImportFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

const ImportForm: React.FC<ImportFormProps> = ({ onSubmit, className }) => {
  return (
    <BaseForm
      type={FormType.IMPORT}
      onSubmit={onSubmit}
      className={className}
    />
  );
};

export default ImportForm; 