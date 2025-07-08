import { PrismaClient } from '@prisma/client';
import { ExportData, ExportItem, ExportStatus, ExportValidationError } from '../types/export';
import RedisService from './redis.service';

class ExportService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = RedisService.getInstance();
  }

  async validateExport(data: ExportData): Promise<ExportValidationError[]> {
    const errors: ExportValidationError[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Ngày xuất không hợp lệ'
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

    // Kiểm tra items
    if (!data.items?.length) {
      errors.push({
        field: 'items',
        message: 'Phiếu xuất phải có ít nhất một mặt hàng'
      });
    } else {
      for (const item of data.items) {
        // Kiểm tra sản phẩm tồn tại
        const inventory = await this.prisma.inventory.findUnique({
          where: { itemId: item.itemId }
        });

        if (!inventory) {
          errors.push({
            field: `items[${item.itemId}]`,
            message: `Sản phẩm ID ${item.itemId} không tồn tại trong kho`
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

        // Kiểm tra tồn kho
        if (item.quantity > inventory.currentStock) {
          errors.push({
            field: `items[${item.itemId}].quantity`,
            message: `Số lượng xuất (${item.quantity}) vượt quá tồn kho (${inventory.currentStock})`
          });
        }
      }
    }

    return errors;
  }

  async createExport(data: ExportData) {
    // Validate dữ liệu
    const errors = await this.validateExport(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    // Bắt đầu transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo phiếu xuất
      const exportRecord = await tx.export.create({
        data: {
          date: data.date,
          purpose: data.purpose,
          departmentId: data.departmentId,
          processedById: data.processedById,
          notes: data.notes,
          status: ExportStatus.PENDING,
          attachments: data.attachments
        }
      });

      // 2. Tạo chi tiết xuất
      const exportItems = await Promise.all(
        data.items.map(async (item) => {
          const inventory = await tx.inventory.findUnique({
            where: { itemId: item.itemId }
          });

          return tx.exportItem.create({
            data: {
              exportId: exportRecord.id,
              itemId: item.itemId,
              quantity: item.quantity,
              currentStock: inventory?.currentStock || 0,
              notes: item.notes
            }
          });
        })
      );

      // 3. Cập nhật cache Redis
      await this.updateCache(exportRecord.id);

      return {
        ...exportRecord,
        items: exportItems
      };
    });
  }

  async approveExport(id: number, approvedById: number) {
    return await this.prisma.$transaction(async (tx) => {
      const export_data = await tx.export.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!export_data) {
        throw new Error('Phiếu xuất không tồn tại');
      }

      if (export_data.status !== ExportStatus.PENDING) {
        throw new Error('Phiếu xuất không ở trạng thái chờ duyệt');
      }

      // Kiểm tra và cập nhật tồn kho
      for (const item of export_data.items) {
        const inventory = await tx.inventory.findUnique({
          where: { itemId: item.itemId }
        });

        if (!inventory) {
          throw new Error(`Không tìm thấy tồn kho cho sản phẩm ID ${item.itemId}`);
        }

        if (item.quantity > inventory.currentStock) {
          throw new Error(`Số lượng xuất vượt quá tồn kho cho sản phẩm ID ${item.itemId}`);
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
            notes: `Xuất kho theo phiếu ${export_data.id}`
          }
        });
      }

      // Cập nhật trạng thái phiếu xuất
      const updated = await tx.export.update({
        where: { id },
        data: {
          status: ExportStatus.APPROVED,
          approvedById,
          approvedAt: new Date()
        }
      });

      // Xóa cache
      await this.redis.del(`export:${id}`);

      return updated;
    });
  }

  async rejectExport(id: number, rejectedById: number, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const export_data = await tx.export.findUnique({
        where: { id }
      });

      if (!export_data) {
        throw new Error('Phiếu xuất không tồn tại');
      }

      if (export_data.status !== ExportStatus.PENDING) {
        throw new Error('Phiếu xuất không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái phiếu xuất
      const updated = await tx.export.update({
        where: { id },
        data: {
          status: ExportStatus.REJECTED,
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Xóa cache
      await this.redis.del(`export:${id}`);

      return updated;
    });
  }

  private async updateCache(exportId: number) {
    const cacheKey = `export:${exportId}`;
    const export_data = await this.prisma.export.findUnique({
      where: { id: exportId },
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

    if (export_data) {
      await this.redis.set(cacheKey, JSON.stringify(export_data), 3600); // Cache 1 giờ
    }
  }

  async getExportById(id: number) {
    // Thử lấy từ cache
    const cacheKey = `export:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Nếu không có trong cache, lấy từ database
    const export_data = await this.prisma.export.findUnique({
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

    if (export_data) {
      // Cập nhật cache
      await this.redis.set(cacheKey, JSON.stringify(export_data), 3600);
    }

    return export_data;
  }

  async getExports(filters: {
    status?: ExportStatus;
    departmentId?: number;
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

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    return this.prisma.export.findMany({
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
}

export default new ExportService(); 