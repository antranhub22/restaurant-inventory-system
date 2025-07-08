import { Item, User } from '@prisma/client';

export interface ReturnItem {
  itemId: number;
  quantity: number;
  condition: ItemCondition;
  originalExportId?: number;
  notes?: string;
}

export interface ReturnData {
  date: Date;
  departmentId: number;
  reason: ReturnReason;
  processedById: number;
  items: ReturnItem[];
  notes?: string;
  attachments?: string[];
  status: ReturnStatus;
}

export interface ReturnWithRelations extends ReturnData {
  items: (ReturnItem & {
    item: Item;
  })[];
  processedBy: User;
}

export enum ReturnReason {
  EXCESS = 'excess',           // Dư thừa sau ca
  DEFECTIVE = 'defective',     // Chất lượng không đạt
  MENU_CHANGE = 'menu_change', // Thay đổi menu
  EXPIRED = 'expired',         // Hết hạn
  OTHER = 'other'             // Khác
}

export enum ReturnStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ItemCondition {
  GOOD = 'good',       // Còn tốt
  FAIR = 'fair',       // Tạm được
  POOR = 'poor',       // Kém
  DAMAGED = 'damaged', // Hỏng
  EXPIRED = 'expired'  // Hết hạn
}

export interface ReturnValidationError {
  field: string;
  message: string;
} 