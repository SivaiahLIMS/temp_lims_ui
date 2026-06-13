import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, IconButton, Tooltip, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Checkbox, Divider,
  InputAdornment, Accordion, AccordionSummary, AccordionDetails,
  LinearProgress, Skeleton,
} from '@mui/material';
import {
  Add, Search, Close, Shield, ExpandMore,
  SaveAlt, LockOpen, TaskAlt, RadioButtonUnchecked,
  Layers, Tune, GroupWork, BlockOutlined,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi } from '../../api/endpoints';

// ─── Static fallback data (used when backend isn't ready yet) ────────────────
const FALLBACK_PERMISSIONS: PermissionItem[] = [
  { id: 1, code: 'USER_VIEW', description: 'View users', module: 'System Administration' },
  { id: 2, code: 'USER_CREATE', description: 'Create users', module: 'System Administration' },
  { id: 3, code: 'USER_EDIT', description: 'Edit users', module: 'System Administration' },
  { id: 4, code: 'USER_DELETE', description: 'Delete users', module: 'System Administration' },
  { id: 5, code: 'USER_ASSIGN_ROLE', description: 'Assign roles to users', module: 'System Administration' },
  { id: 6, code: 'ROLE_VIEW', description: 'View roles', module: 'System Administration' },
  { id: 7, code: 'ROLE_CREATE', description: 'Create roles', module: 'System Administration' },
  { id: 8, code: 'ROLE_EDIT', description: 'Edit roles', module: 'System Administration' },
  { id: 9, code: 'ROLE_DELETE', description: 'Delete roles', module: 'System Administration' },
  { id: 10, code: 'ROLE_PERMISSION_MAP', description: 'Map permissions to roles', module: 'System Administration' },
  { id: 11, code: 'CHEMICAL_VIEW', description: 'View chemicals', module: 'Chemical Module' },
  { id: 12, code: 'CHEMICAL_REGISTER', description: 'Register chemicals', module: 'Chemical Module' },
  { id: 13, code: 'CHEMICAL_EDIT', description: 'Edit chemicals', module: 'Chemical Module' },
  { id: 14, code: 'CHEMICAL_ISSUE', description: 'Issue chemicals', module: 'Chemical Module' },
  { id: 15, code: 'CHEMICAL_STOCK_VIEW', description: 'View chemical stock', module: 'Chemical Module' },
  { id: 16, code: 'CHEMICAL_STOCK_ADJUST', description: 'Adjust chemical stock', module: 'Chemical Module' },
  { id: 17, code: 'INSTRUMENT_VIEW', description: 'View instruments', module: 'Instrument Module' },
  { id: 18, code: 'INSTRUMENT_CREATE', description: 'Create instruments', module: 'Instrument Module' },
  { id: 19, code: 'CALIBRATION_EXECUTE', description: 'Execute calibration', module: 'Instrument Module' },
  { id: 20, code: 'CALIBRATION_APPROVE', description: 'Approve calibration', module: 'Instrument Module' },
  { id: 21, code: 'SAMPLE_REGISTER', description: 'Register samples', module: 'Sample & Test Module' },
  { id: 22, code: 'SAMPLE_VIEW', description: 'View samples', module: 'Sample & Test Module' },
  { id: 23, code: 'TEST_EXECUTE', description: 'Execute tests', module: 'Sample & Test Module' },
  { id: 24, code: 'TEST_APPROVE', description: 'Approve tests', module: 'Sample & Test Module' },
  { id: 25, code: 'RESULT_ENTER', description: 'Enter test results', module: 'Sample & Test Module' },
  { id: 26, code: 'RESULT_APPROVE', description: 'Approve test results', module: 'Sample & Test Module' },
  { id: 27, code: 'DEVIATION_VIEW', description: 'View deviations', module: 'QA / QC Module' },
  { id: 28, code: 'DEVIATION_CREATE', description: 'Create deviations', module: 'QA / QC Module' },
  { id: 29, code: 'OOS_VIEW', description: 'View OOS cases', module: 'QA / QC Module' },
  { id: 30, code: 'OOS_APPROVE', description: 'Approve OOS cases', module: 'QA / QC Module' },
  { id: 31, code: 'CAPA_VIEW', description: 'View CAPA', module: 'QA / QC Module' },
  { id: 32, code: 'CAPA_CREATE', description: 'Create CAPA', module: 'QA / QC Module' },
  { id: 33, code: 'AUDIT_VIEW', description: 'View audit trail', module: 'QA / QC Module' },
];

