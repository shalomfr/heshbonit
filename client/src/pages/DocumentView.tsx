import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Pencil,
  Download,
  Trash2,
  Send,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { documentsApi } from '../api';
import { useUIStore } from '../store/uiStore';
import { PageLoader } from '../components/LoadingSpinner';
import {
  documentTypeLabels,
  documentStatusLabels,
  documentStatusColors,
} from '../types/types';

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id!),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => documentsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'הסטטוס עודכן בהצלחה' });
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => documentsApi.convertQuote(id!),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'הצעת המחיר הומרה לחשבונית' });
      navigate(`/documents/${newDoc.id}`);
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה בהמרת הצעת המחיר' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'המסמך נמחק בהצלחה' });
      navigate('/documents');
    },
  });

  const handleDownloadPdf = async () => {
    try {
      const blob = await documentsApi.getPdf(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${doc?.documentNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      addToast({ type: 'error', message: 'שגיאה בהורדת ה-PDF' });
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
  if (!doc) return <div>מסמך לא נמצא</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {documentTypeLabels[doc.type]} #{doc.documentNumber}
            </h1>
            <span className={documentStatusColors[doc.status]}>
              {documentStatusLabels[doc.status]}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadPdf} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>הורד PDF</span>
          </button>
          <Link to={`/documents/${id}/edit`} className="btn-secondary flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            <span>עריכה</span>
          </Link>
          {doc.status === 'DRAFT' && (
            <button
              onClick={() => statusMutation.mutate('SENT')}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>שלח</span>
            </button>
          )}
          {doc.status === 'SENT' && (
            <button
              onClick={() => statusMutation.mutate('PAID')}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>סמן כשולם</span>
            </button>
          )}
          {doc.type === 'QUOTE' && doc.status !== 'CANCELLED' && (
            <button
              onClick={() => convertMutation.mutate()}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>המר לחשבונית</span>
            </button>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="card p-8">
        {/* Header info */}
        <div className="flex justify-between mb-8 pb-6 border-b border-gray-700">
          <div>
            <h2 className="text-sm text-gray-400 mb-1">פרטי לקוח</h2>
            <p className="text-lg font-medium text-white">{doc.client.name}</p>
            {doc.client.businessId && (
              <p className="text-sm text-gray-400">ח.פ: {doc.client.businessId}</p>
            )}
            {doc.client.address && (
              <p className="text-sm text-gray-400">{doc.client.address}</p>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-400">תאריך הפקה</p>
            <p className="font-medium text-white">{formatDate(doc.issueDate)}</p>
            {doc.dueDate && (
              <>
                <p className="text-sm text-gray-400 mt-2">לתשלום עד</p>
                <p className="font-medium text-white">{formatDate(doc.dueDate)}</p>
              </>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-right py-3 text-sm font-medium text-gray-400">תיאור</th>
              <th className="text-center py-3 text-sm font-medium text-gray-400">כמות</th>
              <th className="text-center py-3 text-sm font-medium text-gray-400">מחיר יחידה</th>
              <th className="text-left py-3 text-sm font-medium text-gray-400">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-700/50">
                <td className="py-3 text-white">{item.description}</td>
                <td className="py-3 text-center text-gray-300">{item.quantity}</td>
                <td className="py-3 text-center text-gray-300">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-left text-white">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">סה"כ לפני מע"מ:</span>
              <span className="text-white">{formatCurrency(doc.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">מע"מ ({doc.vatRate}%):</span>
              <span className="text-white">{formatCurrency(doc.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-600">
              <span className="text-white">סה"כ לתשלום:</span>
              <span className="text-accent-400">{formatCurrency(doc.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">הערות</h3>
            <p className="text-gray-300">{doc.notes}</p>
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            if (confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) {
              deleteMutation.mutate();
            }
          }}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>מחק מסמך</span>
        </button>
      </div>
    </div>
  );
}

