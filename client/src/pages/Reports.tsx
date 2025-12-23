import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, Calendar, FileText } from 'lucide-react';
import { reportsApi } from '../api';
import { PageLoader } from '../components/LoadingSpinner';
import { documentTypeLabels } from '../types/types';

export default function Reports() {
  const [period, setPeriod] = useState<'monthly' | 'bimonthly'>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: vatReport, isLoading } = useQuery({
    queryKey: ['vatReport', period, startDate, endDate],
    queryFn: () => reportsApi.getVatReport({ period, startDate, endDate }),
  });

  const { data: clientReport } = useQuery({
    queryKey: ['clientReport', startDate, endDate],
    queryFn: () => reportsApi.getClientReport({ startDate, endDate }),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  const pieColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

  if (isLoading) return <PageLoader />;

  const typeData = [
    { name: 'חשבוניות', value: vatReport?.byType.invoices.length || 0 },
    { name: 'חשבונית/קבלה', value: vatReport?.byType.invoiceReceipts.length || 0 },
    { name: 'קבלות', value: vatReport?.byType.receipts.length || 0 },
  ].filter(d => d.value > 0);

  const topClients = clientReport?.clients?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">דוחות</h1>
          <p className="text-gray-400">דוחות מע"מ והכנסות</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">תקופה</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'monthly' | 'bimonthly')}
            className="input"
          >
            <option value="monthly">חודשי</option>
            <option value="bimonthly">דו-חודשי</option>
          </select>
        </div>
        <div>
          <label className="label">מתאריך</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">עד תאריך</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* VAT Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">סה"כ עסקאות</p>
          <p className="stat-value">{vatReport?.summary.totalTransactions || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">סה"כ לפני מע"מ</p>
          <p className="stat-value">{formatCurrency(vatReport?.summary.totalSubtotal || 0)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">סה"כ מע"מ</p>
          <p className="stat-value text-accent-400">{formatCurrency(vatReport?.summary.totalVat || 0)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">סה"כ כולל מע"מ</p>
          <p className="stat-value">{formatCurrency(vatReport?.summary.totalAmount || 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document types pie chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">התפלגות סוגי מסמכים</h3>
          {typeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              אין נתונים לתקופה זו
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">לקוחות מובילים</h3>
          {topClients.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
                  />
                  <Bar dataKey="totalRevenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              אין נתונים לתקופה זו
            </div>
          )}
        </div>
      </div>

      {/* Transactions list */}
      <div className="card">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">פירוט עסקאות</h3>
          <span className="text-sm text-gray-400">
            {vatReport?.documents.length || 0} עסקאות
          </span>
        </div>
        {vatReport?.documents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>אין עסקאות לתקופה זו</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>מספר</th>
                  <th>סוג</th>
                  <th>לקוח</th>
                  <th>תאריך</th>
                  <th>לפני מע"מ</th>
                  <th>מע"מ</th>
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {vatReport?.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-medium text-white">#{doc.documentNumber}</td>
                    <td>{documentTypeLabels[doc.type]}</td>
                    <td>{(doc as any).client?.name}</td>
                    <td>{formatDate(doc.issueDate)}</td>
                    <td>{formatCurrency(doc.subtotal)}</td>
                    <td>{formatCurrency(doc.vatAmount)}</td>
                    <td className="font-medium">{formatCurrency(doc.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 font-semibold">
                  <td colSpan={4} className="text-left">סה"כ</td>
                  <td>{formatCurrency(vatReport?.summary.totalSubtotal || 0)}</td>
                  <td>{formatCurrency(vatReport?.summary.totalVat || 0)}</td>
                  <td className="text-accent-400">{formatCurrency(vatReport?.summary.totalAmount || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

