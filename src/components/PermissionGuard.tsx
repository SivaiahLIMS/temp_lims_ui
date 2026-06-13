import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Stack, alpha } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  /**
   * "redirect"  → navigate to /unauthorized (default for page-level guards)
   * "block"     → render an inline "Access Denied" panel instead of the children
   */
  mode?: 'redirect' | 'block';
}

function InlineDenied({ permission }: { permission: string }) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
        textAlign: 'center',
        p: 4,
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: (theme) => alpha(theme.palette.error.main, 0.03),
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
          mb: 2,
        }}
      >
        <LockOutlined sx={{ fontSize: 36, color: 'error.main' }} />
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Access Restricted
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 0.5, lineHeight: 1.7 }}>
        You do not have the <strong>{permission}</strong> permission required to view this section.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 3, lineHeight: 1.7 }}>
        Please contact your system administrator to request access, or switch to an account with the appropriate role.
      </Typography>
      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" size="small" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}

export default function PermissionGuard({
  permission,
  children,
  mode = 'redirect',
}: PermissionGuardProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (mode === 'block') {
    return <InlineDenied permission={permission} />;
  }

  return <Navigate to="/unauthorized" replace />;
}

/**
 * Wraps a button/action — renders children normally when permitted,
 * or shows a tooltip-style disabled state with a helpful message.
 */
export function ActionGuard({
  permission,
  children,
  label,
}: {
  permission: string;
  children: React.ReactNode;
  label?: string;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (hasPermission(permission)) return <>{children}</>;

  return (
    <Box
      title={`You need the ${permission} permission to ${label ?? 'perform this action'}.`}
      sx={{ display: 'inline-flex', cursor: 'not-allowed', opacity: 0.45 }}
    >
      <Box sx={{ pointerEvents: 'none' }}>{children}</Box>
    </Box>
  );
}
