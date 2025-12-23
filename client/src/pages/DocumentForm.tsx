import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { documentsApi, clientsApi, productsApi } from '../api';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { PageLoader } from '../components/LoadingSpinner';
import { documentTypeLabels } from '../types/types';
import type { DocumentType } from '../types/types';

interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function DocumentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    type: 'INVOICE' as DocumentType,
    clientId: '',
    status: 'DRAFT',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const vatRate = user?.vatRate || 17;

  // Fetch existing document if editing
  const { data: existingDoc, isLoading: isLoadingDoc } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: isEditing,
  });

  // Fetch clients and products
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ limit: 100 }),
  });

  // Populate form when editing
  useEffect(() => {
    if (existingDoc) {
      setFormData({
        type: existingDoc.type,
        clientId: existingDoc.clientId,
        status: existingDoc.status,
        issueDate: existingDoc.issueDate.split('T')[0],
        dueDate: existingDoc.dueDate?.split('T')[0] || '',
        notes: existingDoc.notes || '',
      });
      setItems(
        existingDoc.items.map((item) => ({
          id: item.id,
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        }))
      );
    }
  }, [existingDoc]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ type: 'success', message: 'המסמך נוצר בהצלחה' });
      navigate('/documents');
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה ביצירת המסמך' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      addToast({ type: 'success', message: 'המסמך עודכן בהצלחה' });
      navigate('/documents');
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה בעדכון המסמך' });
    },
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = formData.type === 'QUOTE' ? 0 : subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  // Handle item changes
  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = productsData?.products.find((p) => p.id === productId);
    if (product) {
      updateItem(itemId, {
        productId,
        description: product.name,
        unitPrice: product.price,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      addToast({ type: 'error', message: 'יש לבחור לקוח' });
      return;
    }

    if (items.every((item) => !item.description)) {
      addToast({ type: 'error', message: 'יש להוסיף לפחות פריט אחד' });
      return;
    }

    const payload = {
      ...formData,
      vatRate,
      items: items.filter((item) => item.description).map((item) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  if (isEditing && isLoadingDoc) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/documents')}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'עריכת מסמך' : 'מסמך חדש'}
          </h1>
          <p className="text-gray-400">מלא את הפרטים ליצירת המסמך</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document type and client */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">פרטי המסמך</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">סוג מסמך *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
                className="input"
                disabled={isEditing}
              >
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">לקוח *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="input"
                required
              >
                <option value="">בחר לקוח...</option>
                {clientsData?.clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="label">תאריך הפקה *</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">תאריך לתשלום</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">סטטוס</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="DRAFT">טיוטה</option>
                <option value="SENT">נשלח</option>
                <option value="PAID">שולם</option>
                <option value="CANCELLED">בוטל</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">פריטים</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף שורה</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="col-span-12 md:col-span-4">
                  {index === 0 && <label className="label">תיאור</label>}
                  <div className="flex gap-2">
                    <select
                      value={item.productId || ''}
                      onChange={(e) => selectProduct(item.id, e.target.value)}
                      className="input flex-shrink-0 w-32"
                    >
                      <option value="">מוצר...</option>
                      {productsData?.products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className="input flex-1"
                      placeholder="תיאור הפריט"
                    />
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2">
                  {index === 0 && <label className="label">כמות</label>}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  {index === 0 && <label className="label">מחיר יחידה</label>}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div className="col-span-3 md:col-span-3">
                  {index === 0 && <label className="label">סה"כ</label>}
                  <div className="input bg-gray-700 text-gray-300">
                    {formatCurrency(item.total)}
                  </div>
                </div>
                <div className="col-span-1">
                  {index === 0 && <label className="label">&nbsp;</label>}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">סה"כ לפני מע"מ:</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                {formData.type !== 'QUOTE' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">מע"מ ({vatRate}%):</span>
                    <span className="text-white">{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-600">
                  <span className="text-white">סה"כ לתשלום:</span>
                  <span className="text-accent-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">הערות</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input min-h-[100px] resize-none"
            placeholder="הערות למסמך (אופציונלי)"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="btn-secondary"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'עדכן מסמך' : 'צור מסמך'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

