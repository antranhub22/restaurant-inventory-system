import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listItemsService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        unit_cost: true,
        selling_price: true,
        min_stock: true,
        max_stock: true,
        sku: true,
        barcode: true,
        is_active: true
      }
    }),
    prisma.item.count()
  ]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const createItemService = async (data: {
  name: string,
  category_id?: number,
  unit_id: number,
  unit_cost?: number,
  selling_price?: number,
  min_stock?: number,
  max_stock?: number,
  sku?: string,
  barcode?: string,
  is_active?: boolean
}) => {
  if (!data.name || !data.unit_id) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Tên và đơn vị là bắt buộc.' };
  if (data.sku) {
    const skuExists = await prisma.item.findUnique({ where: { sku: data.sku } });
    if (skuExists) throw { status: 409, code: 'SKU_EXISTS', message: 'SKU đã tồn tại.' };
  }
  const item = await prisma.item.create({
    data: {
      name: data.name,
      category_id: data.category_id,
      unit_id: data.unit_id,
      unit_cost: data.unit_cost,
      selling_price: data.selling_price,
      min_stock: data.min_stock,
      max_stock: data.max_stock,
      sku: data.sku,
      barcode: data.barcode,
      is_active: data.is_active ?? true
    },
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
      unit_cost: true,
      selling_price: true,
      min_stock: true,
      max_stock: true,
      sku: true,
      barcode: true,
      is_active: true
    }
  });
  return item;
};

export const updateItemService = async (id: number, data: {
  name?: string,
  category_id?: number,
  unit_id?: number,
  unit_cost?: number,
  selling_price?: number,
  min_stock?: number,
  max_stock?: number,
  sku?: string,
  barcode?: string,
  is_active?: boolean
}) => {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Không tìm thấy hàng hóa.' };
  if (data.sku && data.sku !== item.sku) {
    const skuExists = await prisma.item.findUnique({ where: { sku: data.sku } });
    if (skuExists) throw { status: 409, code: 'SKU_EXISTS', message: 'SKU đã tồn tại.' };
  }
  const updated = await prisma.item.update({
    where: { id },
    data: {
      name: data.name,
      category_id: data.category_id,
      unit_id: data.unit_id,
      unit_cost: data.unit_cost,
      selling_price: data.selling_price,
      min_stock: data.min_stock,
      max_stock: data.max_stock,
      sku: data.sku,
      barcode: data.barcode,
      is_active: data.is_active
    },
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
      unit_cost: true,
      selling_price: true,
      min_stock: true,
      max_stock: true,
      sku: true,
      barcode: true,
      is_active: true
    }
  });
  return updated;
};

export const deleteItemService = async (id: number) => {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Không tìm thấy hàng hóa.' };
  await prisma.item.delete({ where: { id } });
  return { id };
}; 