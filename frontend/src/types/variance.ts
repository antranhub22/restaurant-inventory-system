// Variance Report Types - Aligned with backend schema

export interface VarianceData {
  id: number;
  itemId: number;
  itemName: string;
  department: string;
  shiftDate: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  
  // Expected quantities (from system calculations)
  expectedStock: number;
  expectedWithdrawn: number;
  expectedSold: number;
  expectedReturned: number;
  expectedWasted: number;
  expectedStaffConsumed: number;
  expectedSampled: number;
  
  // Actual quantities (from physical count/reconciliation)
  actualStock: number;
  actualWithdrawn: number;
  actualSold: number;
  actualReturned: number;
  actualWasted: number;
  actualStaffConsumed: number;
  actualSampled: number;
  
  // Calculated variances
  stockVariance: number;
  withdrawnVariance: number;
  soldVariance: number;
  returnedVariance: number;
  wastedVariance: number;
  staffConsumedVariance: number;
  sampledVariance: number;
  
  // Variance percentages
  stockVariancePercent: number;
  withdrawnVariancePercent: number;
  soldVariancePercent: number;
  returnedVariancePercent: number;
  wastedVariancePercent: number;
  staffConsumedVariancePercent: number;
  sampledVariancePercent: number;
  
  // Monetary impact
  stockVarianceValue: number;
  withdrawnVarianceValue: number;
  soldVarianceValue: number;
  returnedVarianceValue: number;
  wastedVarianceValue: number;
  staffConsumedVarianceValue: number;
  sampledVarianceValue: number;
  totalVarianceValue: number;
  
  // Metadata
  status: 'pending' | 'approved' | 'investigation' | 'critical' | 'resolved';
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  resolutionNotes?: string;
  
  // Audit trail
  createdAt: string;
  createdBy: number;
  reviewedAt?: string;
  reviewedBy?: number;
  approvedAt?: string;
  approvedBy?: number;
}

export interface VarianceFilter {
  startDate: string;
  endDate: string;
  departmentId?: number;
  shiftType?: 'morning' | 'afternoon' | 'evening' | 'night';
  status?: 'pending' | 'approved' | 'investigation' | 'critical' | 'resolved';
  alertLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  varianceType?: 'all' | 'positive' | 'negative' | 'critical';
  itemId?: number;
}

export interface VarianceStats {
  totalVariances: number;
  positiveVariances: number;
  negativeVariances: number;
  criticalVariances: number;
  pendingVariances: number;
  totalVarianceValue: number;
  averageVariancePercent: number;
}

export interface VarianceTrend {
  date: string;
  totalVariances: number;
  totalValue: number;
  criticalCount: number;
  averagePercent: number;
}

export interface VarianceByDepartment {
  departmentId: number;
  departmentName: string;
  varianceCount: number;
  totalVarianceValue: number;
  criticalCount: number;
  averageVariancePercent: number;
}

export interface VarianceByReason {
  reason: string;
  count: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

export interface VarianceByItem {
  itemId: number;
  itemName: string;
  itemSku: string;
  categoryName: string;
  varianceCount: number;
  totalVarianceValue: number;
  averageVariancePercent: number;
  lastVarianceDate: string;
}

export interface VarianceReport {
  filters: VarianceFilter;
  stats: VarianceStats;
  trend: VarianceTrend[];
  byDepartment: VarianceByDepartment[];
  byReason: VarianceByReason[];
  byItem: VarianceByItem[];
  variances: VarianceData[];
  generatedAt: string;
  generatedBy: number;
}

// API Response Types
export interface VarianceApiResponse {
  success: boolean;
  data: VarianceReport;
  message?: string;
}

export interface VarianceActionRequest {
  varianceId: number;
  action: 'approve' | 'reject' | 'investigate';
  notes?: string;
  resolutionNotes?: string;
}

export interface VarianceActionResponse {
  success: boolean;
  data: VarianceData;
  message: string;
}

// Reconciliation Integration Types (matching backend schema)
export interface ReconciliationVariance {
  reconciliationId: number;
  department: string;
  itemId: number;
  shiftDate: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  withdrawn: number;
  sold: number;
  returned: number;
  wasted: number;
  staffConsumed: number;
  sampled: number;
  discrepancy: number;
  discrepancyRate: number;
  discrepancyValue: number;
  status: 'pending' | 'acceptable' | 'warning' | 'investigation' | 'critical' | 'resolved';
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  autoApproved: boolean;
}

// All types are exported via their interface declarations above 