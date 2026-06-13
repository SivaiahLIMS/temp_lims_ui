import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, Store, Star, StarBorder, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/endpoints';

export default function SuppliersPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rateTarget, setRateTarget] = useState<any | null>(null);
  const [rating, setRating] = useState('');
  const [rateComment, setRateComment] = useState('');
  const [form, setForm] = useState({ name: '', contactEmail: '', phone: '', address: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
    retry: false,
  });

  const suppliers: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => suppliersApi.create({ name: form.name, contactEmail: form.contactEmail, phone: form.phone, address: form.address }),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ name: '', contactEmail: '', phone: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.rateSupplier(id, { rating: Number(rating), comment: rateComment }),
    onSuccess: () => {
      setRateTarget(null);
      setRating('');
      setRateComment('');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  function renderStars(score: number) {
    return Array.from({ length: 5 }).map((_, i) =>
      i < score
        ? <Star key={i} fontSize="small" sx={{ color: '#F59E0B' }} />
        : <StarBorder key={i} fontSize="small" sx={{ color: theme.palette.divider }} />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Suppliers</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage approved suppliers and vendor performance ratings.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Add Supplier
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load suppliers from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : suppliers.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Store sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No suppliers registered</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            Add Supplier
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((s: any) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.contactEmail ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.phone ?? ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{s.address ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {s.averageRating != null ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {renderStars(Math.round(s.averageRating))}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({Number(s.averageRating).toFixed(1)})
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Not rated</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" startIcon={<Star />} onClick={() => setRateTarget(s)}>
                      Rate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Supplier</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="Contact Email" type="email" fullWidth value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
            <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <TextField label="Address" fullWidth multiline minRows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
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
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={!!rateTarget} onClose={() => setRateTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Rate Supplier</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rating for <strong>{rateTarget?.name}</strong>
          </Typography>
          <TextField
            label="Rating (1–5)"
            type="number"
            fullWidth
            inputProps={{ min: 1, max: 5 }}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Comment (optional)"
            fullWidth
            multiline
            minRows={2}
            value={rateComment}
            onChange={(e) => setRateComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setRateTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => rateMutation.mutate(rateTarget?.id)}
            disabled={!rating || Number(rating) < 1 || Number(rating) > 5 || rateMutation.isPending}
            startIcon={rateMutation.isPending ? <CircularProgress size={16} /> : <Star />}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
