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

export interface EditItemForm {
  name: string;
  category_id: number;
  unit_id: number;
  unit_cost: number;
  selling_price?: string;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  description: string;
} 