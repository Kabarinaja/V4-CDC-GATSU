import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface NotificationContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-stone-900 text-white border-stone-800';
          let icon = <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
          if (toast.type === 'success') {
            bg = 'bg-emerald-950/95 text-emerald-50 border-emerald-700/60';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
          } else if (toast.type === 'error') {
            bg = 'bg-red-950/95 text-red-50 border-red-700/60';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl shadow-xl p-3.5 border text-sm flex items-start justify-between gap-3 transition-all duration-300 backdrop-blur-md ${bg}`}
            >
              <div className="flex items-start gap-2.5">
                {icon}
                <div>
                  {toast.title && <h5 className="font-semibold text-xs tracking-wider uppercase mb-0.5 opacity-90">{toast.title}</h5>}
                  <p className="leading-snug text-xs sm:text-sm font-medium">{toast.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-1 transition-opacity"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
