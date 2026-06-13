import React from 'react';
import {
  Box, Typography, Button, Stack, alpha, Divider, Chip,
} from '@mui/material';
import { LockOutlined, ArrowBack, Home, ContactSupport } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const fromPath = (location.state as any)?.from ?? 'an unknown page';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F8FAFC',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 520,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: '0 12px 48px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Red top band */}
        <Box sx={{ height: 6, background: 'linear-gradient(90deg, #F44336 0%, #FF7043 100%)' }} />

        <Box sx={{ p: 5, textAlign: 'center' }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha('#F44336', 0.1),
            }}
          >
            <LockOutlined sx={{ fontSize: 40, color: 'error.main' }} />
          </Box>

          <Chip label="403 — Forbidden" color="error" variant="outlined" size="small" sx={{ mb: 2, fontWeight: 700, letterSpacing: '0.05em' }} />

          <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5, color: '#0A1A3F' }}>
            Access Denied
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 3 }}>
            Your account <strong>{user?.username ?? 'unknown'}</strong> does not have the required
            permission to view this page. This is usually because your role has not been granted access
            to this module.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
            If you believe this is a mistake, ask your system administrator to assign the appropriate
            role or permission to your account.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
              sx={{ bgcolor: '#0A1A3F', '&:hover': { bgcolor: '#0d2257' } }}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Previous Page
            </Button>
            <Button
              variant="text"
              startIcon={<ContactSupport />}
              onClick={() => navigate('/legal/support')}
              color="inherit"
              sx={{ color: 'text.secondary' }}
            >
              Contact Support
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
