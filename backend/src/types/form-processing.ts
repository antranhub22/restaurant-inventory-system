import { FormType } from './form-template';

export interface FormField {
  name: string;
  value: string | number;
  confidence: number;
  needsReview: boolean;
  alternatives?: string[];
}

export interface ProcessedForm {
  type: FormType;
  confidence: number;
  fields: FormField[];
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
    confidence: number;
    needsReview: boolean;
  }>;
  needsReview: boolean;
}