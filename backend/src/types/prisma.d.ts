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
  export enum Role {
    owner = 'owner',
    manager = 'manager',
    supervisor = 'supervisor',
    staff = 'staff'
  }

  export enum ShiftType {
    morning = 'morning',
    afternoon = 'afternoon',
    evening = 'evening',
    full_day = 'full_day'
  }

  export enum ReconciliationStatus {
    draft = 'draft',
    pending = 'pending',
    approved = 'approved',
    rejected = 'rejected',
    cancelled = 'cancelled'
  }
} 