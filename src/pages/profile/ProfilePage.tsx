import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Avatar, Button,
  TextField, Chip, Divider, CircularProgress, Alert,
  alpha, useTheme, Grid,
} from '@mui/material';
import { Edit, Save, Cancel, Key, Person, Email, Shield } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#B71C1C',
  LAB_MANAGER: '#1565C0',
  ANALYST: '#2E7D32',
  REVIEWER: '#E65100',
  APPROVER: '#6A1B9A',
  INVENTORY_MANAGER: '#00695C',
  INSTRUMENT_MANAGER: '#0277BD',
  QA_MANAGER: '#AD1457',
  PURCHASER: '#558B2F',
  VIEWER: '#546E7A',
};

export default function ProfilePage() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile', user?.userId],
    queryFn: () => usersApi.getById(user!.userId),
    enabled: !!user?.userId,
    retry: false,
  });

  const profile: any = profileData ?? {};
  const displayName = profile.username ?? user?.username ?? 'User';
  const email = profile.email ?? '';
  const roles: string[] = profile.roles ?? [];
  const initials = displayName.split(/[._\s-]/).map((s: string) => s[0] ?? '').join('').slice(0, 2).toUpperCase();

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => usersApi.update(user!.userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.userId] });
      setEditMode(false);
    },
  });

  const resetPwMutation = useMutation({
    mutationFn: (data: unknown) => usersApi.resetPassword(user!.userId, data),
    onSuccess: () => {
      setPwMode(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwError('');
    },
  });

  const handleEditOpen = () => {
    setForm({
      email: profile.email ?? '',
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
    });
    setEditMode(true);
  };

  const handlePwSubmit = () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwError('');
    resetPwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and manage your personal account details.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left — Avatar + identity */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                <Avatar
                  sx={{
                    width: 88, height: 88,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 28, fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">{email || '—'}</Typography>
                </Box>

                <Stack direction="row" flexWrap="wrap" gap={0.75} justifyContent="center">
                  {roles.length === 0 ? (
                    <Typography variant="caption" color="text.disabled">No roles assigned</Typography>
                  ) : (
                    roles.map((role) => (
                      <Chip
                        key={role}
                        label={role.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          height: 22, fontSize: 10, fontWeight: 700,
                          bgcolor: alpha(ROLE_COLORS[role] ?? theme.palette.primary.main, 0.12),
                          color: ROLE_COLORS[role] ?? theme.palette.primary.main,
                        }}
                      />
                    ))
                  )}
                </Stack>

                <Divider sx={{ width: '100%' }} />

                <Stack spacing={0.5} sx={{ width: '100%', px: 1 }}>
                  {[
                    { label: 'User ID', value: `#${user?.userId}` },
                    { label: 'Tenant', value: `T#${user?.tenantId}` },
                    { label: 'Branch', value: `B#${user?.branchId}` },
                  ].map(({ label, value }) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" fontWeight={600}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right — Editable details */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Profile details card */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={700}>Personal Information</Typography>
                    </Stack>
                    {!editMode ? (
                      <Button size="small" startIcon={<Edit fontSize="small" />} onClick={handleEditOpen}>
                        Edit
                      </Button>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" startIcon={<Cancel fontSize="small" />} onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={updateMutation.isPending ? <CircularProgress size={14} /> : <Save fontSize="small" />}
                          onClick={() => updateMutation.mutate(form)}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                      </Stack>
                    )}
                  </Stack>

                  {updateMutation.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>Failed to update profile. Please try again.</Alert>
                  )}

                  <Grid container spacing={2}>
                    {editMode ? (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField label="First Name" size="small" fullWidth value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Last Name" size="small" fullWidth value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Email" size="small" fullWidth type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Phone" size="small" fullWidth value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                        </Grid>
                      </>
                    ) : (
                      <>
                        {[
                          { label: 'Username', value: displayName },
                          { label: 'Email', value: profile.email ?? '—' },
                          { label: 'First Name', value: profile.firstName ?? '—' },
                          { label: 'Last Name', value: profile.lastName ?? '—' },
                          { label: 'Phone', value: profile.phone ?? '—' },
                          { label: 'Account Status', value: profile.status ?? 'ACTIVE' },
                        ].map(({ label, value }) => (
                          <Grid item xs={12} sm={6} key={label}>
                            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{value}</Typography>
                          </Grid>
                        ))}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Permissions card */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Shield sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Permissions</Typography>
                    <Chip label={`${user?.permissions?.length ?? 0} granted`} size="small" color="primary" variant="outlined" />
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {(user?.permissions ?? []).length === 0 ? (
                      <Typography variant="body2" color="text.disabled">No permissions assigned.</Typography>
                    ) : (
                      (user?.permissions ?? []).map((perm) => (
                        <Chip key={perm} label={perm} size="small" sx={{ height: 22, fontSize: 10, fontWeight: 600 }} />
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Change password */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Key sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
                    </Stack>
                    {!pwMode && (
                      <Button size="small" onClick={() => setPwMode(true)}>Change</Button>
                    )}
                  </Stack>

                  {pwMode && (
                    <Stack spacing={2}>
                      {pwError && <Alert severity="error">{pwError}</Alert>}
                      {resetPwMutation.isError && <Alert severity="error">Failed to change password.</Alert>}
                      <TextField
                        label="Current Password"
                        type="password"
                        size="small"
                        fullWidth
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      />
                      <TextField
                        label="New Password"
                        type="password"
                        size="small"
                        fullWidth
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                      />
                      <TextField
                        label="Confirm New Password"
                        type="password"
                        size="small"
                        fullWidth
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" size="small" onClick={() => { setPwMode(false); setPwError(''); }}>Cancel</Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={resetPwMutation.isPending ? <CircularProgress size={14} /> : <Save fontSize="small" />}
                          onClick={handlePwSubmit}
                          disabled={resetPwMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword}
                        >
                          Update Password
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {!pwMode && (
                    <Typography variant="body2" color="text.secondary">
                      Protect your account with a strong password. Use at least 8 characters including numbers and symbols.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
