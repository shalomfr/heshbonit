import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  Package,
  Clock,
  ArrowUpLeft,
  FileText,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '../api';
import { PageLoader } from '../components/LoadingSpinner';
import { documentTypeLabels, documentStatusLabels, documentStatusColors } from '../types/types';
import type { DashboardStats } from '../types/types';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
  });

  if (isLoading) return <PageLoader />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">לוח בקרה</h1>
          <p className="text-gray-400">סקירה כללית של העסק שלך</p>
        </div>
        <Link to="/documents/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>מסמך חדש</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-400" />
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ArrowUpLeft className="w-3 h-3" />
              החודש
            </span>
          </div>
          <p className="stat-value">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
          <p className="stat-label">הכנסות החודש</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-xs text-gray-400">השנה</span>
          </div>
          <p className="stat-value">{formatCurrency(stats?.yearlyRevenue || 0)}</p>
          <p className="stat-label">הכנסות שנתיות</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="stat-value">{stats?.clientCount || 0}</p>
          <p className="stat-label">לקוחות</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="stat-value">{stats?.pendingInvoices || 0}</p>
          <p className="stat-label">ממתינים לתשלום</p>
        </div>
      </div>

      {/* Charts and recent docs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">הכנסות ב-6 חודשים אחרונים</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent documents */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">מסמכים אחרונים</h3>
            <Link to="/documents" className="text-sm text-accent-400 hover:text-accent-300">
              הצג הכל
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentDocuments?.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">אין מסמכים עדיין</p>
            )}
            {stats?.recentDocuments?.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {documentTypeLabels[doc.type]} #{doc.documentNumber}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {(doc as any).client?.name}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">{formatCurrency(doc.total)}</p>
                  <span className={`text-xs ${documentStatusColors[doc.status]}`}>
                    {documentStatusLabels[doc.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* VAT info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-2">מע"מ החודש</h3>
          <p className="text-3xl font-bold text-accent-400">
            {formatCurrency(stats?.monthlyVat || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">סה"כ מע"מ שנגבה החודש</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-2">מע"מ שנתי</h3>
          <p className="text-3xl font-bold text-primary-400">
            {formatCurrency(stats?.yearlyVat || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">סה"כ מע"מ שנגבה השנה</p>
        </div>
      </div>
    </div>
  );
}

