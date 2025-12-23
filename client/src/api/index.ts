import axios from 'axios';
import type { User, Client, Product, Document, DashboardStats, VatReport, Pagination } from '../types/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    businessName: string;
    businessId?: string;
    address?: string;
    phone?: string;
  }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', data);
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await api.put<User>('/auth/profile', data);
    return res.data;
  },
};

// Clients
export const clientsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ clients: Client[]; pagination: Pagination }>('/clients', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<Client>(`/clients/${id}`);
    return res.data;
  },

  create: async (data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const res = await api.post<Client>('/clients', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Client>) => {
    const res = await api.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/clients/${id}`);
  },
};

// Products
export const productsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ products: Product[]; pagination: Pagination }>('/products', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  create: async (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const res = await api.post<Product>('/products', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Product>) => {
    const res = await api.put<Product>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};

// Documents
export const documentsApi = {
  getAll: async (params?: {
    search?: string;
    type?: string;
    status?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<{ documents: Document[]; pagination: Pagination }>('/documents', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<Document>(`/documents/${id}`);
    return res.data;
  },

  getNextNumber: async (type: string) => {
    const res = await api.get<{ nextNumber: number }>(`/documents/next-number/${type}`);
    return res.data.nextNumber;
  },

  create: async (data: {
    clientId: string;
    type: string;
    status?: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    vatRate?: number;
    items: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const res = await api.post<Document>('/documents', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Document> & { items?: any[] }) => {
    const res = await api.put<Document>(`/documents/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<Document>(`/documents/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/documents/${id}`);
  },

  getPdf: async (id: string) => {
    const res = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  },

  convertQuote: async (id: string) => {
    const res = await api.post<Document>(`/documents/${id}/convert`);
    return res.data;
  },
};

// Reports
export const reportsApi = {
  getDashboard: async () => {
    const res = await api.get<DashboardStats>('/reports/dashboard');
    return res.data;
  },

  getVatReport: async (params?: { startDate?: string; endDate?: string; period?: string }) => {
    const res = await api.get<VatReport>('/reports/vat', { params });
    return res.data;
  },

  getIncomeReport: async (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
    const res = await api.get('/reports/income', { params });
    return res.data;
  },

  getClientReport: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get('/reports/clients', { params });
    return res.data;
  },
};

export default api;

