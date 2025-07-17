import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setHydrated: () => void;
}

// Custom storage với error handling
const authStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setUser: (user: User | null) => set(() => ({ user })),
      setToken: (token: string | null) => set(() => ({ token })),
      logout: () => {
        set(() => ({ user: null, token: null }));
        // Clear any additional auth-related data from localStorage
        try {
          localStorage.removeItem('auth-refresh-token');
        } catch (error) {
          console.warn('Failed to clear refresh token:', error);
        }
      },
      setHydrated: () => set(() => ({ isHydrated: true })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate auth store:', error);
        }
        // Mark as hydrated regardless of success/failure
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
); 