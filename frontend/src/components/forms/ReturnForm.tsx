import React from 'react';
import BaseForm from './BaseForm';
import { FormType } from '../../types/form-template';

interface ReturnFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

const ReturnForm: React.FC<ReturnFormProps> = ({ onSubmit, className }) => {
  return (
    <BaseForm
      type={FormType.RETURN}
      onSubmit={onSubmit}
      className={className}
    />
  );
};

export default ReturnForm; 