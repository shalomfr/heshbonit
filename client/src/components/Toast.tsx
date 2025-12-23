import { useUIStore } from '../store/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  error: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  info: 'bg-accent-500/20 border-accent-500/50 text-accent-400',
  warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
};

export default function Toast() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm animate-slide-in ${colors[toast.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}


