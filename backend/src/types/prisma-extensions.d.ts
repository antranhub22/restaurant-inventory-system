import { Prisma } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type FormStructure = Record<string, any>;
    type FormConfig = Record<string, any>;
    type FieldOptions = Record<string, any>;
    type FieldValidation = Record<string, any>;
  }
}

declare module '@prisma/client' {
  export interface PrismaClient {
    formTemplate: Prisma.FormTemplateDelegate<DefaultArgs>;
    formTemplateHistory: Prisma.FormTemplateHistoryDelegate<DefaultArgs>;
    formConfig: Prisma.FormConfigDelegate<DefaultArgs>;
    customField: Prisma.CustomFieldDelegate<DefaultArgs>;
  }
} 