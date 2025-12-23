import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Receipt, Mail, Lock, Building2, Phone, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessId: '',
    phone: '',
    address: '',
  });
  
  const { register, isLoading } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast({ type: 'error', message: 'הסיסמאות אינן תואמות' });
      return;
    }

    if (formData.password.length < 6) {
      addToast({ type: 'error', message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        businessId: formData.businessId || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      addToast({ type: 'success', message: 'נרשמת בהצלחה!' });
      navigate('/');
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.response?.data?.error || 'שגיאה בהרשמה',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 via-gray-900 to-accent-900/30" />
      
      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/20 mb-4">
            <Receipt className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">חשבונית</h1>
          <p className="text-gray-400 mt-2">צור חשבון חדש</p>
        </div>

        {/* Register form */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">הרשמה</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="label">
                  אימייל *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="businessName" className="label">
                  שם העסק *
                </label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="שם העסק שלך"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="label">
                  סיסמה *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  אימות סיסמה *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Business details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="businessId" className="label">
                  ח.פ / עוסק מורשה
                </label>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="businessId"
                    name="businessId"
                    value={formData.businessId}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  טלפון
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="050-1234567"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="label">
                כתובת
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="רחוב, עיר"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>הירשם</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              כבר יש לך חשבון?{' '}
              <Link to="/login" className="text-accent-400 hover:text-accent-300">
                התחבר
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


