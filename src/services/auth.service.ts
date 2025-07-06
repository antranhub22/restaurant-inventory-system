import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

/**
 * Xử lý đăng nhập, trả về user info và token
 */
export const loginService = async (email: string, password: string, deviceInfo: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.is_active) {
    throw { status: 401, code: 'USER_NOT_FOUND', message: 'Tài khoản không tồn tại hoặc đã bị khóa.' };
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw { status: 401, code: 'INVALID_PASSWORD', message: 'Mật khẩu không đúng.' };
  }
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  // Lưu refresh token vào DB
  await prisma.userRefreshToken.create({
    data: {
      user_id: user.id,
      token_hash: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      device_info: deviceInfo
    }
  });
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    },
    accessToken,
    refreshToken
  };
};

export const refreshService = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as any;
    if (payload.type !== 'refresh') throw { status: 401, code: 'INVALID_TOKEN', message: 'Refresh token không hợp lệ.' };
    const tokenInDb = await prisma.userRefreshToken.findFirst({ where: { token_hash: refreshToken, revoked_at: null } });
    if (!tokenInDb) throw { status: 401, code: 'TOKEN_NOT_FOUND', message: 'Refresh token không tồn tại hoặc đã bị thu hồi.' };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw { status: 401, code: 'USER_NOT_FOUND', message: 'Người dùng không tồn tại.' };
    const accessToken = signAccessToken(user);
    return { accessToken };
  } catch (err) {
    throw { status: 401, code: 'INVALID_TOKEN', message: 'Refresh token không hợp lệ hoặc đã hết hạn.' };
  }
};

export const logoutService = async (refreshToken: string) => {
  await prisma.userRefreshToken.updateMany({ where: { token_hash: refreshToken, revoked_at: null }, data: { revoked_at: new Date() } });
};

export const meService = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' };
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active
  };
}; 