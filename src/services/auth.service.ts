import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const prisma = new PrismaClient();

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