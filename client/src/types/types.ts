// User types
export interface User {
  id: string;
  email: string;
  businessName: string;
  businessId?: string;
  address?: string;
  phone?: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  logo?: string;
  vatRate: number;
}

// Client types
export interface Client {
  id: string;
  userId: string;
  name: string;
  businessId?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  includesVat: boolean;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

// Document types
export type DocumentType = 'INVOICE' | 'INVOICE_RECEIPT' | 'RECEIPT' | 'QUOTE';

export type DocumentStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

export interface DocumentItem {
  id: string;
  documentId: string;
  productId?: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Document {
  id: string;
  userId: string;
  clientId: string;
  client: Client;
  documentNumber: number;
  type: DocumentType;
  status: DocumentStatus;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  items: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  monthlyRevenue: number;
  monthlyVat: number;
  yearlyRevenue: number;
  yearlyVat: number;
  clientCount: number;
  productCount: number;
  pendingInvoices: number;
  recentDocuments: Document[];
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  count: number;
}

// Report types
export interface VatReport {
  summary: {
    totalTransactions: number;
    totalSubtotal: number;
    totalVat: number;
    totalAmount: number;
    period: { start: string; end: string };
  };
  documents: Document[];
  byType: {
    invoices: Document[];
    invoiceReceipts: Document[];
    receipts: Document[];
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Label mappings
export const documentTypeLabels: Record<DocumentType, string> = {
  INVOICE: 'חשבונית מס',
  INVOICE_RECEIPT: 'חשבונית מס / קבלה',
  RECEIPT: 'קבלה',
  QUOTE: 'הצעת מחיר',
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'טיוטה',
  SENT: 'נשלח',
  PAID: 'שולם',
  CANCELLED: 'בוטל',
};

export const documentStatusColors: Record<DocumentStatus, string> = {
  DRAFT: 'badge-gray',
  SENT: 'badge-warning',
  PAID: 'badge-success',
  CANCELLED: 'badge-gray',
};


