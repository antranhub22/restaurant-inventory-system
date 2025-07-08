import React from 'react';
import BaseForm from './BaseForm';
import { FormType } from '../../types/form-template';

interface AdjustmentFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

const AdjustmentForm: React.FC<AdjustmentFormProps> = ({ onSubmit, className }) => {
  return (
    <BaseForm
      type={FormType.ADJUSTMENT}
      onSubmit={onSubmit}
      className={className}
    />
  );
};

export default AdjustmentForm; 