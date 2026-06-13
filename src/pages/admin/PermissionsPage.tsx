import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, alpha, useTheme, InputAdornment, Accordion,
  AccordionSummary, AccordionDetails, Button, CircularProgress,
} from '@mui/material';
import { Search, ExpandMore, Security, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../../api/endpoints';

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

export default function PermissionsPage() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grouped' | 'table'>('grouped');

  const { data: rawPermissions, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionsApi.list,
    retry: false,
  });

  const permissions: { id: string; code: string; description: string; module: string }[] =
    Array.isArray(rawPermissions) ? rawPermissions : ((rawPermissions as any)?.data ?? []);

  const permissionGroups = useMemo(() => {
    const map = new Map<string, typeof permissions>();
    for (const p of permissions) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries()).map(([module, perms]) => ({
      module,
      color: MODULE_COLORS[module] ?? theme.palette.primary.main,
      permissions: perms,
    }));
  }, [permissions, theme]);

  const filteredGroups = useMemo(() => {
    if (!search) return permissionGroups;
    const q = search.toLowerCase();
    return permissionGroups.map((g) => ({
      ...g,
      permissions: g.permissions.filter(
        (p) => p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      ),
    })).filter((g) => g.permissions.length > 0 || g.module.toLowerCase().includes(q));
  }, [permissionGroups, search]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Permissions Registry</Typography>
          <Typography variant="body2" color="text.secondary">
            Fixed system catalog — permissions are pre-defined and cannot be added or removed. Assign them to any role via Role Management.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant={view === 'grouped' ? 'contained' : 'outlined'} size="small" onClick={() => setView('grouped')}>
            Grouped
          </Button>
          <Button variant={view === 'table' ? 'contained' : 'outlined'} size="small" onClick={() => setView('table')}>
            Table
          </Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ minWidth: 160 }}>
          <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {isLoading ? '…' : permissions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Total Permissions</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160 }}>
          <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.success.main }}>
              {isLoading ? '…' : permissionGroups.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Modules</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Search */}
      <TextField
        size="small" placeholder="Search permissions…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
        sx={{ mb: 3, width: 360 }}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : view === 'grouped' ? (
        <Stack spacing={1.5}>
          {filteredGroups.map((group) => (
            <Accordion
              key={group.module}
              defaultExpanded={filteredGroups.length <= 3}
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: `4px solid ${group.color}`,
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      bgcolor: alpha(group.color, 0.12),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Security sx={{ fontSize: 16, color: group.color }} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>{group.module}</Typography>
                  <Chip
                    label={`${group.permissions.length} permissions`}
                    size="small"
                    sx={{ height: 20, fontSize: 11, bgcolor: alpha(group.color, 0.1), color: group.color }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1 }}>
                  {group.permissions.map((perm) => (
                    <Box
                      key={perm.id}
                      sx={{
                        p: 1.5, borderRadius: 1.5,
                        border: `1px solid ${alpha(group.color, 0.2)}`,
                        bgcolor: alpha(group.color, 0.03),
                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 16, color: group.color, mt: 0.25, flexShrink: 0 }} />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: group.color, display: 'block' }}
                        >
                          {perm.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                          {perm.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Permission Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGroups.flatMap((g) =>
                  g.permissions.map((p) => (
                    <TableRow key={p.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: g.color }}>
                          {p.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 13 }}>{p.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={g.module}
                          size="small"
                          sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: alpha(g.color, 0.1), color: g.color }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
