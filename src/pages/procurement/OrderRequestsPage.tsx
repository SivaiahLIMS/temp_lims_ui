import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, ShoppingCart, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderRequestsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  ORDERED: 'info',
  RECEIVED: 'success',
};

export default function OrderRequestsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ itemName: '', quantity: '', unit: '', supplierId: '', notes: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-requests', currentBranchId, statusFilter],
    queryFn: () => orderRequestsApi.list(currentBranchId, statusFilter || undefined),
    retry: false,
  });

  const orders: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => orderRequestsApi.create({
      itemName: form.itemName,
      quantity: Number(form.quantity),
      unit: form.unit,
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      notes: form.notes,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ itemName: '', quantity: '', unit: '', supplierId: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['order-requests', currentBranchId] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => orderRequestsApi.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-requests', currentBranchId] }),
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Order Requests</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and track procurement requests for chemicals, supplies, and equipment.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="ORDERED">Ordered</MenuItem>
              <MenuItem value="RECEIVED">Received</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Request
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load order requests from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <ShoppingCart sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No order requests found</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            New Request
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order: any) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      ORD-{order.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.itemName ?? order.item ?? '—'}</Typography>
                    {order.notes && (
                      <Typography variant="caption" color="text.secondary">{order.notes}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.quantity} {order.unit ?? ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {order.supplier?.name ?? order.supplierName ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={order.status ?? 'DRAFT'} size="small" color={STATUS_COLORS[order.status] ?? 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {order.status === 'DRAFT' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => submitMutation.mutate(order.id)}
                        disabled={submitMutation.isPending}
                      >
                        Submit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Order Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Item Name" fullWidth value={form.itemName} onChange={(e) => setForm((p) => ({ ...p, itemName: e.target.value }))} required />
            <Stack direction="row" spacing={2}>
              <TextField label="Quantity" type="number" fullWidth value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
              <TextField label="Unit" fullWidth value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="mL, kg, pcs" />
            </Stack>
            <TextField label="Supplier ID (optional)" type="number" fullWidth value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))} />
            <TextField label="Notes" fullWidth multiline minRows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.itemName.trim() || !form.quantity || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
