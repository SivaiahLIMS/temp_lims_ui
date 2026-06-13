import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LIMS_THEME } from './theme/theme';
import { loadTokensFromStorage, registerApiErrorHandler, unregisterApiErrorHandler } from './api/client';
import { ToastProvider, useToast } from './components/ToastProvider';
import AppRouter from './router/index';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ApiErrorWatcher() {
  const { showError } = useToast();
  useEffect(() => {
    registerApiErrorHandler((_status, message) => showError(message));
    return () => unregisterApiErrorHandler();
  }, [showError]);
  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function App() {
  useEffect(() => {
    loadTokensFromStorage();

    // On every page load, re-hydrate permissions from the stored JWT so that
    // any session persisted before the permissions fix is automatically repaired.
    const token = localStorage.getItem('lims_access_token');
    if (token) {
      const claims = decodeJwtPayload(token);
      const permissions = claims.permissions;
      if (Array.isArray(permissions) && permissions.length > 0) {
        const store = useAuthStore.getState();
        if (store.user && store.user.permissions.length === 0) {
          store.setUser({ ...store.user, permissions: permissions as string[] });
        }
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={LIMS_THEME}>
        <CssBaseline />
        <ToastProvider>
          <ApiErrorWatcher />
          <AppRouter />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
