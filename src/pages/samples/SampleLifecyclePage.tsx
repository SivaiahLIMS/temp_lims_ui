import React, { useState, useMemo } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import {
  Add, Search, Refresh, ArrowForward, Biotech,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { samplesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

type SampleStatus =
  | 'REGISTERED' | 'RECEIVED' | 'ASSIGNED' | 'IN_PROGRESS'
  | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';

const SAMPLE_STATUSES: SampleStatus[] = [
  'REGISTERED', 'RECEIVED', 'ASSIGNED', 'IN_PROGRESS',
  'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED',
];

const STATUS_COLORS: Record<SampleStatus, string> = {
  REGISTERED: '#9CA3AF',
  RECEIVED: '#3B82F6',
  ASSIGNED: '#06B6D4',
  IN_PROGRESS: '#4F46E5',
  UNDER_REVIEW: '#F59E0B',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
  CLOSED: '#6B7280',
};

const STATUS_CHIP: Record<SampleStatus, 'default' | 'primary' | 'error' | 'info' | 'success' | 'warning'> = {
  REGISTERED: 'default',
  RECEIVED: 'info',
  ASSIGNED: 'primary',
  IN_PROGRESS: 'primary',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CLOSED: 'default',
};

const EMPTY_FORM = {
  sampleCode: '', sampleName: '', testType: '', priority: 'NORMAL',
  notes: '', productName: '', batchNumber: '',
};

export default function SampleLifecyclePage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['samples', currentBranchId],
    queryFn: () => samplesApi.list(currentBranchId),
    retry: false,
  });

  const raw: any = data;
  const samples: any[] = Array.isArray(raw?.data ?? raw) ? (raw?.data ?? raw) : [];

  const createMutation = useMutation({
    mutationFn: () => samplesApi.register({
      ...form,
      branchId: currentBranchId,
      sampleType: form.testType || 'GENERAL',
    }),
    onSuccess: () => {
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['samples', currentBranchId] });
    },
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SAMPLE_STATUSES.forEach((s) => { counts[s] = 0; });
    samples.forEach((s: any) => {
      const st: string = s.status ?? 'REGISTERED';
      counts[st] = (counts[st] ?? 0) + 1;
    });
    return counts;
  }, [samples]);

  const filtered = useMemo(() => {
    return samples.filter((s: any) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.sampleCode ?? s.code ?? '').toLowerCase().includes(q) ||
        (s.sampleName ?? s.name ?? s.productName ?? '').toLowerCase().includes(q) ||
        (s.testType ?? s.sampleType ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || (s.status ?? 'REGISTERED') === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [samples, search, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Sample Lifecycle</Typography>
          <Typography variant="body2" color="text.secondary">Track sample progression through the lab workflow.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Register Sample</Button>
        </Stack>
      </Stack>

      {/* Workflow Stepper */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, mb: 2, display: 'block' }}>
          Workflow Status Overview
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: 'auto', pb: 1 }}>
          {SAMPLE_STATUSES.map((status, idx) => (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Box
                onClick={() => setStatusFilter(status === statusFilter ? 'ALL' : status)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 80,
                  p: 1.5,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: statusFilter === status ? STATUS_COLORS[status] : 'transparent',
                  bgcolor: alpha(STATUS_COLORS[status], 0.08),
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: STATUS_COLORS[status] },
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: STATUS_COLORS[status] }}>
                  {statusCounts[status] ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', textAlign: 'center', lineHeight: 1.2 }}>
                  {status.replace(/_/g, ' ')}
                </Typography>
              </Box>
              {idx < SAMPLE_STATUSES.length - 1 && (
                <ArrowForward sx={{ color: 'divider', fontSize: 18, mx: 0.5 }} />
              )}
            </Box>
          ))}
        </Stack>
      </Card>

      {/* Table */}
      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              placeholder="Search by Sample ID, Product, or Test Type..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={statusFilter} label="Filter by Status" onChange={(e) => setStatusFilter(e.target.value as SampleStatus | 'ALL')}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                {SAMPLE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')} ({statusCounts[s] ?? 0})</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load samples from server.</Alert>}
        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

        {!isLoading && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Sample ID', 'Product / Name', 'Test Type', 'Status', 'Assigned To', 'Received Date', 'Due Date'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <Biotech sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No samples found.</Typography>
                      <Button variant="outlined" size="small" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
                        Register First Sample
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s: any) => {
                  const status: SampleStatus = s.status ?? 'REGISTERED';
                  const sampleId = s.sampleCode ?? s.code ?? `SM-${s.id}`;
                  const name = s.sampleName ?? s.name ?? s.productName ?? '—';
                  const testType = s.testType ?? s.sampleType ?? '—';
                  const assignedTo = s.assignedTo?.username ?? s.analyst?.username ?? s.assignedToName ?? 'Unassigned';
                  const received = s.receivedAt ?? s.createdAt;
                  const due = s.dueDate ?? s.expectedCompletionDate;
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'primary.main' }}>{sampleId}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{testType}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={status.replace(/_/g, ' ')}
                          color={STATUS_CHIP[status] ?? 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: assignedTo === 'Unassigned' ? 'text.secondary' : 'text.primary' }}>
                          {assignedTo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {received ? new Date(received).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {due ? new Date(due).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!isLoading && filtered.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'right', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filtered.length} of {samples.length} samples
            </Typography>
          </Box>
        )}
      </Card>

      {/* Register Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Register Sample</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Sample Code" fullWidth size="small" value={form.sampleCode} onChange={(e) => setForm((p) => ({ ...p, sampleCode: e.target.value }))} placeholder="e.g. SM-2026-001" />
              <TextField label="Product Name" fullWidth size="small" required value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Sample Name" fullWidth size="small" value={form.sampleName} onChange={(e) => setForm((p) => ({ ...p, sampleName: e.target.value }))} />
              <TextField label="Batch Number" fullWidth size="small" value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Test Type" fullWidth size="small" value={form.testType} onChange={(e) => setForm((p) => ({ ...p, testType: e.target.value }))} placeholder="e.g. HPLC Assay, Dissolution" />
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} label="Priority" onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Notes"
              fullWidth
              size="small"
              multiline
              minRows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes or instructions..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!form.productName.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
