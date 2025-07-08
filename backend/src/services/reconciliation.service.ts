import { PrismaClient } from '@prisma/client';
import { ReconciliationData, ReconciliationItem, ReconciliationStatus, ReconciliationValidationError, ReconciliationReport, ShiftType } from '../types/reconciliation';
import { Redis } from 'ioredis';

class ReconciliationService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  async validateReconciliation(data: ReconciliationData): Promise<ReconciliationValidationError[]> {
    const errors: ReconciliationValidationError[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Ngày đối chiếu không hợp lệ'
      });
    }

    // Kiểm tra bộ phận
    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId }
    });
    if (!department) {
      errors.push({
        field: 'departmentId',
        message: 'Bộ phận không tồn tại'
      });
    }

    // Kiểm tra ca làm việc
    if (!Object.values(ShiftType).includes(data.shiftType)) {
      errors.push({
        field: 'shiftType',
        message: 'Ca làm việc không hợp lệ'
      });
    }

    // Kiểm tra items
    if (!data.items?.length) {
      errors.push({
        field: 'items',
        message: 'Báo cáo phải có ít nhất một mặt hàng'
      });
    } else {
      for (const item of data.items) {
        // Kiểm tra sản phẩm tồn tại
        const product = await this.prisma.item.findUnique({
          where: { id: item.itemId }
        });
        if (!product) {
          errors.push({
            field: `items[${item.itemId}]`,
            message: `Sản phẩm ID ${item.itemId} không tồn tại`
          });
          continue;
        }

        // Kiểm tra số lượng
        if (item.actualStock < 0) {
          errors.push({
            field: `items[${item.itemId}].actualStock`,
            message: 'Số lượng thực tế không thể âm'
          });
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
          errors.push({
            field: `items[${item.itemId}].systemStock`,
            message: 'Số lượng tồn hệ thống không khớp với các giao dịch'
          });
        }

        const calculatedDiscrepancy = item.actualStock - item.systemStock;
        if (Math.abs(calculatedDiscrepancy - item.discrepancy) > 0.001) {
          errors.push({
            field: `items[${item.itemId}].discrepancy`,
            message: 'Chênh lệch không khớp với số liệu'
          });
        }

        const calculatedDiscrepancyRate = item.systemStock !== 0 
          ? (item.discrepancy / item.systemStock) * 100 
          : 0;
        if (Math.abs(calculatedDiscrepancyRate - item.discrepancyRate) > 0.001) {
          errors.push({
            field: `items[${item.itemId}].discrepancyRate`,
            message: 'Tỷ lệ chênh lệch không khớp với số liệu'
          });
        }
      }
    }

    // Kiểm tra trùng lặp
    const existingReconciliation = await this.prisma.reconciliation.findFirst({
      where: {
        date: data.date,
        departmentId: data.departmentId,
        shiftType: data.shiftType,
        NOT: {
          status: ReconciliationStatus.CANCELLED
        }
      }
    });

    if (existingReconciliation) {
      errors.push({
        field: 'general',
        message: 'Đã tồn tại báo cáo đối chiếu cho ca này'
      });
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
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo báo cáo đối chiếu
      const reconciliationRecord = await tx.reconciliation.create({
        data: {
          date: data.date,
          departmentId: data.departmentId,
          shiftType: data.shiftType,
          processedById: data.processedById,
          notes: data.notes,
          status: ReconciliationStatus.PENDING
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

  async approveReconciliation(id: number, approvedById: number) {
    return await this.prisma.$transaction(async (tx) => {
      const reconciliation_data = await tx.reconciliation.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!reconciliation_data) {
        throw new Error('Báo cáo đối chiếu không tồn tại');
      }

      if (reconciliation_data.status !== ReconciliationStatus.PENDING) {
        throw new Error('Báo cáo đối chiếu không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái báo cáo
      const updated = await tx.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.APPROVED,
          approvedById,
          approvedAt: new Date()
        }
      });

      // Xóa cache
      await this.redis.del(`reconciliation:${id}`);

      return updated;
    });
  }

  async rejectReconciliation(id: number, rejectedById: number, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const reconciliation_data = await tx.reconciliation.findUnique({
        where: { id }
      });

      if (!reconciliation_data) {
        throw new Error('Báo cáo đối chiếu không tồn tại');
      }

      if (reconciliation_data.status !== ReconciliationStatus.PENDING) {
        throw new Error('Báo cáo đối chiếu không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái báo cáo
      const updated = await tx.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.REJECTED,
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Xóa cache
      await this.redis.del(`reconciliation:${id}`);

      return updated;
    });
  }

  private async updateCache(reconciliationId: number) {
    const cacheKey = `reconciliation:${reconciliationId}`;
    const reconciliation_data = await this.prisma.reconciliation.findUnique({
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

    if (reconciliation_data) {
      await this.redis.set(cacheKey, JSON.stringify(reconciliation_data), 'EX', 3600); // Cache 1 giờ
    }
  }

  async getReconciliationById(id: number) {
    // Thử lấy từ cache
    const cacheKey = `reconciliation:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Nếu không có trong cache, lấy từ database
    const reconciliation_data = await this.prisma.reconciliation.findUnique({
      where: { id },
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

    if (reconciliation_data) {
      // Cập nhật cache
      await this.redis.set(cacheKey, JSON.stringify(reconciliation_data), 'EX', 3600);
    }

    return reconciliation_data;
  }

  async getReconciliations(filters: {
    status?: ReconciliationStatus;
    departmentId?: number;
    shiftType?: ShiftType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.shiftType) {
      where.shiftType = filters.shiftType;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    return this.prisma.reconciliation.findMany({
      where,
      include: {
        items: {
          include: {
            item: true
          }
        },
        department: true,
        processedBy: true
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  async generateReconciliationReport(filters: {
    startDate: Date;
    endDate: Date;
    departmentId?: number;
    shiftType?: ShiftType;
  }): Promise<ReconciliationReport> {
    const reconciliations = await this.getReconciliations({
      status: ReconciliationStatus.APPROVED,
      ...filters
    });

    // Tính toán thống kê
    const itemStats = new Map<number, {
      itemId: number;
      itemName: string;
      totalDiscrepancy: number;
      totalDiscrepancyValue: number;
      shifts: Map<string, {
        date: Date;
        shiftType: ShiftType;
        discrepancy: number;
        discrepancyRate: number;
        discrepancyValue: number;
      }>;
    }>();

    const shiftStats = new Map<ShiftType, {
      count: number;
      totalDiscrepancyValue: number;
      totalDiscrepancyRate: number;
    }>();

    const deptStats = new Map<number, {
      departmentId: number;
      departmentName: string;
      count: number;
      totalDiscrepancyValue: number;
      totalDiscrepancyRate: number;
    }>();

    const dateStats = new Map<string, {
      date: Date;
      count: number;
      totalDiscrepancyValue: number;
      totalDiscrepancyRate: number;
    }>();

    let totalDiscrepancyValue = 0;

    // Tính toán chi tiết
    for (const reconciliation of reconciliations) {
      // Thống kê theo ca
      const shiftKey = reconciliation.shiftType;
      const shiftStat = shiftStats.get(shiftKey) || {
        count: 0,
        totalDiscrepancyValue: 0,
        totalDiscrepancyRate: 0
      };
      shiftStat.count++;

      // Thống kê theo bộ phận
      const deptKey = reconciliation.departmentId;
      const deptStat = deptStats.get(deptKey) || {
        departmentId: reconciliation.departmentId,
        departmentName: reconciliation.department.name,
        count: 0,
        totalDiscrepancyValue: 0,
        totalDiscrepancyRate: 0
      };
      deptStat.count++;

      // Thống kê theo ngày
      const dateKey = reconciliation.date.toISOString().split('T')[0];
      const dateStat = dateStats.get(dateKey) || {
        date: reconciliation.date,
        count: 0,
        totalDiscrepancyValue: 0,
        totalDiscrepancyRate: 0
      };
      dateStat.count++;

      // Thống kê theo sản phẩm
      for (const item of reconciliation.items) {
        const itemKey = item.itemId;
        const itemStat = itemStats.get(itemKey) || {
          itemId: item.itemId,
          itemName: item.item.name,
          totalDiscrepancy: 0,
          totalDiscrepancyValue: 0,
          shifts: new Map()
        };

        itemStat.totalDiscrepancy += item.discrepancy;
        itemStat.totalDiscrepancyValue += item.discrepancyValue;
        totalDiscrepancyValue += item.discrepancyValue;

        shiftStat.totalDiscrepancyValue += item.discrepancyValue;
        shiftStat.totalDiscrepancyRate += item.discrepancyRate;

        deptStat.totalDiscrepancyValue += item.discrepancyValue;
        deptStat.totalDiscrepancyRate += item.discrepancyRate;

        dateStat.totalDiscrepancyValue += item.discrepancyValue;
        dateStat.totalDiscrepancyRate += item.discrepancyRate;

        // Thống kê theo ca của từng sản phẩm
        const shiftKey = `${reconciliation.date.toISOString()}_${reconciliation.shiftType}`;
        itemStat.shifts.set(shiftKey, {
          date: reconciliation.date,
          shiftType: reconciliation.shiftType,
          discrepancy: item.discrepancy,
          discrepancyRate: item.discrepancyRate,
          discrepancyValue: item.discrepancyValue
        });

        itemStats.set(itemKey, itemStat);
      }

      shiftStats.set(shiftKey, shiftStat);
      deptStats.set(deptKey, deptStat);
      dateStats.set(dateKey, dateStat);
    }

    // Chuyển đổi Map thành mảng để trả về
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      departmentId: filters.departmentId,
      shiftType: filters.shiftType,
      totalDiscrepancyValue,
      items: Array.from(itemStats.values()).map(stat => ({
        itemId: stat.itemId,
        itemName: stat.itemName,
        totalDiscrepancy: stat.totalDiscrepancy,
        totalDiscrepancyValue: stat.totalDiscrepancyValue,
        averageDiscrepancyRate: stat.shifts.size > 0
          ? Array.from(stat.shifts.values()).reduce((sum, s) => sum + s.discrepancyRate, 0) / stat.shifts.size
          : 0,
        shifts: Array.from(stat.shifts.values())
      })),
      summary: {
        byShift: Array.from(shiftStats.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          totalDiscrepancyValue: data.totalDiscrepancyValue,
          averageDiscrepancyRate: data.count > 0 ? data.totalDiscrepancyRate / data.count : 0
        })),
        byDepartment: Array.from(deptStats.values()).map(data => ({
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          count: data.count,
          totalDiscrepancyValue: data.totalDiscrepancyValue,
          averageDiscrepancyRate: data.count > 0 ? data.totalDiscrepancyRate / data.count : 0
        })),
        byDate: Array.from(dateStats.values()).map(data => ({
          date: data.date,
          count: data.count,
          totalDiscrepancyValue: data.totalDiscrepancyValue,
          averageDiscrepancyRate: data.count > 0 ? data.totalDiscrepancyRate / data.count : 0
        }))
      }
    };
  }
}

export default new ReconciliationService(); 