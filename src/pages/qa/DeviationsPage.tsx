import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme, Tab, Tabs,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add, Search, Warning, Close, CheckCircle, Refresh,
  Error as ErrorIcon, ReportGmailerrorred as ReportProblem,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qaApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'default' | 'success'> = {
  Critical: 'error', Major: 'warning', Minor: 'default', Moderate: 'warning',
};
const STATUS_COLOR: Record<string, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  Open: 'error', 'Under Investigation': 'warning', Closed: 'success',
  'Pending CAPA': 'info', Draft: 'default',
};

const EMPTY_FORM = {
  deviationDescription: '', severity: 'Minor', area: '', batchNumber: '',
  productName: '', immediateAction: '', rootCause: '',
};

export default function DeviationsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [closureNotes, setClosureNotes] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['deviations', currentBranchId],
    queryFn: () => qaApi.getDeviations(currentBranchId),
    retry: false,
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () => qaApi.createDeviation({ ...form, branchId: currentBranchId }),
    onSuccess: () => {
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['deviations', currentBranchId] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => qaApi.closeDeviation(id, { closureNotes, resolution: closureNotes }),
    onSuccess: () => {
      setCloseOpen(null);
      setClosureNotes('');
      queryClient.invalidateQueries({ queryKey: ['deviations', currentBranchId] });
    },
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (r.deviationCode ?? r.code ?? '').toLowerCase().includes(q) ||
      (r.deviationDescription ?? r.title ?? '').toLowerCase().includes(q);
    const status = r.status ?? 'Open';
    if (tab === 1) return matchesSearch && status === 'Open';
    if (tab === 2) return matchesSearch && (status === 'Under Investigation' || status === 'Pending CAPA');
    if (tab === 3) return matchesSearch && status === 'Closed';
    return matchesSearch;
  });

  const counts = {
    all: rows.length,
    open: rows.filter((r: any) => r.status === 'Open').length,
    active: rows.filter((r: any) => ['Under Investigation', 'Pending CAPA'].includes(r.status)).length,
    closed: rows.filter((r: any) => r.status === 'Closed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Deviations</Typography>
          <Typography variant="body2" color="text.secondary">Track, investigate, and close quality deviations.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Deviation
          </Button>
        </Stack>
      </Stack>

      {/* KPI strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Total', value: counts.all, color: theme.palette.primary.main, icon: <ReportProblem /> },
          { label: 'Open', value: counts.open, color: theme.palette.error.main, icon: <ErrorIcon /> },
          { label: 'In Progress', value: counts.active, color: theme.palette.warning.main, icon: <Warning /> },
          { label: 'Closed', value: counts.closed, color: theme.palette.success.main, icon: <CheckCircle /> },
        ].map((s) => (
          <Card key={s.label} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(s.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
            <Tab label={`All (${counts.all})`} sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label={`Open (${counts.open})`} sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label={`In Progress (${counts.active})`} sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label={`Closed (${counts.closed})`} sx={{ minHeight: 44, fontSize: 13 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            placeholder="Search by ID or description…"
            size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ width: 320 }}
          />
        </Box>

        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load deviations from server.</Alert>}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['ID', 'Description', 'Severity', 'Area', 'Status', 'Raised By', 'Date', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      No deviations found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{d.deviationCode ?? d.code ?? `DEV-${d.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 240 }} noWrap title={d.deviationDescription ?? d.title ?? ''}>{d.deviationDescription ?? d.title ?? '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.severity ?? 'Minor'} size="small" color={SEVERITY_COLOR[d.severity] ?? 'default'} /></TableCell>
                    <TableCell><Typography variant="body2">{d.area ?? d.department ?? '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'Open'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                    <TableCell><Typography variant="body2">{d.raisedBy?.username ?? d.raisedByName ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell>
                      {d.status !== 'Closed' && (
                        <Tooltip title="Close deviation">
                          <Button size="small" variant="outlined" color="success" startIcon={<Close fontSize="small" />}
                            onClick={() => setCloseOpen(d.id)} sx={{ fontSize: 11 }}>
                            Close
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Deviation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Description" fullWidth multiline minRows={2} required
              value={form.deviationDescription} onChange={(e) => setForm((p) => ({ ...p, deviationDescription: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={form.severity} label="Severity" onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}>
                  {['Minor', 'Moderate', 'Major', 'Critical'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Area / Department" size="small" fullWidth value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Product Name" size="small" fullWidth value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} />
              <TextField label="Batch Number" size="small" fullWidth value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} />
            </Stack>
            <TextField label="Immediate Action Taken" fullWidth multiline minRows={2}
              value={form.immediateAction} onChange={(e) => setForm((p) => ({ ...p, immediateAction: e.target.value }))} />
            <TextField label="Root Cause (if known)" fullWidth multiline minRows={2}
              value={form.rootCause} onChange={(e) => setForm((p) => ({ ...p, rootCause: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.deviationDescription.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Create Deviation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeOpen !== null} onClose={() => setCloseOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Close Deviation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Closure Notes / Resolution Summary" fullWidth multiline minRows={3} required
            value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCloseOpen(null)}>Cancel</Button>
          <Button variant="contained" color="success" disabled={!closureNotes.trim() || closeMutation.isPending}
            startIcon={closeMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={() => closeOpen !== null && closeMutation.mutate(closeOpen)}>
            Close Deviation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
