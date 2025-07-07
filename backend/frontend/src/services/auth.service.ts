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

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { token, user } = response.data;
    
    // Lưu vào store
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().setUser({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role as any,
      is_active: true,
    });
    
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { token, user } = response.data;
    
    // Lưu vào store
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().setUser({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role as any,
      is_active: true,
    });
    
    return response.data;
  },

  logout() {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  },
};

export default authService;