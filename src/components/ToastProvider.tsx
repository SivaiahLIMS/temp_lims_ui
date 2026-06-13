import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastMessage {
  id: number;
  severity: AlertColor;
  message: string;
}

interface ToastContextValue {
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  showWarning: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showError: () => {},
  showSuccess: () => {},
  showWarning: () => {},
});

export const useToast = () => useContext(ToastContext);

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((severity: AlertColor, message: string) => {
    const id = ++_counter;
    setToasts((prev) => [...prev.slice(-2), { id, severity, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const showError = useCallback((msg: string) => push('error', msg), [push]);
  const showSuccess = useCallback((msg: string) => push('success', msg), [push]);
  const showWarning = useCallback((msg: string) => push('warning', msg), [push]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showWarning }}>
      {children}
      {toasts.map((t, i) => (
        <Snackbar
          key={t.id}
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: `${16 + i * 72}px !important` }}
        >
          <Alert
            severity={t.severity}
            variant="filled"
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            sx={{ minWidth: 300 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}
