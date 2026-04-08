import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Toast } from './Toast';
import { useToast } from '../contexts/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};