import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    businessName: string;
    businessId?: string;
    address?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { token, user } = await authApi.login(email, password);
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const { token, user } = await authApi.register(data);
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const user = await authApi.updateProfile(data);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

