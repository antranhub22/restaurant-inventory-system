import type { Prisma } from '@prisma/client';

export type FormType = 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT';

export interface FormUpdate {
  type: 'UPDATE' | 'DELETE';
  formType: string;
  formId: string;
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
  id: string;
  name: string;
  type: FormType;
  sections: Record<string, any>;
  isDefault: boolean;
  version?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormConfig {
  id: string;
  type: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  options?: Record<string, any>;
  validation?: Record<string, any>;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FormTemplateWithHistory = FormTemplate & {
  history: Array<{
    id: string;
    formTemplateId: string;
    structure: Record<string, any>;
    changedBy?: string;
    changeNote?: string;
    createdAt: Date;
  }>;
}; 