import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { FormType } from '../../types/form-template';
import AdjustmentPreview from './AdjustmentPreview';

interface AdjustmentFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

const AdjustmentForm: React.FC<AdjustmentFormProps> = ({ onSubmit, className }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const handleBaseFormSubmit = (data: any) => {
    setFormData(data);
    setShowPreview(true);
  };

  const handleConfirm = () => {
    onSubmit(formData);
    setShowPreview(false);
    setFormData(null);
  };

  if (showPreview && formData) {
    return (
      <AdjustmentPreview
        data={formData}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <BaseForm
      type={FormType.ADJUSTMENT}
      onSubmit={handleBaseFormSubmit}
      className={className}
    />
  );
};

export default AdjustmentForm; 