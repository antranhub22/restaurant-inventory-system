import { PrismaClient } from '@prisma/client';
import { WasteData, WasteItem, WasteStatus, WasteValidationError, WasteReport } from '../types/waste';
import { Redis } from 'ioredis';

class WasteService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  async validateWaste(data: WasteData): Promise<WasteValidationError[]> {
    const errors: WasteValidationError[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Ngày báo cáo không hợp lệ'
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

    // Kiểm tra mô tả
    if (!data.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Vui lòng cung cấp mô tả chi tiết'
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
        if (item.quantity <= 0) {
          errors.push({
            field: `items[${item.itemId}].quantity`,
            message: 'Số lượng phải lớn hơn 0'
          });
        }

        // Kiểm tra giá trị ước tính
        if (item.estimatedValue <= 0) {
          errors.push({
            field: `items[${item.itemId}].estimatedValue`,
            message: 'Giá trị ước tính phải lớn hơn 0'
          });
        }

        // Kiểm tra lý do
        if (!item.reason?.trim()) {
          errors.push({
            field: `items[${item.itemId}].reason`,
            message: 'Vui lòng cung cấp lý do hao hụt'
          });
        }
      }
    }

    return errors;
  }

  async createWaste(data: WasteData) {
    // Validate dữ liệu
    const errors = await this.validateWaste(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    // Bắt đầu transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo báo cáo hao hụt
      const wasteRecord = await tx.waste.create({
        data: {
          date: data.date,
          departmentId: data.departmentId,
          wasteType: data.wasteType,
          description: data.description,
          processedById: data.processedById,
          witnesses: data.witnesses || [],
          evidencePhotos: data.evidencePhotos || [],
          notes: data.notes,
          status: WasteStatus.PENDING
        }
      });

      // 2. Tạo chi tiết hao hụt
      const wasteItems = await Promise.all(
        data.items.map(item =>
          tx.wasteItem.create({
            data: {
              wasteId: wasteRecord.id,
              itemId: item.itemId,
              quantity: item.quantity,
              estimatedValue: item.estimatedValue,
              reason: item.reason,
              notes: item.notes
            }
          })
        )
      );

      // 3. Cập nhật cache Redis
      await this.updateCache(wasteRecord.id);

      return {
        ...wasteRecord,
        items: wasteItems
      };
    });
  }

  async approveWaste(id: number, approvedById: number) {
    return await this.prisma.$transaction(async (tx) => {
      const waste_data = await tx.waste.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!waste_data) {
        throw new Error('Báo cáo hao hụt không tồn tại');
      }

      if (waste_data.status !== WasteStatus.PENDING) {
        throw new Error('Báo cáo hao hụt không ở trạng thái chờ duyệt');
      }

      // Cập nhật tồn kho
      for (const item of waste_data.items) {
        const inventory = await tx.inventory.findUnique({
          where: { itemId: item.itemId }
        });

        if (!inventory) {
          throw new Error(`Không tìm thấy tồn kho cho sản phẩm ID ${item.itemId}`);
        }

        if (item.quantity > inventory.currentStock) {
          throw new Error(`Số lượng hao hụt vượt quá tồn kho cho sản phẩm ID ${item.itemId}`);
        }

        // Cập nhật tồn kho
        await tx.inventory.update({
          where: { itemId: item.itemId },
          data: {
            currentStock: inventory.currentStock - item.quantity,
            lastUpdated: new Date()
          }
        });

        // Tạo transaction log
        await tx.transaction.create({
          data: {
            type: 'OUT',
            itemId: item.itemId,
            quantity: item.quantity,
            processedById: approvedById,
            notes: `Hao hụt theo báo cáo ${waste_data.id}`
          }
        });
      }

      // Cập nhật trạng thái báo cáo
      const updated = await tx.waste.update({
        where: { id },
        data: {
          status: WasteStatus.APPROVED,
          approvedById,
          approvedAt: new Date()
        }
      });

      // Xóa cache
      await this.redis.del(`waste:${id}`);

      return updated;
    });
  }

  async rejectWaste(id: number, rejectedById: number, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const waste_data = await tx.waste.findUnique({
        where: { id }
      });

      if (!waste_data) {
        throw new Error('Báo cáo hao hụt không tồn tại');
      }

      if (waste_data.status !== WasteStatus.PENDING) {
        throw new Error('Báo cáo hao hụt không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái báo cáo
      const updated = await tx.waste.update({
        where: { id },
        data: {
          status: WasteStatus.REJECTED,
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Xóa cache
      await this.redis.del(`waste:${id}`);

      return updated;
    });
  }

  private async updateCache(wasteId: number) {
    const cacheKey = `waste:${wasteId}`;
    const waste_data = await this.prisma.waste.findUnique({
      where: { id: wasteId },
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

    if (waste_data) {
      await this.redis.set(cacheKey, JSON.stringify(waste_data), 'EX', 3600); // Cache 1 giờ
    }
  }

  async getWasteById(id: number) {
    // Thử lấy từ cache
    const cacheKey = `waste:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Nếu không có trong cache, lấy từ database
    const waste_data = await this.prisma.waste.findUnique({
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

    if (waste_data) {
      // Cập nhật cache
      await this.redis.set(cacheKey, JSON.stringify(waste_data), 'EX', 3600);
    }

    return waste_data;
  }

  async getWastes(filters: {
    status?: WasteStatus;
    departmentId?: number;
    wasteType?: string;
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

    if (filters.wasteType) {
      where.wasteType = filters.wasteType;
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

    return this.prisma.waste.findMany({
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

  async generateWasteReport(filters: {
    startDate: Date;
    endDate: Date;
    departmentId?: number;
    wasteType?: string;
  }): Promise<WasteReport> {
    const wastes = await this.getWastes({
      status: WasteStatus.APPROVED,
      ...filters
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
    for (const waste of wastes) {
      // Thống kê theo loại hao hụt
      const typeKey = waste.wasteType;
      const typeStat = typeStats.get(typeKey) || { count: 0, totalValue: 0 };
      typeStat.count++;

      // Thống kê theo bộ phận
      const deptKey = waste.departmentId;
      const deptStat = deptStats.get(deptKey) || {
        departmentId: waste.departmentId,
        departmentName: waste.department.name,
        count: 0,
        totalValue: 0
      };
      deptStat.count++;

      // Thống kê theo sản phẩm
      for (const item of waste.items) {
        const itemKey = item.itemId;
        const itemStat = itemStats.get(itemKey) || {
          itemId: item.itemId,
          itemName: item.item.name,
          totalQuantity: 0,
          totalValue: 0,
          reasons: new Map()
        };

        itemStat.totalQuantity += item.quantity;
        itemStat.totalValue += item.estimatedValue;
        totalValue += item.estimatedValue;
        typeStat.totalValue += item.estimatedValue;
        deptStat.totalValue += item.estimatedValue;

        // Thống kê theo lý do
        const reasonKey = waste.wasteType;
        const reasonStat = itemStat.reasons.get(reasonKey) || { quantity: 0, value: 0 };
        reasonStat.quantity += item.quantity;
        reasonStat.value += item.estimatedValue;
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
      wasteType: filters.wasteType as any,
      totalValue,
      items: Array.from(itemStats.values()).map(stat => ({
        itemId: stat.itemId,
        itemName: stat.itemName,
        totalQuantity: stat.totalQuantity,
        totalValue: stat.totalValue,
        reasons: Array.from(stat.reasons.entries()).map(([type, data]) => ({
          type: type as any,
          quantity: data.quantity,
          value: data.value
        }))
      })),
      summary: {
        byType: Array.from(typeStats.entries()).map(([type, data]) => ({
          type: type as any,
          count: data.count,
          totalValue: data.totalValue
        })),
        byDepartment: Array.from(deptStats.values())
      }
    };
  }
}

export default new WasteService(); 