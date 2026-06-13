import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme, Tab, Tabs,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
} from '@mui/material';
import { Add, Search, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qaApi, oosApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLOR: Record<string, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  Open: 'error', 'Under Investigation': 'warning', Closed: 'success',
  'Confirmed OOS': 'error', 'Lab Error': 'default', Pending: 'info',
};

const EMPTY_FORM = {
  sampleId: '', testParameter: '', specificationLimit: '',
  observedValue: '', unit: '', analyst: '', investigationNotes: '',
};

export default function OOSPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['oos', currentBranchId],
    queryFn: () => oosApi.list(currentBranchId),
    retry: false,
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () => qaApi.createOos({ ...form, branchId: currentBranchId }),
    onSuccess: () => {
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['oos', currentBranchId] });
    },
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    const match = !q || (r.oosCode ?? r.code ?? '').toLowerCase().includes(q) || (r.testParameter ?? '').toLowerCase().includes(q);
    const status = r.status ?? 'Open';
    if (tab === 1) return match && status === 'Open';
    if (tab === 2) return match && status === 'Under Investigation';
    if (tab === 3) return match && ['Closed', 'Confirmed OOS', 'Lab Error'].includes(status);
    return match;
  });

  const counts = { all: rows.length, open: rows.filter((r: any) => r.status === 'Open').length, inv: rows.filter((r: any) => r.status === 'Under Investigation').length, closed: rows.filter((r: any) => ['Closed', 'Confirmed OOS', 'Lab Error'].includes(r.status)).length };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>OOS / OOT Events</Typography>
          <Typography variant="body2" color="text.secondary">Out-of-specification and out-of-trend investigation records.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>New OOS</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[{ l: 'Total', v: counts.all, c: theme.palette.primary.main }, { l: 'Open', v: counts.open, c: theme.palette.error.main }, { l: 'Investigating', v: counts.inv, c: theme.palette.warning.main }, { l: 'Resolved', v: counts.closed, c: theme.palette.success.main }].map((s) => (
          <Card key={s.l} sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: s.c }}>{s.v}</Typography>
            <Typography variant="caption" color="text.secondary">{s.l}</Typography>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
            {[`All (${counts.all})`, `Open (${counts.open})`, `Investigating (${counts.inv})`, `Resolved (${counts.closed})`].map((l) => <Tab key={l} label={l} sx={{ minHeight: 44, fontSize: 13 }} />)}
          </Tabs>
        </Box>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by OOS ID or parameter…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 320 }} />
        </Box>
        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load OOS events.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['OOS ID', 'Sample / Product', 'Test Parameter', 'Observed', 'Limit', 'Analyst', 'Status', 'Date'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No OOS events found</TableCell></TableRow>
                ) : filtered.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{d.oosCode ?? d.code ?? `OOS-${d.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.sampleCode ?? d.sample ?? d.sampleId ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.testParameter ?? d.parameter ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} color="error.main">{d.observedValue ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.specificationLimit ?? d.limit ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.analyst?.username ?? d.analystName ?? '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'Open'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New OOS Event</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Sample ID / Code" size="small" fullWidth required value={form.sampleId} onChange={(e) => setForm((p) => ({ ...p, sampleId: e.target.value }))} />
              <TextField label="Test Parameter" size="small" fullWidth required value={form.testParameter} onChange={(e) => setForm((p) => ({ ...p, testParameter: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Observed Value" size="small" fullWidth required value={form.observedValue} onChange={(e) => setForm((p) => ({ ...p, observedValue: e.target.value }))} />
              <TextField label="Specification Limit" size="small" fullWidth value={form.specificationLimit} onChange={(e) => setForm((p) => ({ ...p, specificationLimit: e.target.value }))} />
              <TextField label="Unit" size="small" sx={{ width: 100 }} value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
            </Stack>
            <TextField label="Analyst Name" size="small" fullWidth value={form.analyst} onChange={(e) => setForm((p) => ({ ...p, analyst: e.target.value }))} />
            <TextField label="Initial Investigation Notes" fullWidth multiline minRows={3} value={form.investigationNotes} onChange={(e) => setForm((p) => ({ ...p, investigationNotes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.sampleId.trim() || !form.testParameter.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Create OOS Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
