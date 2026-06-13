import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
  Tab, Tabs,
} from '@mui/material';
import { Add, Search, Refresh, CalendarMonth, Build, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  PENDING: 'default', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default',
  SCHEDULED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', OVERDUE: 'error',
};

const EMPTY_RES = { instrumentId: '', reservedFrom: '', reservedTo: '', purpose: '', notes: '' };
const EMPTY_CAL = { instrumentId: '', scheduledDate: '', calibrationType: 'INTERNAL', notes: '' };

export default function InstrumentReservationPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [resOpen, setResOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [resForm, setResForm] = useState(EMPTY_RES);
  const [calForm, setCalForm] = useState(EMPTY_CAL);

  const { data: instrData } = useQuery({
    queryKey: ['instruments', currentBranchId],
    queryFn: () => instrumentsApi.list(currentBranchId),
    retry: false,
  });
  const instruments: any[] = Array.isArray(instrData) ? instrData : (instrData as any)?.content ?? [];

  // Reservations: fetched per instrument; for dashboard view fetch all active instruments and aggregate
  // We use the active instruments list as a proxy for reservations
  const { data: resData, isLoading: resLoading, isError: resError, refetch: refetchRes } = useQuery({
    queryKey: ['instrument-reservations', currentBranchId],
    queryFn: async () => {
      const activeList = await instrumentsApi.active(currentBranchId) as any[];
      const all: any[] = [];
      for (const inst of (Array.isArray(activeList) ? activeList : []).slice(0, 5)) {
        try {
          const r = await instrumentsApi.getReservations(inst.id, currentBranchId) as any[];
          (Array.isArray(r) ? r : []).forEach((x) => all.push({ ...x, instrumentName: inst.instrumentName ?? inst.name }));
        } catch { /* skip */ }
      }
      return all;
    },
    retry: false,
  });
  const reservations: any[] = Array.isArray(resData) ? resData : [];

  const resMutation = useMutation({
    mutationFn: () => instrumentsApi.createReservation(Number(resForm.instrumentId), {
      reservedFrom: resForm.reservedFrom, reservedTo: resForm.reservedTo, purpose: resForm.purpose, notes: resForm.notes,
    }, currentBranchId),
    onSuccess: () => { setResOpen(false); setResForm(EMPTY_RES); queryClient.invalidateQueries({ queryKey: ['instrument-reservations', currentBranchId] }); },
  });

  const calMutation = useMutation({
    mutationFn: () => instrumentsApi.createCalibration(Number(calForm.instrumentId), {
      scheduledDate: calForm.scheduledDate, calibrationType: calForm.calibrationType, notes: calForm.notes,
    }, currentBranchId),
    onSuccess: () => { setCalOpen(false); setCalForm(EMPTY_CAL); queryClient.invalidateQueries({ queryKey: ['instruments', currentBranchId] }); },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Instrument Scheduling</Typography>
          <Typography variant="body2" color="text.secondary">Bookings, calibration schedules, and maintenance planning.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetchRes()}><Refresh fontSize="small" /></IconButton>
          {tab === 0 && <Button variant="contained" startIcon={<Add />} onClick={() => setResOpen(true)}>New Booking</Button>}
          {tab === 1 && <Button variant="contained" startIcon={<Add />} onClick={() => setCalOpen(true)}>Schedule Calibration</Button>}
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total Instruments', v: instruments.length, c: theme.palette.primary.main },
          { l: 'Active', v: instruments.filter((i: any) => i.status === 'ACTIVE').length, c: theme.palette.success.main },
          { l: 'Cal. Due', v: instruments.filter((i: any) => i.status === 'CALIBRATION_DUE').length, c: theme.palette.warning.main },
          { l: 'Reservations', v: reservations.length, c: theme.palette.info.main },
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
            <Tab label="Instrument Bookings" sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label="Calibration Schedule" sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab label="Instrument Status" sx={{ minHeight: 44, fontSize: 13 }} />
          </Tabs>
        </Box>

        {tab === 0 && (
          resLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Booking ID', 'Instrument', 'Reserved From', 'Reserved To', 'Purpose', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No bookings found. Click "New Booking" to create one.</TableCell></TableRow>
                  ) : reservations.map((r: any) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{r.reservationCode ?? `RES-${r.id}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{r.instrumentName ?? r.instrument?.instrumentName ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{r.reservedFrom ? new Date(r.reservedFrom).toLocaleString() : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{r.reservedTo ? new Date(r.reservedTo).toLocaleString() : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{r.purpose ?? '—'}</Typography></TableCell>
                      <TableCell><Chip label={r.status ?? 'PENDING'} size="small" color={STATUS_COLOR[r.status] ?? 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {tab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Instrument', 'Code', 'Last Calibrated', 'Next Due', 'Frequency', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {instruments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No instruments found</TableCell></TableRow>
                ) : instruments.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.instrumentName ?? d.name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.instrumentCode ?? d.code ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.lastCalibratedAt ? new Date(d.lastCalibratedAt).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color={d.status === 'CALIBRATION_DUE' ? 'error' : 'text.primary'}>{d.nextCalibrationDate ? new Date(d.nextCalibrationDate).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.calibrationFrequencyDays ? `${d.calibrationFrequencyDays} days` : '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'ACTIVE'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Code', 'Instrument', 'Manufacturer', 'Serial No.', 'Location', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {instruments.map((d: any) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{d.instrumentCode ?? d.code ?? `INST-${d.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.instrumentName ?? d.name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.manufacturer ?? '—'}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.serialNumber ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.location ?? '—'}</Typography></TableCell>
                    <TableCell><Chip label={d.status ?? 'ACTIVE'} size="small" color={STATUS_COLOR[d.status] ?? 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* New Booking Dialog */}
      <Dialog open={resOpen} onClose={() => setResOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Instrument Booking</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <FormControl size="small" fullWidth required>
              <InputLabel>Instrument</InputLabel>
              <Select value={resForm.instrumentId} label="Instrument" onChange={(e) => setResForm((p) => ({ ...p, instrumentId: e.target.value }))}>
                {instruments.map((i: any) => <MenuItem key={i.id} value={i.id}>{i.instrumentName ?? i.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label="From" type="datetime-local" fullWidth size="small" InputLabelProps={{ shrink: true }} value={resForm.reservedFrom} onChange={(e) => setResForm((p) => ({ ...p, reservedFrom: e.target.value }))} />
              <TextField label="To" type="datetime-local" fullWidth size="small" InputLabelProps={{ shrink: true }} value={resForm.reservedTo} onChange={(e) => setResForm((p) => ({ ...p, reservedTo: e.target.value }))} />
            </Stack>
            <TextField label="Purpose" fullWidth size="small" value={resForm.purpose} onChange={(e) => setResForm((p) => ({ ...p, purpose: e.target.value }))} />
            <TextField label="Notes" fullWidth multiline minRows={2} value={resForm.notes} onChange={(e) => setResForm((p) => ({ ...p, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!resForm.instrumentId || !resForm.reservedFrom || resMutation.isPending}
            startIcon={resMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => resMutation.mutate()}>
            Book Instrument
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Calibration Dialog */}
      <Dialog open={calOpen} onClose={() => setCalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Schedule Calibration</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <FormControl size="small" fullWidth required>
              <InputLabel>Instrument</InputLabel>
              <Select value={calForm.instrumentId} label="Instrument" onChange={(e) => setCalForm((p) => ({ ...p, instrumentId: e.target.value }))}>
                {instruments.map((i: any) => <MenuItem key={i.id} value={i.id}>{i.instrumentName ?? i.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label="Scheduled Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={calForm.scheduledDate} onChange={(e) => setCalForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={calForm.calibrationType} label="Type" onChange={(e) => setCalForm((p) => ({ ...p, calibrationType: e.target.value }))}>
                  {['INTERNAL', 'EXTERNAL', 'TRACEABLE'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Notes" fullWidth multiline minRows={2} value={calForm.notes} onChange={(e) => setCalForm((p) => ({ ...p, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCalOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!calForm.instrumentId || !calForm.scheduledDate || calMutation.isPending}
            startIcon={calMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={() => calMutation.mutate()}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