const FALLBACK_ROLES: RoleItem[] = [
  { id: 1, code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system access', isSystem: true },
  { id: 2, code: 'LAB_MANAGER', name: 'Lab Manager', description: 'Lab management and approvals', isSystem: false },
  { id: 3, code: 'ANALYST', name: 'Analyst', description: 'Test execution and result entry', isSystem: false },
  { id: 4, code: 'REVIEWER', name: 'Reviewer', description: 'Result review and approval', isSystem: false },
  { id: 5, code: 'QA_MANAGER', name: 'QA Manager', description: 'Quality assurance management', isSystem: false },
  { id: 6, code: 'VIEWER', name: 'Read-Only Viewer', description: 'Read-only access to all modules', isSystem: true },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface PermissionItem {
  id: number;
  code: string;
  description: string;
  module: string;
}

interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissionCount?: number;
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#B71C1C',
  LAB_MANAGER: '#1565C0',
  ANALYST: '#2E7D32',
  REVIEWER: '#E65100',
  APPROVER: '#AD1457',
  INVENTORY_MANAGER: '#00695C',
  INSTRUMENT_MANAGER: '#0277BD',
  QA_MANAGER: '#AD1457',
  PURCHASER: '#558B2F',
  VIEWER: '#546E7A',
};

const MODULE_COLORS: Record<string, string> = {
  'System Administration': '#B71C1C',
  'Chemical Module': '#1565C0',
  'Instrument Module': '#0277BD',
  'Inventory Module': '#2E7D32',
  'Supplier Module': '#558B2F',
  'OMS Module': '#E65100',
  'QA / QC Module': '#AD1457',
  'Sample & Test Module': '#00695C',
  'AI Module': '#37474F',
  'Dashboard Widgets': '#546E7A',
};

function roleColor(code: string, fallback: string) {
  return ROLE_COLORS[code] ?? fallback;
}
function moduleColor(module: string, fallback: string) {
  return MODULE_COLORS[module] ?? fallback;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normaliseRoles(data: unknown): RoleItem[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((r: any) => ({
    id: r.id,
    code: r.code ?? r.roleCode ?? '',
    name: r.name ?? r.roleName ?? r.code ?? '',
    description: r.description ?? '',
    isSystem: r.isSystem ?? r.system ?? false,
    permissionCount: r.permissionCount,
  }));
}

function normalisePermissions(data: unknown): PermissionItem[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((p: any) => ({
    id: p.id,
    code: p.code ?? p.permissionCode ?? '',
    description: p.description ?? '',
    module: p.module ?? p.moduleName ?? p.group ?? 'General',
  }));
}

function normaliseRolePerms(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.map((p: any) => p.code ?? p.permissionCode ?? p ?? '').filter(Boolean);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function RoleCardSkeleton() {
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="rounded" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </Box>
        </Stack>
        <Skeleton width="80%" height={16} />
        <Skeleton width="50%" height={16} />
      </Stack>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RolesPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // List state
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ code: '', name: '', description: '' });

  // Permission dialog
  const [permOpen, setPermOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleItem | null>(null);
  const [permSearch, setPermSearch] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  // Deactivate dialog (audit-safe — sets active=false, never deletes)
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [roleToDeactivate, setRoleToDeactivate] = useState<RoleItem | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: rawRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
    retry: false,
  });

  const { data: rawPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionsApi.list,
    retry: false,
  });

  const { data: rawRolePerms, isFetching: rolePermsFetching } = useQuery({
    queryKey: ['role-permissions', activeRole?.id],
    queryFn: () => rolesApi.getPermissions(activeRole!.id),
    enabled: !!activeRole,
    retry: false,
  });

  const roles = normaliseRoles(rawRoles);
  const allPermissions = normalisePermissions(rawPermissions);

  // Populate checked set when role permissions load
  useEffect(() => {
    if (permOpen && !rolePermsFetching) {
      setChecked(new Set(normaliseRolePerms(rawRolePerms)));
    }
  }, [rawRolePerms, permOpen, rolePermsFetching]);

  // ── Grouped permissions ────────────────────────────────────────────────────
  const permGroups = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of allPermissions) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries()).map(([module, perms]) => ({ module, perms }));
  }, [allPermissions]);

  const filteredPermGroups = useMemo(() => {
    if (!permSearch) return permGroups;
    const q = permSearch.toLowerCase();
    return permGroups
      .map((g) => ({
        ...g,
        perms: g.perms.filter(
          (p) =>
            p.code.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            g.module.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.perms.length > 0);
  }, [permGroups, permSearch]);

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.code.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase())
      ),
    [roles, search]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setCreateOpen(false);
      setNewRole({ code: '', name: '', description: '' });
    },
  });

  const setPermsMutation = useMutation({
    mutationFn: ({ id, codes }: { id: number; codes: string[] }) =>
      rolesApi.setPermissions(id, codes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', activeRole?.id] });
      setPermOpen(false);
      setSaveError(null);
    },
    onError: (err: any) => setSaveError(err.message ?? 'Failed to save permissions'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => rolesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeactivateOpen(false);
      setRoleToDeactivate(null);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openPermDialog = (role: RoleItem) => {
    setActiveRole(role);
    setChecked(new Set());
    setPermSearch('');
    setSaveError(null);
    setPermOpen(true);
  };

  const togglePerm = (code: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  const toggleGroup = (perms: PermissionItem[]) => {
    const codes = perms.map((p) => p.code);
    const allOn = codes.every((c) => checked.has(c));
    setChecked((prev) => {
      const next = new Set(prev);
      if (allOn) codes.forEach((c) => next.delete(c));
      else codes.forEach((c) => next.add(c));
      return next;
    });
  };

  const selectAll = () => setChecked(new Set(allPermissions.map((p) => p.code)));
  const clearAll = () => setChecked(new Set());

  const handleSavePermissions = () => {
    if (!activeRole) return;
    setPermsMutation.mutate({ id: activeRole.id, codes: Array.from(checked) });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3 }}>

      {/* ── Page Header ── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Roles Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Create custom roles and map any combination of permissions from the fixed catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          New Role
        </Button>
      </Stack>

      {/* ── Stats bar ── */}
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3 }}>
        {[
          { label: 'Total Roles', value: roles.length, icon: <Layers fontSize="small" />, color: theme.palette.primary.main },
          { label: 'Permissions Catalog', value: allPermissions.length, icon: <Tune fontSize="small" />, color: theme.palette.success.main },
          { label: 'Modules', value: permGroups.length, icon: <GroupWork fontSize="small" />, color: theme.palette.warning.main },
        ].map((s) => (
          <Card key={s.label} sx={{ minWidth: 170, flex: '0 0 auto' }}>
            <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Box sx={{ color: s.color }}>{s.icon}</Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* ── Search ── */}
      <TextField
        size="small"
        placeholder="Search roles by name, code or description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, width: 380 }}
      />

      {/* ── Role Cards Grid ── */}
      {rolesLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => <RoleCardSkeleton key={i} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 2 }}>
          {filteredRoles.map((role) => {
            const color = roleColor(role.code, theme.palette.primary.main);
            const permCount = role.permissionCount;
            return (
              <Card
                key={role.id}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderTop: `3px solid ${color}`,
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  '&:hover': { boxShadow: theme.shadows[6], transform: 'translateY(-1px)' },
                }}
              >
                <CardContent sx={{ pb: '12px !important' }}>
                  {/* Role header */}
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                          bgcolor: alpha(color, 0.12),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Shield sx={{ fontSize: 20, color }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{role.name}</Typography>
                        <Chip
                          label={role.code}
                          size="small"
                          sx={{
                            height: 18, fontSize: 10, fontWeight: 700,
                            bgcolor: alpha(color, 0.1), color,
                            fontFamily: 'monospace', letterSpacing: 0.3,
                          }}
                        />
                      </Box>
                    </Stack>
                    {role.isSystem && (
                      <Tooltip title="System role — protected">
                        <LockOpen fontSize="small" sx={{ color: 'text.disabled', mt: 0.5, flexShrink: 0 }} />
                      </Tooltip>
                    )}
                  </Stack>

                  {/* Description */}
                  <Typography
                    variant="body2" color="text.secondary"
                    sx={{ mb: 2, fontSize: 12.5, minHeight: 32, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {role.description || 'No description provided.'}
                  </Typography>

                  {/* Permission count bar */}
                  {permCount != null && allPermissions.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Permissions</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color }}>
                          {permCount} / {allPermissions.length}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(permCount / allPermissions.length) * 100}
                        sx={{
                          height: 4, borderRadius: 2,
                          bgcolor: alpha(color, 0.12),
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
                        }}
                      />
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Actions */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Chip
                      icon={<Tune sx={{ fontSize: '14px !important' }} />}
                      label={permCount != null ? `${permCount} permissions` : 'Configure'}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Assign permissions to this role">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Tune fontSize="small" />}
                          onClick={() => openPermDialog(role)}
                          sx={{ fontSize: 11, py: 0.5 }}
                        >
                          Permissions
                        </Button>
                      </Tooltip>
                      {!role.isSystem && (
                        <Tooltip title="Deactivate role (audit-safe — marks as inactive, never deletes)">
                          <IconButton
                            size="small"
                            onClick={() => { setRoleToDeactivate(role); setDeactivateOpen(true); }}
                            sx={{ color: theme.palette.warning.dark }}
                          >
                            <BlockOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

          {/* "New Role" add card */}
          <Card
            onClick={() => setCreateOpen(true)}
            sx={{
              border: `2px dashed ${theme.palette.divider}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', minHeight: 200,
              transition: 'border-color 0.2s, background 0.2s',
              '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.03) },
            }}
          >
            <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Add sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
              </Box>
              <Typography variant="body2" fontWeight={600} color="primary">Create New Role</Typography>
              <Typography variant="caption" color="text.secondary" align="center" sx={{ px: 2 }}>
                Define a custom role and assign any permissions from the catalog
              </Typography>
            </Stack>
          </Card>
        </Box>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          PERMISSION ASSIGNMENT DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={permOpen}
        onClose={() => setPermOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 2 } }}
      >
        {/* Dialog header */}
        <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {activeRole && (
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: alpha(roleColor(activeRole.code, theme.palette.primary.main), 0.12),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield sx={{ fontSize: 18, color: roleColor(activeRole.code, theme.palette.primary.main) }} />
                  </Box>
                )}
                <Box>
                  <Typography variant="h6" fontWeight={700}>Assign Permissions</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeRole?.name} &mdash; {activeRole?.code}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <IconButton size="small" onClick={() => setPermOpen(false)}><Close fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>

        {/* Selected count + search + bulk controls */}
        <Box sx={{ px: 3, pt: 2, pb: 1.5, flexShrink: 0 }}>
          {/* Progress indicator */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {rolePermsFetching
                ? 'Loading current permissions…'
                : <><strong style={{ color: theme.palette.primary.main }}>{checked.size}</strong> of {allPermissions.length} permissions selected</>
              }
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={selectAll} sx={{ fontSize: 11 }}>
                Select All
              </Button>
              <Button size="small" variant="text" color="inherit" onClick={clearAll} sx={{ fontSize: 11, color: 'text.secondary' }}>
                Clear All
              </Button>
            </Stack>
          </Stack>
          {allPermissions.length > 0 && (
            <LinearProgress
              variant="determinate"
              value={rolePermsFetching ? 0 : (checked.size / allPermissions.length) * 100}
              sx={{ height: 5, borderRadius: 3, mb: 1.5 }}
            />
          )}

          {/* Search */}
          <TextField
            size="small" fullWidth
            placeholder="Search permissions by code, description or module…"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: permSearch && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setPermSearch('')}><Close fontSize="small" /></IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        {/* Permission groups */}
        <DialogContent sx={{ flex: 1, overflowY: 'auto', px: 3, py: 1.5 }}>
          {rolePermsFetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredPermGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" color="text.secondary">No permissions match your search.</Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {filteredPermGroups.map((group) => {
                const mColor = moduleColor(group.module, theme.palette.primary.main);
                const groupCodes = group.perms.map((p) => p.code);
                const checkedCount = groupCodes.filter((c) => checked.has(c)).length;
                const allOn = checkedCount === group.perms.length;
                const someOn = checkedCount > 0 && !allOn;

                return (
                  <Accordion
                    key={group.module}
                    defaultExpanded
                    elevation={0}
                    sx={{
                      border: `1px solid ${alpha(mColor, 0.25)}`,
                      borderLeft: `4px solid ${mColor}`,
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': { margin: 0 },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ px: 2, minHeight: '48px !important', '& .MuiAccordionSummary-content': { my: '10px !important' } }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                        <Checkbox
                          size="small"
                          checked={allOn}
                          indeterminate={someOn}
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group.perms); }}
                          sx={{ p: 0.25, color: mColor, '&.Mui-checked': { color: mColor }, '&.MuiCheckbox-indeterminate': { color: mColor } }}
                        />
                        <Typography variant="subtitle2" fontWeight={700}>{group.module}</Typography>
                        <Chip
                          label={`${checkedCount} / ${group.perms.length}`}
                          size="small"
                          sx={{
                            height: 20, fontSize: 11, fontWeight: 600,
                            bgcolor: alpha(mColor, 0.1), color: mColor,
                          }}
                        />
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: 0.75,
                        }}
                      >
                        {group.perms.map((perm) => {
                          const on = checked.has(perm.code);
                          return (
                            <Box
                              key={perm.code}
                              onClick={() => togglePerm(perm.code)}
                              sx={{
                                display: 'flex', alignItems: 'flex-start', gap: 1,
                                p: 1.25, borderRadius: 1.5, cursor: 'pointer',
                                border: `1px solid ${on ? alpha(mColor, 0.4) : alpha(theme.palette.divider, 0.8)}`,
                                bgcolor: on ? alpha(mColor, 0.06) : 'transparent',
                                transition: 'background 0.12s, border-color 0.12s',
                                '&:hover': {
                                  bgcolor: on ? alpha(mColor, 0.1) : alpha(theme.palette.action.hover, 0.6),
                                  borderColor: alpha(mColor, 0.5),
                                },
                              }}
                            >
                              {/* Custom checkbox icon */}
                              <Box sx={{ flexShrink: 0, mt: 0.1, color: on ? mColor : theme.palette.text.disabled }}>
                                {on
                                  ? <TaskAlt sx={{ fontSize: 18 }} />
                                  : <RadioButtonUnchecked sx={{ fontSize: 18 }} />
                                }
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700, display: 'block',
                                    color: on ? mColor : 'text.primary',
                                  }}
                                >
                                  {perm.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, lineHeight: 1.4 }}>
                                  {perm.description}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}

          {saveError && (
            <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            <strong>{checked.size}</strong> permission{checked.size !== 1 ? 's' : ''} will be saved to <strong>{activeRole?.name}</strong>
          </Typography>
          <Button onClick={() => setPermOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={setPermsMutation.isPending ? <CircularProgress size={16} /> : <SaveAlt />}
            onClick={handleSavePermissions}
            disabled={setPermsMutation.isPending || rolePermsFetching}
          >
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>


      {/* ══════════════════════════════════════════════════════════════════════
          CREATE ROLE DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create New Role</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Role Code"
            size="small"
            fullWidth
            required
            placeholder="e.g. QC_SUPERVISOR"
            value={newRole.code}
            onChange={(e) =>
              setNewRole((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))
            }
            helperText="Uppercase letters, digits and underscores only — must be unique"
            inputProps={{ style: { fontFamily: 'monospace' } }}
          />
          <TextField
            label="Role Name"
            size="small"
            fullWidth
            required
            placeholder="e.g. QC Supervisor"
            value={newRole.name}
            onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={3}
            placeholder="What responsibilities does this role cover?"
            value={newRole.description}
            onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
          />

          <Alert severity="info" sx={{ fontSize: 12 }}>
            After creating the role you can assign permissions using the <strong>Permissions</strong> button on the role card.
          </Alert>

          {createMutation.error && (
            <Alert severity="error">{(createMutation.error as any).message}</Alert>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate(newRole)}
            disabled={createMutation.isPending || !newRole.code || !newRole.name}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>


      {/* ══════════════════════════════════════════════════════════════════════
          DEACTIVATE CONFIRM DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BlockOutlined sx={{ color: 'warning.dark' }} />
          Deactivate Role
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: deactivateMutation.error ? 1.5 : 0 }}>
            Deactivate <strong>{roleToDeactivate?.name}</strong>?<br />
            The role will be marked <strong>INACTIVE</strong> and hidden from new assignments.
            All audit history is preserved — this action can be reversed by your backend.
          </Alert>
          {deactivateMutation.error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>{(deactivateMutation.error as any).message}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeactivateOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={deactivateMutation.isPending ? <CircularProgress size={16} /> : <BlockOutlined />}
            onClick={() => roleToDeactivate && deactivateMutation.mutate(roleToDeactivate.id)}
            disabled={deactivateMutation.isPending}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
