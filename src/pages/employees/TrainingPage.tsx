import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, School, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

export default function TrainingPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', durationHours: '', validityMonths: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['training-materials', currentBranchId],
    queryFn: () => trainingApi.getMaterials(currentBranchId),
    retry: false,
  });

  const materials: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => trainingApi.createMaterial({
      title: form.title,
      description: form.description,
      durationHours: form.durationHours ? Number(form.durationHours) : undefined,
      validityMonths: form.validityMonths ? Number(form.validityMonths) : undefined,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ title: '', description: '', durationHours: '', validityMonths: '' });
      queryClient.invalidateQueries({ queryKey: ['training-materials', currentBranchId] });
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Training Materials</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employee training materials and certification records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Add Material
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load training materials from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : materials.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <School sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No training materials yet</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            Add Material
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration (hrs)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valid For</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((m: any) => (
                <TableRow key={m.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {m.description ? m.description.substring(0, 80) + (m.description.length > 80 ? '…' : '') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{m.durationHours ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {m.validityMonths ? `${m.validityMonths} months` : 'Indefinite'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.status ?? 'Active'}
                      size="small"
                      color={m.status === 'INACTIVE' ? 'default' : 'success'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Training Material</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <TextField label="Description" fullWidth multiline minRows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField label="Duration (hours)" type="number" fullWidth value={form.durationHours} onChange={(e) => setForm((p) => ({ ...p, durationHours: e.target.value }))} />
              <TextField label="Validity (months)" type="number" fullWidth value={form.validityMonths} onChange={(e) => setForm((p) => ({ ...p, validityMonths: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
