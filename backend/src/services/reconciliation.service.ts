import { PrismaClient, ShiftType, ReconciliationStatus, Prisma } from '@prisma/client';
import { ReconciliationData, ReconciliationItem, ReconciliationReport } from '../types/reconciliation';
import { Redis } from 'ioredis';

class ReconciliationService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  async validateReconciliation(data: ReconciliationData): Promise<string[]> {
    const errors: string[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push('Ngày đối chiếu không hợp lệ');
    }

    // Kiểm tra bộ phận
    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId }
    });
    if (!department) {
      errors.push('Bộ phận không tồn tại');
    }

    // Kiểm tra ca làm việc
    if (!Object.values(ShiftType).includes(data.shiftType as ShiftType)) {
      errors.push('Ca làm việc không hợp lệ');
    }

    // Kiểm tra items
    if (!data.items?.length) {
      errors.push('Báo cáo phải có ít nhất một mặt hàng');
    } else {
      for (const item of data.items) {
        // Kiểm tra sản phẩm tồn tại
        const product = await this.prisma.item.findUnique({
          where: { id: item.itemId }
        });
        if (!product) {
          errors.push(`Sản phẩm ID ${item.itemId} không tồn tại`);
          continue;
        }

        // Kiểm tra số lượng
        if (item.actualStock < 0) {
          errors.push(`Số lượng thực tế không thể âm cho sản phẩm ${product.name}`);
        }

        // Kiểm tra tính toán
        const calculatedSystemStock = 
          item.openingStock + 
          item.received - 
          item.withdrawn - 
          item.sold - 
          item.wasted - 
          item.staffConsumed - 
          item.sampled + 
          item.returned;

        if (Math.abs(calculatedSystemStock - item.systemStock) > 0.001) {
          errors.push(`Số lượng tồn hệ thống không khớp với các giao dịch cho sản phẩm ${product.name}`);
        }

        const calculatedDiscrepancy = item.actualStock - item.systemStock;
        if (Math.abs(calculatedDiscrepancy - item.discrepancy) > 0.001) {
          errors.push(`Chênh lệch không khớp với số liệu cho sản phẩm ${product.name}`);
        }

        const calculatedDiscrepancyRate = item.systemStock !== 0 
          ? (Math.abs(calculatedDiscrepancy) / item.systemStock) * 100 
          : 0;
        if (Math.abs(calculatedDiscrepancyRate - item.discrepancyRate) > 0.001) {
          errors.push(`Tỷ lệ chênh lệch không khớp với số liệu cho sản phẩm ${product.name}`);
        }
      }
    }

    // Kiểm tra trùng lặp
    const existingReconciliation = await this.prisma.reconciliation.findFirst({
      where: {
        date: data.date,
        departmentId: data.departmentId,
        shiftType: data.shiftType as ShiftType,
        NOT: {
          status: ReconciliationStatus.cancelled
        }
      }
    });

    if (existingReconciliation) {
      errors.push('Đã tồn tại báo cáo đối chiếu cho ca này');
    }

    return errors;
  }

  async createReconciliation(data: ReconciliationData) {
    // Validate dữ liệu
    const errors = await this.validateReconciliation(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    // Bắt đầu transaction
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Tạo báo cáo đối chiếu
      const reconciliationRecord = await tx.reconciliation.create({
        data: {
          date: data.date,
          departmentId: data.departmentId,
          shiftType: data.shiftType as ShiftType,
          processedById: data.processedById,
          notes: data.notes,
          status: ReconciliationStatus.pending
        }
      });

      // 2. Tạo chi tiết đối chiếu
      const reconciliationItems = await Promise.all(
        data.items.map(item =>
          tx.reconciliationItem.create({
            data: {
              reconciliationId: reconciliationRecord.id,
              itemId: item.itemId,
              openingStock: item.openingStock,
              received: item.received,
              withdrawn: item.withdrawn,
              sold: item.sold,
              returned: item.returned,
              wasted: item.wasted,
              staffConsumed: item.staffConsumed,
              sampled: item.sampled,
              systemStock: item.systemStock,
              actualStock: item.actualStock,
              discrepancy: item.discrepancy,
              discrepancyRate: item.discrepancyRate,
              discrepancyValue: item.discrepancyValue,
              notes: item.notes
            }
          })
        )
      );

      // 3. Cập nhật cache Redis
      await this.updateCache(reconciliationRecord.id);

      return {
        ...reconciliationRecord,
        items: reconciliationItems
      };
    });
  }

  async generateReport(filters: {
    startDate: Date;
    endDate: Date;
    departmentId?: number;
    shiftType?: ShiftType;
  }): Promise<ReconciliationReport> {
    const reconciliations = await this.prisma.reconciliation.findMany({
      where: {
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        departmentId: filters.departmentId,
        shiftType: filters.shiftType,
        status: ReconciliationStatus.approved
      },
      include: {
        items: {
          include: {
            item: true
          }
        },
        department: true
      }
    });

    // Tính toán thống kê
    const itemStats = new Map<number, {
      itemId: number;
      itemName: string;
      totalQuantity: number;
      totalValue: number;
      reasons: Map<string, { quantity: number; value: number; }>;
    }>();

    const typeStats = new Map<string, { count: number; totalValue: number; }>();
    const deptStats = new Map<number, {
      departmentId: number;
      departmentName: string;
      count: number;
      totalValue: number;
    }>();

    let totalValue = 0;

    // Tính toán chi tiết
    for (const reconciliation of reconciliations) {
      // Thống kê theo loại
      const typeKey = reconciliation.shiftType;
      const typeStat = typeStats.get(typeKey) || { count: 0, totalValue: 0 };
      typeStat.count++;

      // Thống kê theo bộ phận
      const deptKey = reconciliation.departmentId;
      const deptStat = deptStats.get(deptKey) || {
        departmentId: reconciliation.departmentId,
        departmentName: reconciliation.department.name,
        count: 0,
        totalValue: 0
      };
      deptStat.count++;

      // Thống kê theo sản phẩm
      for (const item of reconciliation.items) {
        const itemKey = item.itemId;
        const itemStat = itemStats.get(itemKey) || {
          itemId: item.itemId,
          itemName: item.item.name,
          totalQuantity: 0,
          totalValue: 0,
          reasons: new Map()
        };

        itemStat.totalQuantity += Math.abs(item.discrepancy);
        itemStat.totalValue += item.discrepancyValue;
        totalValue += item.discrepancyValue;
        typeStat.totalValue += item.discrepancyValue;
        deptStat.totalValue += item.discrepancyValue;

        // Thống kê theo lý do
        const reasonKey = item.discrepancy > 0 ? 'surplus' : 'shortage';
        const reasonStat = itemStat.reasons.get(reasonKey) || { quantity: 0, value: 0 };
        reasonStat.quantity += Math.abs(item.discrepancy);
        reasonStat.value += Math.abs(item.discrepancyValue);
        itemStat.reasons.set(reasonKey, reasonStat);

        itemStats.set(itemKey, itemStat);
      }

      typeStats.set(typeKey, typeStat);
      deptStats.set(deptKey, deptStat);
    }

    // Chuyển đổi Map thành mảng để trả về
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      departmentId: filters.departmentId,
      shiftType: filters.shiftType,
      totalValue,
      items: Array.from(itemStats.values()).map(stat => ({
        itemId: stat.itemId,
        itemName: stat.itemName,
        totalQuantity: stat.totalQuantity,
        totalValue: stat.totalValue,
        reasons: Array.from(stat.reasons.entries()).map(([type, data]) => ({
          type,
          quantity: data.quantity,
          value: data.value
        }))
      })),
      summary: {
        byType: Array.from(typeStats.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          totalValue: data.totalValue
        })),
        byDepartment: Array.from(deptStats.values())
      }
    };
  }

  private async updateCache(reconciliationId: number) {
    const cacheKey = `reconciliation:${reconciliationId}`;
    const reconciliation = await this.prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        items: {
          include: {
            item: true
          }
        },
        department: true,
        processedBy: true
      }
    });

    if (reconciliation) {
      await this.redis.set(cacheKey, JSON.stringify(reconciliation), 'EX', 3600); // Cache 1 giờ
    }
  }
}

export default new ReconciliationService(); 