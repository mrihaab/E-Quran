import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className="flex items-start p-4 mb-4 text-white bg-gray-800 rounded-lg shadow-lg max-w-sm w-full"
    >
      <div className={`flex-shrink-0 w-6 h-6 ${toastColors[toast.type]} rounded-full flex items-center justify-center mr-3`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{toast.title}</h4>
        {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 ml-3 text-white opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};