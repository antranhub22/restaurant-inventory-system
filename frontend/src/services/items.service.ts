import { api } from '../utils/api';

export interface Item {
  id: number;
  name: string;
  categoryId: number;
  unit: string;
  unitCost?: number;
  minStock: number;
  maxStock?: number;
  expiryDays?: number;
  aliases: string[];
  barcode?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    description?: string;
    colorCode?: string;
  };
  primarySupplier?: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  inventory?: {
    itemId: number;
    currentStock: number;
    reservedStock: number;
    lastUpdated: string;
  };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  colorCode?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  isActive: boolean;
  notes?: string;
}

export interface CreateItemRequest {
  name: string;
  categoryId: number;
  unit: string;
  unitCost?: number;
  minStock?: number;
  maxStock?: number;
  expiryDays?: number;
  aliases?: string[];
  barcode?: string;
  description?: string;
  primarySupplierId?: number;
  secondarySupplierId?: number;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  isActive?: boolean;
}

class ItemsService {
  // Get all items
  async getAllItems(): Promise<Item[]> {
    const response = await api.get('/items');
    return response.data;
  }

  // Get item by ID
  async getItemById(id: number): Promise<Item> {
    const response = await api.get(`/items/${id}`);
    return response.data;
  }

  // Create new item
  async createItem(itemData: CreateItemRequest): Promise<Item> {
    const response = await api.post('/items', itemData);
    return response.data;
  }

  // Update item
  async updateItem(id: number, itemData: UpdateItemRequest): Promise<Item> {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  }

  // Delete item (soft delete)
  async deleteItem(id: number): Promise<{ message: string; item: Item }> {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/items/categories');
    return response.data;
  }

  // Get suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get('/items/suppliers');
    return response.data;
  }
}

export default new ItemsService(); 