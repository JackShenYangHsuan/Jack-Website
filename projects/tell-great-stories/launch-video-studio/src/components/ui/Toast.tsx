'use client';

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast data
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to use toast context
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Toast container component
 */
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const container = (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(container, document.body);
  }

  return null;
}

/**
 * Icons - Lucide style
 */
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3 w-3', className)}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * Type styles - shadcn semantic colors
 */
const typeConfig: Record<ToastType, { icon: typeof CheckCircleIcon; iconClass: string; bgClass: string }> = {
  success: {
    icon: CheckCircleIcon,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
  },
  error: {
    icon: XCircleIcon,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50',
  },
  warning: {
    icon: AlertTriangleIcon,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  info: {
    icon: InfoIcon,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
  },
};

/**
 * Toast item props
 */
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

/**
 * Individual toast item - shadcn/ui design
 */
function ToastItem({ toast, onClose }: ToastItemProps) {
  const { icon: Icon, iconClass, bgClass } = typeConfig[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg',
        'bg-white border border-zinc-200',
        'shadow-lg',
        'min-w-[280px] max-w-[380px]',
        'animate-in slide-in-from-right-full duration-200'
      )}
      role="alert"
    >
      <div className={cn('flex items-center justify-center w-6 h-6 rounded-full shrink-0', bgClass)}>
        <Icon className={iconClass} />
      </div>
      <p className="flex-1 text-sm text-zinc-900 leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        className={cn(
          'p-1 rounded-md shrink-0',
          'text-zinc-400',
          'hover:text-zinc-900 hover:bg-zinc-100',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950'
        )}
        aria-label="Close toast"
      >
        <XIcon />
      </button>
    </div>
  );
}
