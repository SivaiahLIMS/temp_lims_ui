import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
} from '@mui/material';
import { Add, Search, Refresh, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qaApi } from '../../api/endpoints';

const STATUS_COLOR: Record<string, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  Open: 'error', 'In Progress': 'warning', Closed: 'success', Pending: 'info',
};

const EMPTY_FORM = {
  capaTitle: '', description: '', rootCause: '', proposedAction: '', targetDate: '', priority: 'Medium',
};

export default function CapaPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [closureNotes, setClosureNotes] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['capa'],
    queryFn: () => qaApi.getCapa(),
    retry: false,
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () => qaApi.createCapa(form),
    onSuccess: () => { setCreateOpen(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['capa'] }); },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => qaApi.closeCapa(id, { closureNotes, effectivenessVerification: closureNotes }),
    onSuccess: () => { setCloseOpen(null); setClosureNotes(''); queryClient.invalidateQueries({ queryKey: ['capa'] }); },
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    return !q || (r.capaCode ?? r.code ?? '').toLowerCase().includes(q) || (r.capaTitle ?? r.title ?? '').toLowerCase().includes(q);
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>CAPA Management</Typography>
          <Typography variant="body2" color="text.secondary">Corrective and Preventive Actions — tracking and closure.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>New CAPA</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total', v: rows.length, c: theme.palette.primary.main },
          { l: 'Open', v: rows.filter((r: any) => r.status === 'Open').length, c: theme.palette.error.main },
          { l: 'In Progress', v: rows.filter((r: any) => r.status === 'In Progress').length, c: theme.palette.warning.main },
          { l: 'Closed', v: rows.filter((r: any) => r.status === 'Closed').length, c: theme.palette.success.main },
        ].map((s) => (
          <Card key={s.l} sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: s.c }}>{s.v}</Typography>
            <Typography variant="caption" color="text.secondary">{s.l}</Typography>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by CAPA ID or title…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 320 }} />
        </Box>
        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load CAPA records.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['CAPA ID', 'Title', 'Priority', 'Root Cause', 'Target Date', 'Status', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No CAPA records found</TableCell></TableRow>
                ) : filtered.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{d.capaCode ?? d.code ?? `CAPA-${d.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 240 }} noWrap title={d.capaTitle ?? d.title ?? ''}>{d.capaTitle ?? d.title ?? '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={d.priority ?? 'Medium'} size="small"
                        color={d.priority === 'High' || d.priority === 'Critical' ? 'error' : d.priority === 'Medium' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 180 }} noWrap>{d.rootCause ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.targetDate ?? d.dueDate ?? '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'Open'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                    <TableCell>
                      {d.status !== 'Closed' && (
                        <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle fontSize="small" />}
                          onClick={() => setCloseOpen(d.id)} sx={{ fontSize: 11 }}>
                          Close
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New CAPA</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="CAPA Title" fullWidth required value={form.capaTitle} onChange={(e) => setForm((p) => ({ ...p, capaTitle: e.target.value }))} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} label="Priority" onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  {['Low', 'Medium', 'High', 'Critical'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Target Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} />
            </Stack>
            <TextField label="Root Cause" fullWidth multiline minRows={2} value={form.rootCause} onChange={(e) => setForm((p) => ({ ...p, rootCause: e.target.value }))} />
            <TextField label="Proposed Corrective / Preventive Action" fullWidth multiline minRows={3} value={form.proposedAction} onChange={(e) => setForm((p) => ({ ...p, proposedAction: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.capaTitle.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Create CAPA
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeOpen !== null} onClose={() => setCloseOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Close CAPA</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Effectiveness Verification / Closure Notes" fullWidth multiline minRows={4} required
            value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCloseOpen(null)}>Cancel</Button>
          <Button variant="contained" color="success" disabled={!closureNotes.trim() || closeMutation.isPending}
            startIcon={closeMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={() => closeOpen !== null && closeMutation.mutate(closeOpen)}>
            Close CAPA
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
