import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listInventoryService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      skip,
      take: limit,
      select: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true, abbreviation: true } }
          }
        },
        current_stock: true,
        reserved_stock: true,
        available_stock: true,
        average_cost: true,
        total_value: true,
        stock_status: true,
        last_updated: true,
        next_expiry_date: true
      }
    }),
    prisma.inventory.count()
  ]);
  return {
    inventory,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const receiveInventoryService = async (data: Array<{
  item_id: number,
  quantity: number,
  unit_cost: number,
  batch_number?: string,
  expiry_date?: string,
  supplier_id?: number,
  received_date?: string
}>, userId: number) => {
  if (!Array.isArray(data) || data.length === 0) throw { status: 400, code: 'NO_ITEMS', message: 'Danh sách hàng nhập kho không hợp lệ.' };
  const prisma = new PrismaClient();
  const results = [];
  for (const entry of data) {
    const item = await prisma.item.findUnique({ where: { id: entry.item_id } });
    if (!item) throw { status: 404, code: 'ITEM_NOT_FOUND', message: `Không tìm thấy hàng hóa ID ${entry.item_id}` };
    // Tạo batch mới
    const batch = await prisma.inventoryBatch.create({
      data: {
        item_id: entry.item_id,
        batch_number: entry.batch_number,
        initial_quantity: entry.quantity,
        current_quantity: entry.quantity,
        unit_cost: entry.unit_cost,
        received_date: entry.received_date ? new Date(entry.received_date) : new Date(),
        expiry_date: entry.expiry_date ? new Date(entry.expiry_date) : undefined,
        supplier_id: entry.supplier_id
      }
    });
    // Tạo transaction IN
    await prisma.transaction.create({
      data: {
        type: 'IN',
        item_id: entry.item_id,
        batch_id: batch.id,
        quantity: entry.quantity,
        unit_cost: entry.unit_cost,
        processed_by: userId,
        status: 'approved',
        created_at: new Date()
      }
    });
    results.push({ item_id: entry.item_id, batch_id: batch.id, quantity: entry.quantity });
  }
  return { success: true, received: results };
};

export const withdrawInventoryService = async (data: Array<{
  item_id: number,
  quantity: number,
  notes?: string
}>, userId: number) => {
  if (!Array.isArray(data) || data.length === 0) throw { status: 400, code: 'NO_ITEMS', message: 'Danh sách hàng xuất kho không hợp lệ.' };
  const prisma = new PrismaClient();
  const results = [];
  for (const entry of data) {
    let remaining = entry.quantity;
    const batches = await prisma.inventoryBatch.findMany({
      where: { item_id: entry.item_id, current_quantity: { gt: 0 }, status: 'active' },
      orderBy: { received_date: 'asc' }
    });
    if (!batches.length) throw { status: 400, code: 'NO_STOCK', message: `Không còn tồn kho cho hàng hóa ID ${entry.item_id}` };
    for (const batch of batches) {
      if (remaining <= 0) break;
      const takeQty = Math.min(batch.current_quantity, remaining);
      // Trừ batch
      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: { current_quantity: { decrement: takeQty } }
      });
      // Tạo transaction OUT
      await prisma.transaction.create({
        data: {
          type: 'OUT',
          item_id: entry.item_id,
          batch_id: batch.id,
          quantity: takeQty,
          unit_cost: batch.unit_cost,
          processed_by: userId,
          status: 'approved',
          notes: entry.notes,
          created_at: new Date()
        }
      });
      results.push({ item_id: entry.item_id, batch_id: batch.id, quantity: takeQty });
      remaining -= takeQty;
    }
    if (remaining > 0) throw { status: 400, code: 'INSUFFICIENT_STOCK', message: `Không đủ tồn kho cho hàng hóa ID ${entry.item_id}` };
  }
  return { success: true, withdrawn: results };
};

export const adjustInventoryService = async (data: Array<{
  item_id: number,
  quantity: number,
  reason?: string
}>, userId: number) => {
  if (!Array.isArray(data) || data.length === 0) throw { status: 400, code: 'NO_ITEMS', message: 'Danh sách điều chỉnh tồn kho không hợp lệ.' };
  const prisma = new PrismaClient();
  const results = [];
  for (const entry of data) {
    const inventory = await prisma.inventory.findUnique({ where: { item_id: entry.item_id } });
    if (!inventory) throw { status: 404, code: 'NO_INVENTORY', message: `Không có tồn kho cho hàng hóa ID ${entry.item_id}` };
    // Cập nhật tồn kho
    await prisma.inventory.update({
      where: { item_id: entry.item_id },
      data: { current_stock: { increment: entry.quantity } }
    });
    // Tạo transaction ADJUSTMENT
    await prisma.transaction.create({
      data: {
        type: 'ADJUSTMENT',
        item_id: entry.item_id,
        quantity: entry.quantity,
        processed_by: userId,
        status: 'approved',
        notes: entry.reason,
        created_at: new Date()
      }
    });
    results.push({ item_id: entry.item_id, quantity: entry.quantity });
  }
  return { success: true, adjusted: results };
};

export const inventoryHistoryService = async (itemId: number, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { item_id: itemId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        quantity: true,
        unit_cost: true,
        batch_id: true,
        processed_by: true,
        status: true,
        notes: true,
        created_at: true
      }
    }),
    prisma.transaction.count({ where: { item_id: itemId } })
  ]);
  return {
    transactions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}; 