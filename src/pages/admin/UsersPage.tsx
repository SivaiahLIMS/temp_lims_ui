import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, IconButton, Tooltip, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Avatar, Divider,
  InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Checkbox, ListItemText, OutlinedInput,
} from '@mui/material';
import {
  Add, Edit, Lock, LockOpen, Search, Close, Key,
  PersonAdd, Shield, Security, Person, MoreVert,
  CheckCircle, Cancel, Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '../../api/endpoints';

const DEFAULT_ROLES = [
  { id: 1, code: 'SUPER_ADMIN', name: 'Super Administrator' },
  { id: 2, code: 'LAB_MANAGER', name: 'Lab Manager' },
  { id: 3, code: 'ANALYST', name: 'Analyst' },
  { id: 4, code: 'REVIEWER', name: 'Reviewer' },
  { id: 5, code: 'APPROVER', name: 'Approver' },
  { id: 6, code: 'INVENTORY_MANAGER', name: 'Inventory Manager' },
  { id: 7, code: 'INSTRUMENT_MANAGER', name: 'Instrument Manager' },
  { id: 8, code: 'QA_MANAGER', name: 'QA Manager' },
  { id: 9, code: 'PURCHASER', name: 'Purchaser' },
  { id: 10, code: 'VIEWER', name: 'Read-Only Viewer' },
];

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

const PLACEHOLDER_USERS = [
  { id: 1, username: 'admin', email: 'admin@lims.lab', status: 'ACTIVE', roles: ['SUPER_ADMIN'], tenantId: 1, branchId: 1, createdAt: '2024-01-01' },
  { id: 2, username: 'lab.manager', email: 'manager@lims.lab', status: 'ACTIVE', roles: ['LAB_MANAGER'], tenantId: 1, branchId: 1, createdAt: '2024-01-05' },
  { id: 3, username: 'john.analyst', email: 'john@lims.lab', status: 'ACTIVE', roles: ['ANALYST'], tenantId: 1, branchId: 1, createdAt: '2024-02-10' },
  { id: 4, username: 'sarah.reviewer', email: 'sarah@lims.lab', status: 'ACTIVE', roles: ['REVIEWER', 'ANALYST'], tenantId: 1, branchId: 1, createdAt: '2024-02-15' },
  { id: 5, username: 'qa.manager', email: 'qa@lims.lab', status: 'ACTIVE', roles: ['QA_MANAGER'], tenantId: 1, branchId: 1, createdAt: '2024-03-01' },
  { id: 6, username: 'inv.manager', email: 'inventory@lims.lab', status: 'ACTIVE', roles: ['INVENTORY_MANAGER'], tenantId: 1, branchId: 1, createdAt: '2024-03-10' },
  { id: 7, username: 'viewer.user', email: 'viewer@lims.lab', status: 'LOCKED', roles: ['VIEWER'], tenantId: 1, branchId: 1, createdAt: '2024-04-01' },
];

interface User {
  id: number;
  username: string;
  email?: string;
  status?: string;
  roles?: string[];
  tenantId?: number;
  branchId?: number;
  createdAt?: string;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export default function UsersPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState<CreateUserForm>({
    username: '', email: '', password: '', roles: [],
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    retry: false,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
    retry: false,
  });

const users: User[] = Array.isArray(usersData) && usersData.length > 0 ? usersData : PLACEHOLDER_USERS;
  const roles = Array.isArray(rolesData) ? rolesData : DEFAULT_ROLES;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || (u.status ?? 'ACTIVE') === statusFilter;
      const matchRole =
        roleFilter === 'ALL' || (u.roles ?? []).includes(roleFilter);
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateDialogOpen(false);
      setNewUser({ username: '', email: '', password: '', roles: [] });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: unknown }) =>
      usersApi.assignRole(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssignRoleDialogOpen(false);
    },
  });

  const lockMutation = useMutation({
    mutationFn: (userId: number) => usersApi.lockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const unlockMutation = useMutation({
    mutationFn: (userId: number) => usersApi.unlockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetPwMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: unknown }) =>
      usersApi.resetPassword(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setResetPwDialogOpen(false);
      setNewPassword('');
    },
  });

  const openAssignRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles ?? []);
    setAssignRoleDialogOpen(true);
  };

  const openResetPw = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetPwDialogOpen(true);
  };

  const getRoleColor = (code: string) => ROLE_COLORS[code] ?? theme.palette.primary.main;

  const getInitials = (name: string) =>
    name.split(/[._-]/).map((s) => s[0] ?? '').join('').slice(0, 2).toUpperCase();

  const activeCount = users.filter((u) => (u.status ?? 'ACTIVE') === 'ACTIVE').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts, roles, and access control
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New User
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Users', value: users.length, color: theme.palette.primary.main },
          { label: 'Active', value: activeCount, color: theme.palette.success.main },
          { label: 'Locked', value: lockedCount, color: theme.palette.error.main },
        ].map((stat) => (
          <Card key={stat.label} sx={{ minWidth: 140 }}>
            <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
          }}
          sx={{ width: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="LOCKED">Locked</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
            <MenuItem value="ALL">All Roles</MenuItem>
            {DEFAULT_ROLES.map((r) => (
              <MenuItem key={r.code} value={r.code}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Users table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Roles</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tenant / Branch</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const isLocked = user.status === 'LOCKED';
                  const initials = getInitials(user.username);
                  return (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                        opacity: isLocked ? 0.75 : 1,
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              width: 36, height: 36, fontSize: 13, fontWeight: 700,
                              bgcolor: isLocked
                                ? theme.palette.grey[400]
                                : alpha(theme.palette.primary.main, 0.15),
                              color: isLocked ? '#fff' : theme.palette.primary.main,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                            <Typography variant="caption" color="text.secondary">ID #{user.id}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.email ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {(user.roles ?? []).length === 0 ? (
                            <Typography variant="caption" color="text.disabled">No roles</Typography>
                          ) : (
                            (user.roles ?? []).map((role) => (
                              <Chip
                                key={role}
                                label={role.replace('_', ' ')}
                                size="small"
                                sx={{
                                  height: 20, fontSize: 10, fontWeight: 700,
                                  bgcolor: alpha(getRoleColor(role), 0.12),
                                  color: getRoleColor(role),
                                }}
                              />
                            ))
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status ?? 'ACTIVE'}
                          size="small"
                          icon={isLocked ? <Lock sx={{ fontSize: '14px !important' }} /> : <CheckCircle sx={{ fontSize: '14px !important' }} />}
                          color={isLocked ? 'error' : 'success'}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          T#{user.tenantId ?? '—'} / B#{user.branchId ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          <Tooltip title="Assign roles">
                            <IconButton size="small" onClick={() => openAssignRole(user)} sx={{ color: theme.palette.primary.main }}>
                              <Shield fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset password">
                            <IconButton size="small" onClick={() => openResetPw(user)} sx={{ color: theme.palette.warning.main }}>
                              <Key fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isLocked ? (
                            <Tooltip title="Unlock user">
                              <IconButton
                                size="small"
                                onClick={() => unlockMutation.mutate(user.id)}
                                sx={{ color: theme.palette.success.main }}
                                disabled={unlockMutation.isPending}
                              >
                                <LockOpen fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Lock user">
                              <IconButton
                                size="small"
                                onClick={() => lockMutation.mutate(user.id)}
                                sx={{ color: theme.palette.error.main }}
                                disabled={lockMutation.isPending}
                              >
                                <Lock fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Create User Dialog ── */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <span>Create New User</span>
            <IconButton size="small" onClick={() => setCreateDialogOpen(false)}><Close fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Username"
            size="small"
            fullWidth
            value={newUser.username}
            onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
          />
          <TextField
            label="Password"
            size="small"
            fullWidth
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Assign Roles</InputLabel>
            <Select
              multiple
              value={newUser.roles}
              onChange={(e) => setNewUser((p) => ({ ...p, roles: typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[] }))}
              input={<OutlinedInput label="Assign Roles" />}
              renderValue={(selected) =>
                (selected as string[]).map((r) => (
                  <Chip
                    key={r}
                    label={r.replace('_', ' ')}
                    size="small"
                    sx={{ mr: 0.5, height: 20, fontSize: 10, bgcolor: alpha(getRoleColor(r), 0.12), color: getRoleColor(r) }}
                  />
                ))
              }
            >
              {DEFAULT_ROLES.map((r) => (
                <MenuItem key={r.code} value={r.code}>
                  <Checkbox checked={newUser.roles.includes(r.code)} size="small" />
                  <ListItemText primary={r.name} secondary={r.code} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <PersonAdd />}
            onClick={() => createMutation.mutate(newUser)}
            disabled={createMutation.isPending || !newUser.username || !newUser.password}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Role Dialog ── */}
      <Dialog open={assignRoleDialogOpen} onClose={() => setAssignRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={700}>Assign Roles</Typography>
              <Typography variant="caption" color="text.secondary">{selectedUser?.username}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setAssignRoleDialogOpen(false)}><Close fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select which roles to assign to this user. Changes take effect immediately.
          </Typography>
          <Stack spacing={1}>
            {DEFAULT_ROLES.map((role) => {
              const selected = selectedRoles.includes(role.code);
              const color = getRoleColor(role.code);
              return (
                <Box
                  key={role.code}
                  onClick={() => setSelectedRoles((prev) =>
                    prev.includes(role.code) ? prev.filter((r) => r !== role.code) : [...prev, role.code]
                  )}
                  sx={{
                    p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                    border: `1.5px solid ${selected ? color : theme.palette.divider}`,
                    bgcolor: selected ? alpha(color, 0.06) : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: color, bgcolor: alpha(color, 0.04) },
                  }}
                >
                  <Checkbox checked={selected} size="small" sx={{ p: 0, color: selected ? color : undefined }} onClick={(e) => e.stopPropagation()} onChange={() => {}} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{role.name}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: color, fontSize: 10 }}>{role.code}</Typography>
                  </Box>
                  {selected && <CheckCircle sx={{ fontSize: 18, color }} />}
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssignRoleDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={assignRoleMutation.isPending ? <CircularProgress size={16} /> : <Shield />}
            onClick={() =>
              selectedUser && assignRoleMutation.mutate({
                userId: selectedUser.id,
                data: { roles: selectedRoles },
              })
            }
            disabled={assignRoleMutation.isPending}
          >
            Save Roles
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reset Password Dialog ── */}
      <Dialog open={resetPwDialogOpen} onClose={() => setResetPwDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Reset Password — {selectedUser?.username}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            The user will be required to change their password on next login.
          </Alert>
          <TextField
            label="New Password"
            size="small"
            fullWidth
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setResetPwDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={resetPwMutation.isPending ? <CircularProgress size={16} /> : <Key />}
            onClick={() =>
              selectedUser && resetPwMutation.mutate({
                userId: selectedUser.id,
                data: { newPassword },
              })
            }
            disabled={resetPwMutation.isPending || !newPassword}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
