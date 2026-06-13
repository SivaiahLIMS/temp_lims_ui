import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, Build, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calibrationsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  OVERDUE: 'error',
  PENDING_APPROVAL: 'warning',
};

export default function CalibrationsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<any | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [form, setForm] = useState({ instrumentId: '', scheduledDate: '', type: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calibrations', currentBranchId, statusFilter],
    queryFn: () => calibrationsApi.list(currentBranchId, statusFilter || undefined),
    retry: false,
  });

  const calibrations: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => calibrationsApi.create({
      instrumentId: Number(form.instrumentId),
      scheduledDate: form.scheduledDate,
      type: form.type,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ instrumentId: '', scheduledDate: '', type: '' });
      queryClient.invalidateQueries({ queryKey: ['calibrations', currentBranchId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => calibrationsApi.complete(id, { notes: completeNotes, completedAt: new Date().toISOString() }, currentBranchId),
    onSuccess: () => {
      setCompleteTarget(null);
      setCompleteNotes('');
      queryClient.invalidateQueries({ queryKey: ['calibrations', currentBranchId] });
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Calibration Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule and track instrument calibrations across the branch.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="OVERDUE">Overdue</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Schedule Calibration
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load calibrations from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : calibrations.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Build sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No calibrations found</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            Schedule Calibration
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Instrument</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calibrations.map((cal: any) => (
                <TableRow key={cal.id} hover sx={{ bgcolor: cal.status === 'OVERDUE' ? alpha(theme.palette.error.main, 0.02) : 'transparent' }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      CAL-{cal.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cal.instrument?.name ?? cal.instrumentName ?? `Instrument #${cal.instrumentId}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cal.type ?? cal.calibrationType ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {cal.scheduledDate ? new Date(cal.scheduledDate).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cal.status ?? 'SCHEDULED'}
                      size="small"
                      color={STATUS_COLORS[cal.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {(cal.status === 'SCHEDULED' || cal.status === 'IN_PROGRESS') && (
                      <Button size="small" variant="outlined" color="success" onClick={() => setCompleteTarget(cal)}>
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Schedule Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Schedule Calibration</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Instrument ID" fullWidth value={form.instrumentId} onChange={(e) => setForm((p) => ({ ...p, instrumentId: e.target.value }))} type="number" required />
            <TextField label="Type" fullWidth value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Full Calibration, Verification" />
            <TextField label="Scheduled Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))} required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.instrumentId || !form.scheduledDate || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={!!completeTarget} onClose={() => setCompleteTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Complete Calibration</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Completing calibration CAL-{completeTarget?.id} for {completeTarget?.instrument?.name ?? `Instrument #${completeTarget?.instrumentId}`}.
          </Alert>
          <TextField
            label="Completion Notes"
            fullWidth multiline minRows={3}
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            placeholder="Record calibration results and observations..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCompleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => completeMutation.mutate(completeTarget?.id)}
            disabled={completeMutation.isPending}
            startIcon={completeMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
