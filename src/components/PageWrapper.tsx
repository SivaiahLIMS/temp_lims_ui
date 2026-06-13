import React from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface PageWrapperProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function PageWrapper({ isLoading, isError, error, onRetry, children }: PageWrapperProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" startIcon={<Refresh />} onClick={onRetry}>
                Retry
              </Button>
            )
          }
        >
          {error?.message || 'Failed to load data. Please try again.'}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
