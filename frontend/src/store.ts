import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'owner' | 'manager' | 'supervisor' | 'staff';
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set: (fn: (state: AuthState) => Partial<AuthState>) => void) => ({
  user: null,
  token: null,
  setUser: (user: User | null) => set(() => ({ user })),
  setToken: (token: string | null) => set(() => ({ token })),
  logout: () => set(() => ({ user: null, token: null })),
})); 