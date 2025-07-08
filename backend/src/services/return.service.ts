import { PrismaClient } from '@prisma/client';
import { ReturnData, ReturnItem, ReturnStatus, ReturnValidationError, ItemCondition } from '../types/return';
import RedisService from './redis.service';
import fs from 'fs';
import path from 'path';

class ReturnService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = RedisService.getInstance();
  }

  async addAttachment(id: number, file: Express.Multer.File) {
    const returnData = await this.prisma.return.findUnique({
      where: { id }
    });

    if (!returnData) {
      // Xóa file tạm nếu có lỗi
      fs.unlinkSync(file.path);
      throw new Error('Phiếu hoàn trả không tồn tại');
    }

    if (returnData.status !== ReturnStatus.PENDING) {
      // Xóa file tạm nếu có lỗi
      fs.unlinkSync(file.path);
      throw new Error('Chỉ có thể thêm file đính kèm cho phiếu đang chờ duyệt');
    }

    // Di chuyển file từ thư mục tạm sang thư mục lưu trữ
    const fileName = path.basename(file.path);
    const storagePath = path.join('uploads', 'returns', fileName);

    try {
      // Tạo thư mục nếu chưa tồn tại
      const dir = path.dirname(storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Di chuyển file
      fs.renameSync(file.path, storagePath);

      // Cập nhật danh sách file đính kèm trong database
      const updated = await this.prisma.return.update({
        where: { id },
        data: {
          attachments: {
            push: fileName
          }
        }
      });

      // Xóa cache
      await this.redis.del(`return:${id}`);

      return updated;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  async validateReturn(data: ReturnData): Promise<ReturnValidationError[]> {
    const errors: ReturnValidationError[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Ngày hoàn trả không hợp lệ'
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
        message: 'Phiếu hoàn trả phải có ít nhất một mặt hàng'
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

        // Kiểm tra phiếu xuất gốc nếu có
        if (item.originalExportId) {
          const export_data = await this.prisma.export.findUnique({
            where: { id: item.originalExportId },
            include: {
              items: {
                where: { itemId: item.itemId }
              }
            }
          });

          if (!export_data) {
            errors.push({
              field: `items[${item.itemId}].originalExportId`,
              message: 'Phiếu xuất gốc không tồn tại'
            });
          } else {
            const exportItem = export_data.items[0];
            if (!exportItem) {
              errors.push({
                field: `items[${item.itemId}].originalExportId`,
                message: 'Sản phẩm không tồn tại trong phiếu xuất gốc'
              });
            } else if (item.quantity > exportItem.quantity) {
              errors.push({
                field: `items[${item.itemId}].quantity`,
                message: `Số lượng hoàn trả (${item.quantity}) vượt quá số lượng xuất (${exportItem.quantity})`
              });
            }
          }
        }
      }
    }

    return errors;
  }

  async createReturn(data: ReturnData) {
    // Validate dữ liệu
    const errors = await this.validateReturn(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    // Bắt đầu transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo phiếu hoàn trả
      const returnRecord = await tx.return.create({
        data: {
          date: data.date,
          departmentId: data.departmentId,
          reason: data.reason,
          processedById: data.processedById,
          notes: data.notes,
          status: ReturnStatus.PENDING,
          attachments: data.attachments
        }
      });

      // 2. Tạo chi tiết hoàn trả
      const returnItems = await Promise.all(
        data.items.map(item =>
          tx.returnItem.create({
            data: {
              returnId: returnRecord.id,
              itemId: item.itemId,
              quantity: item.quantity,
              condition: item.condition,
              originalExportId: item.originalExportId,
              notes: item.notes
            }
          })
        )
      );

      // 3. Cập nhật cache Redis
      await this.updateCache(returnRecord.id);

      return {
        ...returnRecord,
        items: returnItems
      };
    });
  }

  async approveReturn(id: number, approvedById: number) {
    return await this.prisma.$transaction(async (tx) => {
      const return_data = await tx.return.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!return_data) {
        throw new Error('Phiếu hoàn trả không tồn tại');
      }

      if (return_data.status !== ReturnStatus.PENDING) {
        throw new Error('Phiếu hoàn trả không ở trạng thái chờ duyệt');
      }

      // Cập nhật tồn kho cho các sản phẩm còn tốt
      for (const item of return_data.items) {
        if (item.condition === ItemCondition.GOOD) {
          const inventory = await tx.inventory.findUnique({
            where: { itemId: item.itemId }
          });

          if (inventory) {
            await tx.inventory.update({
              where: { itemId: item.itemId },
              data: {
                currentStock: inventory.currentStock + item.quantity,
                lastUpdated: new Date()
              }
            });
          } else {
            await tx.inventory.create({
              data: {
                itemId: item.itemId,
                currentStock: item.quantity,
                lastUpdated: new Date()
              }
            });
          }

          // Tạo transaction log
          await tx.transaction.create({
            data: {
              type: 'IN',
              itemId: item.itemId,
              quantity: item.quantity,
              processedById: approvedById,
              notes: `Hoàn trả theo phiếu ${return_data.id}`
            }
          });
        }
      }

      // Cập nhật trạng thái phiếu hoàn trả
      const updated = await tx.return.update({
        where: { id },
        data: {
          status: ReturnStatus.APPROVED,
          approvedById,
          approvedAt: new Date()
        }
      });

      // Xóa cache
      await this.redis.del(`return:${id}`);

      return updated;
    });
  }

  async rejectReturn(id: number, rejectedById: number, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const return_data = await tx.return.findUnique({
        where: { id }
      });

      if (!return_data) {
        throw new Error('Phiếu hoàn trả không tồn tại');
      }

      if (return_data.status !== ReturnStatus.PENDING) {
        throw new Error('Phiếu hoàn trả không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái phiếu hoàn trả
      const updated = await tx.return.update({
        where: { id },
        data: {
          status: ReturnStatus.REJECTED,
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Xóa cache
      await this.redis.del(`return:${id}`);

      return updated;
    });
  }

  private async updateCache(returnId: number) {
    const cacheKey = `return:${returnId}`;
    const return_data = await this.prisma.return.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            item: true,
            originalExport: true
          }
        },
        department: true,
        processedBy: true
      }
    });

    if (return_data) {
      await this.redis.set(cacheKey, JSON.stringify(return_data), 3600); // Cache 1 giờ
    }
  }

  async getReturnById(id: number) {
    // Thử lấy từ cache
    const cacheKey = `return:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Nếu không có trong cache, lấy từ database
    const return_data = await this.prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true,
            originalExport: true
          }
        },
        department: true,
        processedBy: true
      }
    });

    if (return_data) {
      // Cập nhật cache
      await this.redis.set(cacheKey, JSON.stringify(return_data), 3600);
    }

    return return_data;
  }

  async getReturns(filters: {
    status?: ReturnStatus;
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

    return this.prisma.return.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
            originalExport: true
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

export default new ReturnService(); 