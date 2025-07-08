export enum FormType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'file';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  name: string;
  type: FormType;
  description?: string;
  sections: FormSection[];
  isDefault?: boolean;
  version?: string;
}

export interface FormData {
  [key: string]: any;
}

export interface FormItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface OCRFormData {
  type: FormType;
  fields: FormData;
  items: FormItem[];
  originalImage?: string;
  status: 'pending' | 'confirmed' | 'rejected';
}