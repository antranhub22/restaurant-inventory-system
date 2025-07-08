import { Prisma } from '@prisma/client';

// Mở rộng type PrismaClient để bao gồm các model mới
declare module '@prisma/client' {
  export interface PrismaClient {
    formTemplate: Prisma.FormTemplateDelegate<DefaultArgs>;
    formTemplateHistory: Prisma.FormTemplateHistoryDelegate<DefaultArgs>;
    formConfig: Prisma.FormConfigDelegate<DefaultArgs>;
    customField: Prisma.CustomFieldDelegate<DefaultArgs>;
  }
} 