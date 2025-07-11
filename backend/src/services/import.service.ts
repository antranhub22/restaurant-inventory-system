import { PrismaClient } from '@prisma/client';
import { ImportData, ImportItem, ImportStatus, ImportValidationError } from '../types/import';
import RedisService from './redis.service';
import fs from 'fs';
import path from 'path';

class ImportService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = RedisService.getInstance();
  }

  async validateImport(data: ImportData): Promise<ImportValidationError[]> {
    const errors: ImportValidationError[] = [];

    // Kiểm tra ngày
    if (!data.date || data.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Ngày nhập không hợp lệ'
      });
    }

    // Kiểm tra nhà cung cấp
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: data.supplierId }
    });
    if (!supplier) {
      errors.push({
        field: 'supplierId',
        message: 'Nhà cung cấp không tồn tại'
      });
    }

    // Kiểm tra items
    if (!data.items?.length) {
      errors.push({
        field: 'items',
        message: 'Phiếu nhập phải có ít nhất một mặt hàng'
      });
    } else {
      for (const item of data.items) {
        // Kiểm tra itemId hợp lệ
        if (!item.itemId || isNaN(Number(item.itemId))) {
          errors.push({
            field: `items[${item.itemId || 'undefined'}]`,
            message: `Item ID không hợp lệ: ${item.itemId}`
          });
          continue;
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await this.prisma.item.findUnique({
          where: { id: Number(item.itemId) }
        });
        if (!product) {
          errors.push({
            field: `items[${item.itemId}]`,
            message: `Sản phẩm ID ${item.itemId} không tồn tại`
          });
        }

        // Kiểm tra số lượng
        if (item.quantity <= 0) {
          errors.push({
            field: `items[${item.itemId}].quantity`,
            message: 'Số lượng phải lớn hơn 0'
          });
        }

        // Kiểm tra đơn giá
        if (item.unitPrice <= 0) {
          errors.push({
            field: `items[${item.itemId}].unitPrice`,
            message: 'Đơn giá phải lớn hơn 0'
          });
        }

        // Kiểm tra hạn sử dụng
        if (item.expiryDate && new Date(item.expiryDate) <= new Date()) {
          errors.push({
            field: `items[${item.itemId}].expiryDate`,
            message: 'Hạn sử dụng không hợp lệ'
          });
        }
      }
    }

    return errors;
  }

  async createImport(data: ImportData) {
    // Validate dữ liệu
    const errors = await this.validateImport(data);
    if (errors.length > 0) {
      const errorMessages = errors.map(err => `${err.field}: ${err.message}`).join('; ');
      throw new Error(`Lỗi validation: ${errorMessages}`);
    }

    // Bắt đầu transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo phiếu nhập
      const importRecord = await tx.import.create({
        data: {
          date: data.date,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          processedById: data.processedById,
          totalAmount: data.totalAmount,
          notes: data.notes,
          status: ImportStatus.PENDING,
          attachments: data.attachments
        }
      });

      // 2. Tạo chi tiết nhập
      const importItems = await Promise.all(
        data.items.map(item =>
          tx.importItem.create({
            data: {
              importId: importRecord.id,
              itemId: Number(item.itemId),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              expiryDate: item.expiryDate,
              batchNumber: item.batchNumber,
              notes: item.notes
            }
          })
        )
      );

      // 3. Cập nhật tồn kho
      await Promise.all(
        data.items.map(async (item) => {
          const itemId = Number(item.itemId);
          
          const inventory = await tx.inventory.findUnique({
            where: { itemId: itemId }
          });

          if (inventory) {
            await tx.inventory.update({
              where: { itemId: itemId },
              data: {
                currentStock: inventory.currentStock + item.quantity,
                lastUpdated: new Date()
              }
            });
          } else {
            await tx.inventory.create({
              data: {
                itemId: itemId,
                currentStock: item.quantity,
                lastUpdated: new Date()
              }
            });
          }

          // Tạo batch mới
          if (item.expiryDate || item.batchNumber) {
            await tx.inventoryBatch.create({
              data: {
                itemId: itemId,
                batchNumber: item.batchNumber,
                initialQuantity: item.quantity,
                currentQuantity: item.quantity,
                unitCost: item.unitPrice,
                receivedDate: data.date,
                expiryDate: item.expiryDate
              }
            });
          }
        })
      );

      // 4. Tạo transaction logs cho tất cả items
      if (data.items && data.items.length > 0) {
        await Promise.all(
          data.items.map(item =>
            tx.transaction.create({
              data: {
                type: 'IN',
                itemId: Number(item.itemId),
                quantity: item.quantity,
                unitCost: item.unitPrice,
                processedById: data.processedById,
                notes: `Nhập kho từ ${data.invoiceNumber || 'OCR'}`
              }
            })
          )
        );
      }

      // 5. Cập nhật cache Redis
      await this.updateCache(importRecord.id);

      return {
        ...importRecord,
        items: importItems
      };
    });
  }

  async getImports(filters: {
    status?: ImportStatus;
    supplierId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
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

    return this.prisma.import.findMany({
      where,
      include: {
        items: {
          include: {
            item: true
          }
        },
        supplier: true,
        processedBy: true
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  async addAttachment(id: number, file: Express.Multer.File) {
    const importData = await this.prisma.import.findUnique({
      where: { id }
    });

    if (!importData) {
      // Xóa file tạm nếu có lỗi
      fs.unlinkSync(file.path);
      throw new Error('Phiếu nhập kho không tồn tại');
    }

    if (importData.status !== ImportStatus.PENDING) {
      // Xóa file tạm nếu có lỗi
      fs.unlinkSync(file.path);
      throw new Error('Chỉ có thể thêm file đính kèm cho phiếu đang chờ duyệt');
    }

    // Di chuyển file từ thư mục tạm sang thư mục lưu trữ
    const fileName = path.basename(file.path);
    const storagePath = path.join('uploads', 'imports', fileName);

    try {
      // Tạo thư mục nếu chưa tồn tại
      const dir = path.dirname(storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Di chuyển file
      fs.renameSync(file.path, storagePath);

      // Cập nhật danh sách file đính kèm trong database
      const updated = await this.prisma.import.update({
        where: { id },
        data: {
          attachments: {
            push: fileName
          }
        }
      });

      // Xóa cache
      await this.redis.del(`import:${id}`);

      return updated;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  private async updateCache(importId: number) {
    const cacheKey = `import:${importId}`;
    const import_data = await this.prisma.import.findUnique({
      where: { id: importId },
      include: {
        items: {
          include: {
            item: true
          }
        },
        supplier: true
      }
    });

    if (import_data) {
      await this.redis.set(cacheKey, JSON.stringify(import_data), 3600); // Cache 1 giờ
    }
  }

  async getImportById(id: number) {
    // Thử lấy từ cache
    const cacheKey = `import:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Nếu không có trong cache, lấy từ database
    const import_data = await this.prisma.import.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true
          }
        },
        supplier: true
      }
    });

    if (import_data) {
      // Cập nhật cache
      await this.redis.set(cacheKey, JSON.stringify(import_data), 3600);
    }

    return import_data;
  }

  async approveImport(id: number, approvedById: number) {
    return await this.prisma.$transaction(async (tx) => {
      const import_data = await tx.import.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!import_data) {
        throw new Error('Phiếu nhập không tồn tại');
      }

      if (import_data.status !== ImportStatus.PENDING) {
        throw new Error('Phiếu nhập không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái phiếu nhập
      const updated = await tx.import.update({
        where: { id },
        data: {
          status: ImportStatus.APPROVED,
          approvedById,
          approvedAt: new Date()
        }
      });

      // Xóa cache
      await this.redis.del(`import:${id}`);

      return updated;
    });
  }

  async rejectImport(id: number, rejectedById: number, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const import_data = await tx.import.findUnique({
        where: { id }
      });

      if (!import_data) {
        throw new Error('Phiếu nhập không tồn tại');
      }

      if (import_data.status !== ImportStatus.PENDING) {
        throw new Error('Phiếu nhập không ở trạng thái chờ duyệt');
      }

      // Cập nhật trạng thái phiếu nhập
      const updated = await tx.import.update({
        where: { id },
        data: {
          status: ImportStatus.REJECTED,
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Xóa cache
      await this.redis.del(`import:${id}`);

      return updated;
    });
  }
}

export default new ImportService(); 