import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Download,
  Trash2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { documentsApi } from '../api';
import { useUIStore } from '../store/uiStore';
import { PageLoader } from '../components/LoadingSpinner';
import {
  documentTypeLabels,
  documentStatusLabels,
  documentStatusColors,
} from '../types/types';

export default function Documents() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, typeFilter, statusFilter],
    queryFn: () =>
      documentsApi.getAll({
        search,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'המסמך נמחק בהצלחה' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה במחיקת המסמך' });
    },
  });

  const handleDownloadPdf = async (id: string, docNumber: number) => {
    try {
      const blob = await documentsApi.getPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${docNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      addToast({ type: 'error', message: 'שגיאה בהורדת ה-PDF' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">מסמכים</h1>
          <p className="text-gray-400">חשבוניות, קבלות והצעות מחיר</p>
        </div>
        <Link to="/documents/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>מסמך חדש</span>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי מספר או לקוח..."
            className="input pr-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span>סינון</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-4">
          <div>
            <label className="label">סוג מסמך</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">הכל</option>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">סטטוס</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">הכל</option>
              {Object.entries(documentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
              }}
              className="btn-ghost text-sm"
            >
              נקה סינון
            </button>
          </div>
        </div>
      )}

      {/* Documents table */}
      {data?.documents.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">אין מסמכים עדיין</h3>
          <p className="text-gray-400 mb-4">צור את החשבונית הראשונה שלך</p>
          <Link to="/documents/new" className="btn-primary">
            צור מסמך חדש
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>מספר</th>
                <th>סוג</th>
                <th>לקוח</th>
                <th>תאריך</th>
                <th>סכום</th>
                <th>סטטוס</th>
                <th className="w-32">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {data?.documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="font-medium text-white">#{doc.documentNumber}</td>
                  <td>{documentTypeLabels[doc.type]}</td>
                  <td>{doc.client?.name}</td>
                  <td>{formatDate(doc.issueDate)}</td>
                  <td className="font-medium">{formatCurrency(doc.total)}</td>
                  <td>
                    <span className={documentStatusColors[doc.status]}>
                      {documentStatusLabels[doc.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDownloadPdf(doc.id, doc.documentNumber)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

