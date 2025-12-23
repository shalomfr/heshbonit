import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Phone, Mail, Building2 } from 'lucide-react';
import { clientsApi } from '../api';
import { useUIStore } from '../store/uiStore';
import { PageLoader } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import type { Client } from '../types/types';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.getAll({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      addToast({ type: 'success', message: 'הלקוח נמחק בהצלחה' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה במחיקת הלקוח' });
    },
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">לקוחות</h1>
          <p className="text-gray-400">ניהול רשימת הלקוחות שלך</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>לקוח חדש</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או מייל..."
          className="input pr-10"
        />
      </div>

      {/* Clients grid */}
      {data?.clients.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">אין לקוחות עדיין</h3>
          <p className="text-gray-400 mb-4">התחל להוסיף לקוחות כדי לנהל את החשבוניות שלך</p>
          <button onClick={handleNew} className="btn-primary">
            הוסף לקוח ראשון
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.clients.map((client) => (
            <div key={client.id} className="card p-5 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                    <span className="text-accent-400 font-semibold">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{client.name}</h3>
                    {client.businessId && (
                      <p className="text-xs text-gray-400">ח.פ: {client.businessId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <p className="text-gray-500 text-xs">{client.address}{client.city && `, ${client.city}`}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// Client Form Modal
function ClientModal({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    businessId: client?.businessId || '',
    address: client?.address || '',
    city: client?.city || '',
    phone: client?.phone || '',
    email: client?.email || '',
    notes: client?.notes || '',
  });

  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => 
      client ? clientsApi.update(client.id, data) : clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      addToast({ type: 'success', message: client ? 'הלקוח עודכן בהצלחה' : 'הלקוח נוצר בהצלחה' });
      onClose();
    },
    onError: () => {
      addToast({ type: 'error', message: 'שגיאה בשמירת הלקוח' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Modal title={client ? 'עריכת לקוח' : 'לקוח חדש'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">שם הלקוח *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">ח.פ / עוסק מורשה</label>
            <input
              type="text"
              value={formData.businessId}
              onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">טלפון</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">אימייל</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">כתובת</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">עיר</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">הערות</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input min-h-[80px] resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            ביטול
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {client ? 'עדכון' : 'יצירה'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

