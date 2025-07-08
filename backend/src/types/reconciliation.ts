import { Item, User } from '@prisma/client';

export interface ReconciliationItem {
  itemId: number;
  openingStock: number;
  received: number;
  withdrawn: number;
  sold: number;
  returned: number;
  wasted: number;
  staffConsumed: number;
  sampled: number;
  systemStock: number;
  actualStock: number;
  discrepancy: number;
  discrepancyRate: number;
  discrepancyValue: number;
  notes?: string;
}

export interface ReconciliationData {
  date: Date;
  departmentId: number;
  shiftType: ShiftType;
  processedById: number;
  items: ReconciliationItem[];
  notes?: string;
  status: ReconciliationStatus;
}

export interface ReconciliationWithRelations extends ReconciliationData {
  items: (ReconciliationItem & {
    item: Item;
  })[];
  processedBy: User;
}

export enum ShiftType {
  MORNING = 'morning',     // 6:00-14:00
  AFTERNOON = 'afternoon', // 14:00-22:00
  EVENING = 'evening',     // 22:00-6:00
  FULL_DAY = 'full_day'   // Cả ngày
}

export enum ReconciliationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface ReconciliationValidationError {
  field: string;
  message: string;
}

export interface ReconciliationReport {
  startDate: Date;
  endDate: Date;
  departmentId?: number;
  shiftType?: ShiftType;
  totalDiscrepancyValue: number;
  items: {
    itemId: number;
    itemName: string;
    totalDiscrepancy: number;
    totalDiscrepancyValue: number;
    averageDiscrepancyRate: number;
    shifts: {
      date: Date;
      shiftType: ShiftType;
      discrepancy: number;
      discrepancyRate: number;
      discrepancyValue: number;
    }[];
  }[];
  summary: {
    byShift: {
      shiftType: ShiftType;
      count: number;
      totalDiscrepancyValue: number;
      averageDiscrepancyRate: number;
    }[];
    byDepartment?: {
      departmentId: number;
      departmentName: string;
      count: number;
      totalDiscrepancyValue: number;
      averageDiscrepancyRate: number;
    }[];
    byDate: {
      date: Date;
      count: number;
      totalDiscrepancyValue: number;
      averageDiscrepancyRate: number;
    }[];
  };
} 