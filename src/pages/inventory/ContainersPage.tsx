import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Add, Inventory2, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containersApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  IN_USE: 'info',
  DISPOSED: 'error',
};

export default function ContainersPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ barcode: '', type: '', capacity: '', unit: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['containers', currentBranchId, statusFilter],
    queryFn: () => containersApi.list(currentBranchId, statusFilter || undefined),
    retry: false,
  });

  const containers: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => containersApi.create({
      barcode: form.barcode,
      type: form.type,
      capacity: Number(form.capacity),
      unit: form.unit,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ barcode: '', type: '', capacity: '', unit: '' });
      queryClient.invalidateQueries({ queryKey: ['containers', currentBranchId] });
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Containers</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage laboratory containers, reservations, and availability.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="AVAILABLE">Available</MenuItem>
              <MenuItem value="RESERVED">Reserved</MenuItem>
              <MenuItem value="IN_USE">In Use</MenuItem>
              <MenuItem value="DISPOSED">Disposed</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Add Container
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load containers from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : containers.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Inventory2 sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No containers found</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            Add Container
          </Button>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((c: any) => (
                <TableRow key={c.id ?? c.barcode} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {c.barcode ?? c.containerId ?? c.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.type ?? c.containerType ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {c.capacity != null ? `${c.capacity} ${c.unit ?? ''}` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status ?? 'UNKNOWN'}
                      size="small"
                      color={STATUS_COLORS[c.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {c.location?.name ?? c.locationName ?? '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Container</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Barcode" fullWidth value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} required />
            <TextField label="Container Type" fullWidth value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Vial, Flask, Bottle" />
            <Stack direction="row" spacing={2}>
              <TextField label="Capacity" type="number" fullWidth value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
              <TextField label="Unit" fullWidth value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="mL, L, g" />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.barcode.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
