export interface FormField {
  label: string;
  field_name: string;
  type: string;
  required: boolean;
  example?: string;
  options?: string[];
  columns?: Array<{
    name: string;
    type: string;
  }>;
}

export interface Template {
  title: string;
  fields: FormField[];
  sample_data?: Record<string, any>;
}

export interface Templates {
  withdrawal_slip_template: Template;
  return_slip_template: Template;
  waste_report_template: Template;
  daily_reconciliation_template: Template;
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category_id: number;
  unit_id: number;
  unit_cost: number;
  selling_price?: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  description?: string;
  is_perishable: boolean;
  is_active: boolean;
  aliases: string[];
}

export interface Transaction {
  id: number;
  transaction_number: string;
  item_id: number;
  type: string;
  quantity: number;
  total_value: number;
  department: string;
  created_at: string;
  notes?: string;
}

export interface Reconciliation {
  id: number;
  department: string;
  item_id: number;
  shift_date: string;
  shift_type: string;
  withdrawn: number;
  sold: number;
  returned: number;
  wasted: number;
  staff_consumed: number;
  sampled: number;
  status: 'resolved' | 'investigation' | 'pending';
}

export interface Receipt {
  id: number;
  supplier: string;
  type: string;
  image: string;
}

export interface DashboardStats {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  critical_alerts: number;
  loss_rate: number;
  accuracy: number;
}

export interface AlertSample {
  id: number;
  message: string;
  severity: string;
  created_at: string;
}

export interface InventoryTrend {
  date: string;
  value: number;
}

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

export interface MockupData {
  dashboard_stats: DashboardStats;
  alert_samples: AlertSample[];
  inventory_trend: InventoryTrend[];
  loss_analysis: LossAnalysis[];
  department_performance: DepartmentPerformance[];
}

export interface SampleData {
  templates: Templates;
  units: Unit[];
  categories: Category[];
  sample_items: Item[];
  sample_transactions: Transaction[];
  sample_reconciliation: Reconciliation[];
  sample_receipts: Receipt[];
  mockup_data: MockupData;
} 