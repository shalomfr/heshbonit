import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { productsApi } from '../api';
import { useUIStore } from '../store/uiStore';
import { PageLoader } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import type { Product } from '../types/types';

export default function Products() {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({ type: 'success', message: 'המוצר נמחק בהצלחה' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה במחיקת המוצר' });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">מוצרים ושירותים</h1>
          <p className="text-gray-400">ניהול קטלוג המוצרים והשירותים</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>מוצר חדש</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש מוצר או שירות..."
          className="input pr-10"
        />
      </div>

      {/* Products table */}
      {data?.products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">אין מוצרים עדיין</h3>
          <p className="text-gray-400 mb-4">הוסף מוצרים ושירותים כדי להשתמש בהם בחשבוניות</p>
          <button onClick={handleNew} className="btn-primary">
            הוסף מוצר ראשון
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>שם המוצר</th>
                <th>תיאור</th>
                <th>מחיר</th>
                <th>יחידה</th>
                <th>כולל מע"מ</th>
                <th className="w-20">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {data?.products.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium text-white">{product.name}</td>
                  <td className="text-gray-400">{product.description || '-'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.unit}</td>
                  <td>
                    <span className={product.includesVat ? 'badge-success' : 'badge-gray'}>
                      {product.includesVat ? 'כן' : 'לא'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// Product Form Modal
function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    unit: product?.unit || 'יחידה',
    includesVat: product?.includesVat || false,
  });

  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => 
      product ? productsApi.update(product.id, data) : productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({ type: 'success', message: product ? 'המוצר עודכן בהצלחה' : 'המוצר נוצר בהצלחה' });
      onClose();
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה בשמירת המוצר' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  const unitOptions = ['יחידה', 'שעה', 'יום', 'חודש', 'ק"ג', 'מטר', 'קופסה', 'חבילה'];

  return (
    <Modal title={product ? 'עריכת מוצר' : 'מוצר חדש'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">שם המוצר/שירות *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">תיאור</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[80px] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">מחיר *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">יחידת מידה</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input"
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includesVat"
            checked={formData.includesVat}
            onChange={(e) => setFormData({ ...formData, includesVat: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
          />
          <label htmlFor="includesVat" className="text-sm text-gray-300">
            המחיר כולל מע"מ
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            ביטול
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {product ? 'עדכון' : 'יצירה'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

