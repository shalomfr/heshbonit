import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Receipt, Mail, Lock, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      addToast({ type: 'success', message: 'התחברת בהצלחה!' });
      navigate('/');
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.response?.data?.error || 'שגיאה בהתחברות',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 via-gray-900 to-accent-900/30" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/20 mb-4">
            <Receipt className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">חשבונית</h1>
          <p className="text-gray-400 mt-2">מערכת ניהול חשבוניות וקבלות</p>
        </div>

        {/* Login form */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">התחברות</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pr-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
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
                  <span>התחבר</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-accent-400 hover:text-accent-300">
                הירשם עכשיו
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


