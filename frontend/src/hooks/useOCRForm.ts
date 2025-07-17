import { useState } from 'react';
import { FormType } from '../types/form-template';
import api from '../utils/api';

interface OCRFormData {
  formId: string;
  type: FormType;
  fields: Array<{
    name: string;
    value: any;
    confidence: number;
    needsReview: boolean;
    alternatives?: string[];
  }>;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
    confidence: number;
    needsReview: boolean;
  }>;
  confidence: number;
  originalImage?: string;
}

interface Correction {
  fieldId: string;
  oldValue: any;
  newValue: any;
  confidence: number;
}

interface UseOCRFormReturn {
  processOCRForm: (imageFile: File, formType: FormType) => Promise<OCRFormData>;
  confirmOCRForm: (formId: string, corrections: Correction[]) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const useOCRForm = (): UseOCRFormReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const processOCRForm = async (imageFile: File, formType: FormType): Promise<OCRFormData> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('formType', formType);

      const response = await api.post('/ocr-form/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (err: any) {
      let errorMessage = 'Lỗi không xác định';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmOCRForm = async (formId: string, corrections: Correction[]): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ocr-form/confirm', {
        formId,
        corrections,
      });
      return response.data.data;
    } catch (err: any) {
      let errorMessage = 'Lỗi không xác định';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processOCRForm,
    confirmOCRForm,
    isLoading,
    error,
    clearError,
  };
};

export default useOCRForm;