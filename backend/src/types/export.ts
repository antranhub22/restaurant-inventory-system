import { Item, User } from '@prisma/client';

export interface ExportItem {
  itemId: number;
  quantity: number;
  currentStock: number;
  notes?: string;
}

export interface ExportData {
  date: Date;
  purpose: ExportPurpose;
  departmentId: number;
  processedById: number;
  items: ExportItem[];
  notes?: string;
  attachments?: string[];
  status: ExportStatus;
}

export interface ExportWithRelations extends ExportData {
  items: (ExportItem & {
    item: Item;
  })[];
  processedBy: User;
}

export enum ExportPurpose {
  PRODUCTION = 'production',    // Sản xuất
  SALE = 'sale',               // Bán hàng
  DAMAGE = 'damage',           // Hỏng hóc
  RETURN = 'return',           // Trả nhà cung cấp
  TRANSFER = 'transfer'        // Chuyển kho
}

export enum ExportStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface ExportValidationError {
  field: string;
  message: string;
} 