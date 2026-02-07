import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/Components/ui/toast';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  show: boolean;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    variant: 'success',
  });

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ show: true, message, variant });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onHide={hideToast}
        duration={3000}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
