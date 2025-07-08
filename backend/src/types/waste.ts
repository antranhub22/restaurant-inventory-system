import { Item, User } from '@prisma/client';

export interface WasteItem {
  itemId: number;
  quantity: number;
  estimatedValue: number;
  reason: string;
  notes?: string;
}

export interface WasteData {
  date: Date;
  departmentId: number;
  wasteType: WasteType;
  description: string;
  processedById: number;
  items: WasteItem[];
  witnesses?: string[];
  evidencePhotos?: string[];
  notes?: string;
  status: WasteStatus;
}

export interface WasteWithRelations extends WasteData {
  items: (WasteItem & {
    item: Item;
  })[];
  processedBy: User;
}

export enum WasteType {
  DAMAGE = 'damage',           // Hỏng hóc
  EXPIRY = 'expiry',          // Hết hạn
  BREAKAGE = 'breakage',      // Vỡ/đổ
  NATURAL_LOSS = 'natural',   // Hao hụt tự nhiên
  COOKING_LOSS = 'cooking',   // Hao hụt chế biến
  QUALITY = 'quality',        // Chất lượng không đạt
  OTHER = 'other'             // Khác
}

export enum WasteStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface WasteValidationError {
  field: string;
  message: string;
}

export interface WasteReport {
  startDate: Date;
  endDate: Date;
  departmentId?: number;
  wasteType?: WasteType;
  totalValue: number;
  items: {
    itemId: number;
    itemName: string;
    totalQuantity: number;
    totalValue: number;
    reasons: {
      type: WasteType;
      quantity: number;
      value: number;
    }[];
  }[];
  summary: {
    byType: {
      type: WasteType;
      count: number;
      totalValue: number;
    }[];
    byDepartment?: {
      departmentId: number;
      departmentName: string;
      count: number;
      totalValue: number;
    }[];
  };
} 