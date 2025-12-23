import { useUIStore } from '../store/uiStore';
import { X } from 'lucide-react';

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ title, children, onClose, size = 'md' }: ModalProps) {
  const { closeModal } = useUIStore();
  
  const handleClose = () => {
    onClose?.();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div
        className={`relative w-full ${sizes[size]} bg-gray-800 rounded-xl border border-gray-700 shadow-2xl animate-fade-in`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Hook for using modal
export function useModal() {
  const { openModal, closeModal, modalOpen } = useUIStore();
  return { openModal, closeModal, isOpen: modalOpen };
}

