import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { setTokens } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function extractPermissions(obj: Record<string, unknown>): string[] {
  // Try every field name Spring Security / custom backends use
  const candidates = [
    obj.permissions,
    obj.authorities,
    obj.roles,
    obj.scope,
    obj.scopes,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      // authorities can be objects like { authority: "ROLE_X" }
      return c.map((x) => (typeof x === 'object' && x !== null ? (x as any).authority ?? String(x) : String(x)));
    }
    if (typeof c === 'string' && c.length > 0) {
      return c.split(/[\s,]+/).filter(Boolean);
    }
  }
  return [];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      setIsLoading(true);

      const response = await authApi.login({
        username: data.username,
        password: data.password,
      });

      setTokens(response.accessToken, response.refreshToken);

      // Decode permissions directly from JWT as the most reliable source
      const jwtClaims = decodeJwtPayload(response.accessToken);

      // Also try /auth/me for richer profile data; non-fatal if it fails
      let profile: Record<string, unknown> = response;
      try {
        profile = await authApi.me();
      } catch {
        // fall through to login response + JWT claims
      }

      // Merge: profile > login response > JWT claims, for every field
      const permissions =
        extractPermissions(profile).length > 0
          ? extractPermissions(profile)
          : extractPermissions(response).length > 0
          ? extractPermissions(response)
          : extractPermissions(jwtClaims);

      useAuthStore.getState().setUser({
        userId: (profile.userId ?? profile.user_id ?? response.userId ?? response.user_id ?? jwtClaims.userId ?? jwtClaims.user_id ?? jwtClaims.sub) as number,
        username: (profile.username ?? profile.sub ?? response.username ?? response.sub ?? jwtClaims.sub) as string,
        tenantId: (profile.tenantId ?? profile.tenant_id ?? response.tenantId ?? response.tenant_id ?? jwtClaims.tenantId ?? jwtClaims.tenant_id ?? 1) as number,
        branchId: (profile.branchId ?? profile.branch_id ?? response.branchId ?? response.branch_id ?? jwtClaims.branchId ?? jwtClaims.branch_id ?? 1) as number,
        permissions,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
        backgroundAttachment: 'fixed',
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Science sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, margin: 0 }}>
              Sivaya LIMS
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Laboratory Information Management System
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ padding: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {apiError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username"
              placeholder="Enter your username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              margin="normal"
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                marginTop: 3,
                paddingY: 1.5,
                backgroundColor: '#1e3c72',
                '&:hover': {
                  backgroundColor: '#2a5298',
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
