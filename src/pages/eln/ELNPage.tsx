import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, CircularProgress, Alert, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Add, Delete, Science, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { elnApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface ELNEntry {
  id: number;
  title: string;
  content: string;
  worksheetId?: number;
  createdAt: string;
  createdBy?: { username: string };
}

export default function ELNPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<ELNEntry | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['eln', currentBranchId],
    queryFn: () => elnApi.list(currentBranchId),
    retry: false,
  });

  const entries: ELNEntry[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => elnApi.create({ title: form.title, content: form.content }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['eln', currentBranchId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => elnApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eln', currentBranchId] }),
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Electronic Lab Notebook</Typography>
          <Typography variant="body2" color="text.secondary">
            Capture experimental observations, notes, and research records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Entry
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load ELN entries from server.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Science sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No ELN entries yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Create your first electronic lab notebook entry.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Entry
          </Button>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Worksheet</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setViewEntry(entry)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{entry.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {entry.content?.substring(0, 60)}{entry.content?.length > 60 ? '…' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.worksheetId ? (
                      <Chip label={`WS-${entry.worksheetId}`} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.createdBy?.username ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>New ELN Entry</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <TextField
              label="Content / Observations"
              fullWidth
              multiline
              minRows={8}
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Record your experimental observations, procedures, and results here..."
            />
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
            Create Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewEntry} onClose={() => setViewEntry(null)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{viewEntry?.title}</DialogTitle>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Created by {viewEntry?.createdBy?.username ?? '—'} &bull; {viewEntry?.createdAt ? new Date(viewEntry.createdAt).toLocaleString() : '—'}
          </Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>
            {viewEntry?.content}
          </Box>
        </CardContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setViewEntry(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
