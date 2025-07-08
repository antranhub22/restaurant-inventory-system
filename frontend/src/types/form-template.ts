export enum FormType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  defaultValue?: any;
  readOnly?: boolean;
  subFields?: FormField[]; // For array/object type fields
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id?: string;
  name: string;
  type: FormType;
  sections: FormSection[];
  isDefault?: boolean;
  version?: string;
  description?: string;
} 