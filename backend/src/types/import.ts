import { Item, Supplier } from '@prisma/client';

export interface ImportItem {
  itemId: number;
  quantity: number;
  unitPrice: number;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}

export interface ImportData {
  date: Date;
  supplierId: number;
  invoiceNumber: string;
  processedById: number;
  items: ImportItem[];
  totalAmount: number;
  notes?: string;
  attachments?: string[];
  status: ImportStatus;
}

export interface ImportWithRelations extends ImportData {
  supplier: Supplier;
  items: (ImportItem & {
    item: Item;
  })[];
}

export enum ImportStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface ImportValidationError {
  field: string;
  message: string;
}

export interface ImportOcrResult {
  invoiceNumber?: string;
  date?: Date;
  supplier?: {
    id?: number;
    name: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  confidence: number;
} 