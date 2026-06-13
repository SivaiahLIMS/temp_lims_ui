import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Tab, Tabs,
} from '@mui/material';
import { Add, Search, Refresh, Build, Warning } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success', INACTIVE: 'default', UNDER_MAINTENANCE: 'warning',
  CALIBRATION_DUE: 'warning', OUT_OF_SERVICE: 'error',
};

const EMPTY_FORM = {
  instrumentName: '', instrumentCode: '', manufacturer: '', model: '',
  serialNumber: '', location: '', calibrationFrequencyDays: '365', notes: '',
};

export default function InstrumentsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['instruments', currentBranchId],
    queryFn: () => instrumentsApi.list(currentBranchId),
    retry: false,
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () => instrumentsApi.create({ ...form, branchId: currentBranchId, calibrationFrequencyDays: Number(form.calibrationFrequencyDays) }),
    onSuccess: () => { setCreateOpen(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['instruments', currentBranchId] }); },
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    const match = !q || (r.instrumentName ?? r.name ?? '').toLowerCase().includes(q) || (r.instrumentCode ?? r.code ?? '').toLowerCase().includes(q);
    if (tab === 1) return match && r.status === 'ACTIVE';
    if (tab === 2) return match && (r.status === 'CALIBRATION_DUE' || r.status === 'UNDER_MAINTENANCE');
    return match;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Instruments</Typography>
          <Typography variant="body2" color="text.secondary">Lab instruments, calibration status, and maintenance records.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>Add Instrument</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total', v: rows.length, c: theme.palette.primary.main, icon: <Build /> },
          { l: 'Active', v: rows.filter((r: any) => r.status === 'ACTIVE').length, c: theme.palette.success.main, icon: <Build /> },
          { l: 'Cal. Due', v: rows.filter((r: any) => r.status === 'CALIBRATION_DUE').length, c: theme.palette.warning.main, icon: <Warning /> },
          { l: 'Maintenance', v: rows.filter((r: any) => r.status === 'UNDER_MAINTENANCE').length, c: theme.palette.error.main, icon: <Warning /> },
        ].map((s) => (
          <Card key={s.l} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(s.c, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.c }}>{s.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{s.v}</Typography>
                <Typography variant="caption" color="text.secondary">{s.l}</Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
            <Tab label={`All (${rows.length})`} sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label="Active" sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label="Attention Needed" sx={{ minHeight: 44, fontSize: 13 }} />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by name or code…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 300 }} />
        </Box>
        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load instruments.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Code', 'Name', 'Manufacturer / Model', 'Serial No.', 'Location', 'Cal. Frequency', 'Status', 'Last Calibrated'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No instruments found</TableCell></TableRow>
                ) : filtered.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{d.instrumentCode ?? d.code ?? `INST-${d.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.instrumentName ?? d.name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{[d.manufacturer, d.model].filter(Boolean).join(' / ') || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.serialNumber ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.location ?? d.room ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.calibrationFrequencyDays ? `${d.calibrationFrequencyDays}d` : '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'ACTIVE'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.lastCalibratedAt ? new Date(d.lastCalibratedAt).toLocaleDateString() : '—'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Instrument</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Instrument Name" fullWidth required size="small" value={form.instrumentName} onChange={(e) => setForm((p) => ({ ...p, instrumentName: e.target.value }))} />
              <TextField label="Instrument Code" fullWidth size="small" value={form.instrumentCode} onChange={(e) => setForm((p) => ({ ...p, instrumentCode: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Manufacturer" fullWidth size="small" value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} />
              <TextField label="Model" fullWidth size="small" value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Serial Number" fullWidth size="small" value={form.serialNumber} onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))} />
              <TextField label="Location / Room" fullWidth size="small" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </Stack>
            <TextField label="Calibration Frequency (days)" type="number" size="small" fullWidth value={form.calibrationFrequencyDays} onChange={(e) => setForm((p) => ({ ...p, calibrationFrequencyDays: e.target.value }))} />
            <TextField label="Notes" fullWidth multiline minRows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.instrumentName.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Add Instrument
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
