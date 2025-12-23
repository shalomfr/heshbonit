import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, Building2, User, Percent } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const { user, updateProfile, logout } = useAuthStore();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState({
    businessName: user?.businessName || '',
    businessId: user?.businessId || '',
    address: user?.address || '',
    phone: user?.phone || '',
    vatRate: user?.vatRate?.toString() || '17',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        ...formData,
        vatRate: parseFloat(formData.vatRate),
      });
      addToast({ type: 'success', message: 'ההגדרות נשמרו בהצלחה' });
    } catch (error) {
      addToast({ type: 'error', message: 'שגיאה בשמירת ההגדרות' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
        <p className="text-gray-400">ניהול פרטי העסק והחשבון</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business details */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">פרטי העסק</h2>
              <p className="text-sm text-gray-400">מידע זה יופיע על החשבוניות</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">שם העסק</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">ח.פ / עוסק מורשה</label>
                <input
                  type="text"
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  className="input"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="label">טלפון</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="050-1234567"
                />
              </div>
            </div>

            <div>
              <label className="label">כתובת</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                placeholder="רחוב, עיר"
              />
            </div>
          </div>
        </div>

        {/* VAT settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">הגדרות מע"מ</h2>
              <p className="text-sm text-gray-400">אחוז המע"מ שיחול על החשבוניות</p>
            </div>
          </div>

          <div>
            <label className="label">אחוז מע"מ</label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                className="input pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">אחוז המע"מ הנוכחי בישראל: 17%</p>
          </div>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">פרטי חשבון</h2>
              <p className="text-sm text-gray-400">מידע על החשבון שלך</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">אימייל</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">סוג חשבון</span>
              <span className="text-white">
                {user?.role === 'ADMIN' ? 'מנהל' : user?.role === 'USER' ? 'משתמש' : 'צופה'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={logout}
            className="btn-danger"
          >
            התנתק מהמערכת
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>שמור שינויים</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


