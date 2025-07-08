export interface LossAnalysis {
  category: string;
  value: number;
}

export interface DepartmentPerformance {
  department: string;
  efficiency: number;
  issues: number;
  last_reconciliation: string;
}

export interface InventoryTrend {
  date: string;
  value: number;
}

export interface DashboardStats {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  critical_alerts: number;
  loss_rate: number;
  accuracy: number;
}

export interface MockupData {
  dashboard_stats: DashboardStats;
  alert_samples: Array<{
    id: number;
    message: string;
    severity: string;
    created_at: string;
  }>;
  inventory_trend: InventoryTrend[];
  loss_analysis: LossAnalysis[];
  department_performance: DepartmentPerformance[];
} 