import api from '../utils/api';
import { useAuthStore } from '../store';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

// Token validation utilities
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.warn('Failed to parse token:', error);
    return true;
  }
};

const validateStoredToken = (): boolean => {
  const { token } = useAuthStore.getState();
  if (!token) return false;
  
  if (isTokenExpired(token)) {
    console.warn('Stored token has expired, logging out');
    useAuthStore.getState().logout();
    return false;
  }
  
  return true;
};

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { token, user } = response.data;
      
      // Validate token before storing
      if (!token || isTokenExpired(token)) {
        throw new Error('Nhận được token không hợp lệ từ server');
      }
      
      // Store in persistent store
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role as any,
        is_active: true,
      });
      
      return response.data;
    } catch (error: any) {
      // Enhanced error handling
      if (error.response?.status === 401) {
        throw new Error('Thông tin đăng nhập không chính xác');
      } else if (error.response?.status === 403) {
        throw new Error('Tài khoản của bạn đã bị khóa');
      } else if (error.response?.status >= 500) {
        throw new Error('Lỗi hệ thống, vui lòng thử lại sau');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Đăng nhập thất bại, vui lòng thử lại');
      }
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { token, user } = response.data;
      
      // Validate token before storing
      if (!token || isTokenExpired(token)) {
        throw new Error('Nhận được token không hợp lệ từ server');
      }
      
      // Store in persistent store
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role as any,
        is_active: true,
      });
      
      return response.data;
    } catch (error: any) {
      // Enhanced error handling
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Dữ liệu đăng ký không hợp lệ');
      } else if (error.response?.status === 409) {
        throw new Error('Email này đã được sử dụng');
      } else if (error.response?.status >= 500) {
        throw new Error('Lỗi hệ thống, vui lòng thử lại sau');
      } else {
        throw new Error('Đăng ký thất bại, vui lòng thử lại');
      }
    }
  },

  logout() {
    useAuthStore.getState().logout();
    // Redirect to login page
    window.location.href = '/login';
  },

  // Check if current session is valid
  isAuthenticated(): boolean {
    return validateStoredToken();
  },

  // Get current user info (with validation)
  getCurrentUser() {
    if (!validateStoredToken()) {
      return null;
    }
    return useAuthStore.getState().user;
  },

  // Get current token (with validation)
  getToken(): string | null {
    if (!validateStoredToken()) {
      return null;
    }
    return useAuthStore.getState().token;
  },
};

export default authService;