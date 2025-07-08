import React from 'react';
import BaseForm from './BaseForm';
import { FormType } from '../../types/form-template';

interface ExportFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

const ExportForm: React.FC<ExportFormProps> = ({ onSubmit, className }) => {
  return (
    <BaseForm
      type={FormType.EXPORT}
      onSubmit={onSubmit}
      className={className}
    />
  );
};

export default ExportForm; 