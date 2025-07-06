import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const listUsersService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true
      }
    }),
    prisma.user.count()
  ]);
  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const createUserService = async (data: { email: string, password: string, full_name: string, role: string }) => {
  const { email, password, full_name, role } = data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 409, code: 'EMAIL_EXISTS', message: 'Email đã tồn tại.' };
  const password_hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password_hash, full_name, role, is_active: true },
    select: { id: true, email: true, full_name: true, role: true, is_active: true }
  });
  return user;
};

export const updateUserService = async (id: number, data: { full_name?: string, role?: string, is_active?: boolean, password?: string }) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' };
  const updateData: any = {};
  if (data.full_name) updateData.full_name = data.full_name;
  if (data.role) updateData.role = data.role;
  if (typeof data.is_active === 'boolean') updateData.is_active = data.is_active;
  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 12);
  }
  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, full_name: true, role: true, is_active: true }
  });
  return updated;
};

export const deleteUserService = async (id: number, currentUserId?: number) => {
  if (currentUserId && id === currentUserId) throw { status: 400, code: 'CANNOT_DELETE_SELF', message: 'Bạn không thể tự xóa chính mình.' };
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' };
  await prisma.user.delete({ where: { id } });
  return { id };
}; 