export interface SampleItem {
  id: number;
  name: string;
  unit: string;
  category: string;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  unit_cost: number;
}

export interface SampleReconciliation {
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

export interface SampleData {
  templates: Record<string, any>;
  sample_reconciliation: SampleReconciliation[];
  sample_items: SampleItem[];
} 