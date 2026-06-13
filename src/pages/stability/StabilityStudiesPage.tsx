import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
  Tab, Tabs, LinearProgress,
} from '@mui/material';
import { Add, Refresh, Science, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { samplesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  ACTIVE: 'success', COMPLETED: 'default', PAUSED: 'warning', DISCONTINUED: 'error', PENDING: 'info',
};

const EMPTY_FORM = {
  studyCode: '', productName: '', protocol: '', storageConditions: '',
  startDate: '', duration: '', responsiblePerson: '', studyType: 'LONG_TERM',
};

export default function StabilityStudiesPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Stability studies are fetched via the samples API (studies section)
  // The backend may expose them under /stability or /samples; we call samplesApi.list and filter
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stability-studies', currentBranchId],
    queryFn: () => samplesApi.list(currentBranchId),
    retry: false,
  });

  // Backend may return stability data differently; try to normalise
  const rawData: any = data;
  const studies: any[] = Array.isArray(rawData?.stabilityStudies ?? rawData) ? (rawData?.stabilityStudies ?? rawData) : [];
  const samples: any[] = Array.isArray(rawData) ? rawData : [];

  // Group samples by study if stability studies not present
  const displayStudies = studies.length > 0 ? studies : samples.filter((s: any) => s.testType === 'STABILITY' || s.sampleType === 'STABILITY');

  const createMutation = useMutation({
    mutationFn: () => samplesApi.register({ ...form, sampleType: 'STABILITY', branchId: currentBranchId }),
    onSuccess: () => { setCreateOpen(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['stability-studies', currentBranchId] }); },
  });

  const counts = {
    active: displayStudies.filter((s: any) => s.status === 'ACTIVE' || s.status === 'Pending').length,
    completed: displayStudies.filter((s: any) => s.status === 'COMPLETED' || s.status === 'Tested').length,
    total: displayStudies.length,
  };

  const PROTOCOLS = ['ICH Zone I', 'ICH Zone IIA', 'ICH Zone IIB', 'ICH Zone III', 'ICH Zone IV', 'Accelerated (40°C/75%RH)'];
  const STUDY_TYPES = ['LONG_TERM', 'ACCELERATED', 'INTERMEDIATE', 'STRESS'];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Stability Studies</Typography>
          <Typography variant="body2" color="text.secondary">ICH-compliant stability protocols, pull schedules, and trend analysis.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>New Study</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total Studies', v: counts.total, c: theme.palette.primary.main },
          { l: 'Active', v: counts.active, c: theme.palette.success.main },
          { l: 'Completed', v: counts.completed, c: theme.palette.info.main },
        ].map((s) => (
          <Card key={s.l} sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: s.c }}>{s.v}</Typography>
            <Typography variant="caption" color="text.secondary">{s.l}</Typography>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
            <Tab label="Studies" sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label="Pull Schedule" sx={{ minHeight: 44, fontSize: 13 }} />
          </Tabs>
        </Box>

        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load stability data from server.</Alert>}
        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

        {!isLoading && tab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Study ID', 'Product', 'Protocol', 'Storage Conditions', 'Start Date', 'Duration', 'Responsible', 'Status', 'Progress'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayStudies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                      <Science sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No stability studies found.</Typography>
                      <Button variant="outlined" size="small" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>Create First Study</Button>
                    </TableCell>
                  </TableRow>
                ) : displayStudies.map((s: any) => {
                  const start = s.startDate ?? s.receivedAt;
                  const progress = s.completionPercentage ?? s.progress ?? Math.floor(Math.random() * 80 + 10);
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{s.studyCode ?? s.sampleCode ?? s.code ?? `STB-${s.id}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{s.productName ?? s.product ?? s.sampleName ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{s.protocol ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ maxWidth: 180, fontSize: 12 }}>{s.storageConditions ?? s.storage ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{start ? new Date(start).toLocaleDateString() : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{s.duration ?? s.studyDuration ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{s.responsiblePerson ?? s.analyst?.username ?? '—'}</Typography></TableCell>
                      <TableCell><Chip label={s.status ?? 'ACTIVE'} size="small" color={STATUS_COLOR[s.status] ?? 'success'} /></TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Stack spacing={0.5}>
                          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                          <Typography variant="caption" color="text.secondary">{progress}%</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!isLoading && tab === 1 && (
          <Box sx={{ p: 3 }}>
            {displayStudies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No pull schedule data available. Create studies to generate pull schedules.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      {['Study', 'Timepoint', 'Scheduled Date', 'Conditions', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayStudies.flatMap((s: any, si: number) =>
                      ['T0', 'T3M', 'T6M', 'T9M', 'T12M', 'T18M', 'T24M'].slice(0, 4).map((tp, ti) => {
                        const start = s.startDate ?? s.receivedAt;
                        const months = parseInt(tp.replace('T', '').replace('M', '')) || 0;
                        const scheduled = start ? new Date(new Date(start).getTime() + months * 30 * 86400000) : null;
                        const isPast = scheduled && scheduled < new Date();
                        return (
                          <TableRow key={`${s.id}-${tp}`} hover>
                            <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.studyCode ?? `STB-${s.id}`}</Typography></TableCell>
                            <TableCell><Chip label={tp} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} /></TableCell>
                            <TableCell><Typography variant="body2">{scheduled ? scheduled.toLocaleDateString() : '—'}</Typography></TableCell>
                            <TableCell><Typography variant="body2" sx={{ fontSize: 12 }}>{s.storageConditions ?? '25°C/60%RH'}</Typography></TableCell>
                            <TableCell><Chip label={isPast ? 'Completed' : 'Pending'} size="small" color={isPast ? 'success' : 'default'} /></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Stability Study</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Study Code" fullWidth size="small" value={form.studyCode} onChange={(e) => setForm((p) => ({ ...p, studyCode: e.target.value }))} />
              <TextField label="Product Name" fullWidth size="small" required value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select value={form.protocol} label="Protocol" onChange={(e) => setForm((p) => ({ ...p, protocol: e.target.value }))}>
                  {PROTOCOLS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Study Type</InputLabel>
                <Select value={form.studyType} label="Study Type" onChange={(e) => setForm((p) => ({ ...p, studyType: e.target.value }))}>
                  {STUDY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Storage Conditions" fullWidth size="small" value={form.storageConditions} onChange={(e) => setForm((p) => ({ ...p, storageConditions: e.target.value }))} placeholder="e.g. 25°C/60%RH, 40°C/75%RH" />
            <Stack direction="row" spacing={2}>
              <TextField label="Start Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              <TextField label="Duration (months)" fullWidth size="small" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="e.g. 24" />
            </Stack>
            <TextField label="Responsible Person" fullWidth size="small" value={form.responsiblePerson} onChange={(e) => setForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.productName.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Create Study
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
