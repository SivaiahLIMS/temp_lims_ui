import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, Inventory, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export default function ProductsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', category: '', description: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', currentBranchId],
    queryFn: () => productsApi.list(currentBranchId),
    retry: false,
  });

  const products: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => productsApi.create({
      name: form.name,
      code: form.code,
      category: form.category,
      description: form.description,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ name: '', code: '', category: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['products', currentBranchId] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => productsApi.submit(id, currentBranchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', currentBranchId] }),
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Products</Typography>
          <Typography variant="body2" color="text.secondary">
            Register and manage product specifications for testing workflows.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Register Product
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load products from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Inventory sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No products registered</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            Register Product
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p: any) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {p.code ?? p.productCode ?? `PROD-${p.id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                    {p.description && (
                      <Typography variant="caption" color="text.secondary">
                        {p.description.substring(0, 60)}{p.description.length > 60 ? '…' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.category ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.status ?? 'DRAFT'} size="small" color={STATUS_COLORS[p.status] ?? 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {p.status === 'DRAFT' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => submitMutation.mutate(p.id)}
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
        <DialogTitle fontWeight={700}>Register Product</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Product Name" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              <TextField label="Product Code" fullWidth value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            </Stack>
            <TextField label="Category" fullWidth value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. API, Excipient, Finished Product" />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.name.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
