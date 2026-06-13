import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Add, Warehouse, Warning, CheckCircle, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

export default function StoragePage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveViolation, setResolveViolation] = useState<any | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [form, setForm] = useState({ name: '', type: '', capacity: '' });

  const { data: locData, isLoading: locLoading, isError: locError, refetch: refetchLoc } = useQuery({
    queryKey: ['storage-locations', currentBranchId],
    queryFn: () => storageApi.getLocations(currentBranchId),
    retry: false,
  });

  const { data: violData, isLoading: violLoading, isError: violError, refetch: refetchViol } = useQuery({
    queryKey: ['storage-violations', currentBranchId],
    queryFn: () => storageApi.getViolations(currentBranchId),
    retry: false,
  });

  const locations: any[] = Array.isArray((locData as any)?.data ?? locData) ? ((locData as any)?.data ?? locData) : [];
  const violations: any[] = Array.isArray((violData as any)?.data ?? violData) ? ((violData as any)?.data ?? violData) : [];
  const openViolations = violations.filter((v) => !v.resolved && !v.resolvedAt);

  const createMutation = useMutation({
    mutationFn: () => storageApi.createLocation({ name: form.name, type: form.type, capacity: Number(form.capacity) }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ name: '', type: '', capacity: '' });
      queryClient.invalidateQueries({ queryKey: ['storage-locations', currentBranchId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (violationId: number) => storageApi.resolveViolation(violationId, { notes: resolveNote }),
    onSuccess: () => {
      setResolveViolation(null);
      setResolveNote('');
      queryClient.invalidateQueries({ queryKey: ['storage-violations', currentBranchId] });
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Storage Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage storage locations and resolve temperature/environmental violations.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => { refetchLoc(); refetchViol(); }} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          {tab === 0 && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
              Add Location
            </Button>
          )}
        </Stack>
      </Stack>

      {openViolations.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<Warning />}>
          <strong>{openViolations.length} open violation{openViolations.length > 1 ? 's' : ''}</strong> require immediate attention.
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}>
          <Tab label="Storage Locations" />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Violations</span>
                {openViolations.length > 0 && (
                  <Chip label={openViolations.length} size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
                )}
              </Stack>
            }
          />
        </Tabs>

        {tab === 0 && (
          locLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>No storage locations found.</TableCell>
                    </TableRow>
                  ) : locations.map((loc: any) => (
                    <TableRow key={loc.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{loc.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{loc.type ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{loc.capacity ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={loc.status ?? 'Active'}
                          size="small"
                          color={loc.status === 'INACTIVE' ? 'default' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {tab === 1 && (
          violLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {violations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                        No violations recorded.
                      </TableCell>
                    </TableRow>
                  ) : violations.map((v: any) => (
                    <TableRow
                      key={v.id}
                      sx={{ bgcolor: !v.resolved ? alpha(theme.palette.error.main, 0.02) : 'transparent' }}
                    >
                      <TableCell><Typography variant="body2">{v.location?.name ?? v.locationName ?? '—'}</Typography></TableCell>
                      <TableCell><Chip label={v.type ?? v.violationType ?? 'UNKNOWN'} size="small" color="error" /></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{v.description ?? v.notes ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip label={v.resolved || v.resolvedAt ? 'Resolved' : 'Open'} size="small" color={v.resolved || v.resolvedAt ? 'success' : 'error'} />
                      </TableCell>
                      <TableCell align="center">
                        {!v.resolved && !v.resolvedAt && (
                          <Button size="small" variant="outlined" color="success" onClick={() => setResolveViolation(v)}>
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Storage Location</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="Type" fullWidth value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Refrigerator, Freezer, Shelf" />
            <TextField label="Capacity" fullWidth value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 100 containers" />
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

      {/* Resolve Dialog */}
      <Dialog open={!!resolveViolation} onClose={() => setResolveViolation(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Resolve Violation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {resolveViolation?.description ?? resolveViolation?.notes ?? 'Violation at ' + (resolveViolation?.location?.name ?? '—')}
          </Alert>
          <TextField
            label="Resolution Notes"
            fullWidth
            multiline
            minRows={3}
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Describe corrective action taken..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResolveViolation(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => resolveMutation.mutate(resolveViolation?.id)}
            disabled={resolveMutation.isPending}
            startIcon={resolveMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            Mark Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
