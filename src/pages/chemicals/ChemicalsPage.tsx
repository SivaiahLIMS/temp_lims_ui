import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Tab, Tabs,
} from '@mui/material';
import { Add, Search, Refresh, Science, Warning } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chemicalsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const EMPTY_MASTER = { chemicalName: '', casNumber: '', hazardClass: '', storageCondition: '', unit: 'mL' };
const EMPTY_REG = { masterChemicalId: '', lotNumber: '', vendor: '', quantity: '', expiryDate: '', storageLocationId: '' };

export default function ChemicalsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [masterOpen, setMasterOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [masterForm, setMasterForm] = useState(EMPTY_MASTER);
  const [regForm, setRegForm] = useState(EMPTY_REG);

  const { data: stockData, isLoading, isError, refetch } = useQuery({
    queryKey: ['chemicals-stock', currentBranchId],
    queryFn: () => chemicalsApi.getStock(currentBranchId),
    retry: false,
  });
  const { data: mastersData } = useQuery({
    queryKey: ['chemicals-masters'],
    queryFn: () => chemicalsApi.getMasters(),
    retry: false,
  });

  const rows: any[] = Array.isArray(stockData) ? stockData : (stockData as any)?.content ?? [];
  const masters: any[] = Array.isArray(mastersData) ? mastersData : (mastersData as any)?.content ?? [];

  const createMasterMutation = useMutation({
    mutationFn: () => chemicalsApi.createMaster(masterForm),
    onSuccess: () => { setMasterOpen(false); setMasterForm(EMPTY_MASTER); queryClient.invalidateQueries({ queryKey: ['chemicals-masters'] }); },
  });

  const registerMutation = useMutation({
    mutationFn: () => chemicalsApi.register({ ...regForm, masterChemicalId: Number(regForm.masterChemicalId), quantity: Number(regForm.quantity) }, currentBranchId),
    onSuccess: () => { setRegOpen(false); setRegForm(EMPTY_REG); queryClient.invalidateQueries({ queryKey: ['chemicals-stock', currentBranchId] }); },
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    const name = (r.chemicalName ?? r.masterChemical?.chemicalName ?? r.name ?? '').toLowerCase();
    const lot = (r.lotNumber ?? r.lot ?? '').toLowerCase();
    const match = !q || name.includes(q) || lot.includes(q);
    const isExpiring = r.expiryDate && new Date(r.expiryDate) < new Date(Date.now() + 30 * 86400000);
    if (tab === 1) return match && r.status === 'AVAILABLE';
    if (tab === 2) return match && isExpiring;
    return match;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Chemicals & Reagents</Typography>
          <Typography variant="body2" color="text.secondary">Inventory stock, lot tracking, and expiry management.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setMasterOpen(true)}>New Chemical Master</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setRegOpen(true)}>Register Stock</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total Lots', v: rows.length, c: theme.palette.primary.main },
          { l: 'Available', v: rows.filter((r: any) => r.status === 'AVAILABLE' || !r.status).length, c: theme.palette.success.main },
          { l: 'Expiring < 30d', v: rows.filter((r: any) => r.expiryDate && new Date(r.expiryDate) < new Date(Date.now() + 30 * 86400000)).length, c: theme.palette.warning.main },
          { l: 'Expired', v: rows.filter((r: any) => r.expiryDate && new Date(r.expiryDate) < new Date()).length, c: theme.palette.error.main },
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
            {[`All (${rows.length})`, 'Available', 'Expiring Soon'].map((l) => <Tab key={l} label={l} sx={{ minHeight: 44, fontSize: 13 }} />)}
          </Tabs>
        </Box>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by name or lot number…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 300 }} />
        </Box>
        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load chemical stock.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Chemical Name', 'Lot Number', 'Quantity', 'Unit', 'Vendor', 'Expiry Date', 'Storage', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No chemicals found</TableCell></TableRow>
                ) : filtered.map((d: any) => {
                  const isExpiring = d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 86400000);
                  const isExpired = d.expiryDate && new Date(d.expiryDate) < new Date();
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.chemicalName ?? d.masterChemical?.chemicalName ?? d.name ?? '—'}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.lotNumber ?? d.lot ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.currentQuantity ?? d.quantity ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.unit ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.vendor ?? d.supplier ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" color={isExpired ? 'error' : isExpiring ? 'warning.main' : 'text.secondary'} fontWeight={isExpiring || isExpired ? 700 : 400}>
                          {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{d.storageCondition ?? d.storage ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip label={isExpired ? 'Expired' : d.status ?? 'Available'} size="small"
                          color={isExpired ? 'error' : isExpiring ? 'warning' : 'success'} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create Chemical Master Dialog */}
      <Dialog open={masterOpen} onClose={() => setMasterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Chemical Master</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Chemical Name" fullWidth required size="small" value={masterForm.chemicalName} onChange={(e) => setMasterForm((p) => ({ ...p, chemicalName: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField label="CAS Number" fullWidth size="small" value={masterForm.casNumber} onChange={(e) => setMasterForm((p) => ({ ...p, casNumber: e.target.value }))} />
              <TextField label="Hazard Class" fullWidth size="small" value={masterForm.hazardClass} onChange={(e) => setMasterForm((p) => ({ ...p, hazardClass: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Storage Condition" fullWidth size="small" value={masterForm.storageCondition} onChange={(e) => setMasterForm((p) => ({ ...p, storageCondition: e.target.value }))} placeholder="e.g. 2–8°C, dry place" />
              <TextField label="Unit" size="small" sx={{ width: 120 }} value={masterForm.unit} onChange={(e) => setMasterForm((p) => ({ ...p, unit: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setMasterOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!masterForm.chemicalName.trim() || createMasterMutation.isPending}
            startIcon={createMasterMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMasterMutation.mutate()}>
            Create Master
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Stock Dialog */}
      <Dialog open={regOpen} onClose={() => setRegOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Register Chemical Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <FormControl size="small" fullWidth required>
              <InputLabel>Chemical Master</InputLabel>
              <Select value={regForm.masterChemicalId} label="Chemical Master" onChange={(e) => setRegForm((p) => ({ ...p, masterChemicalId: e.target.value }))}>
                {masters.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.chemicalName}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label="Lot Number" fullWidth size="small" value={regForm.lotNumber} onChange={(e) => setRegForm((p) => ({ ...p, lotNumber: e.target.value }))} />
              <TextField label="Vendor / Supplier" fullWidth size="small" value={regForm.vendor} onChange={(e) => setRegForm((p) => ({ ...p, vendor: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Quantity" type="number" fullWidth size="small" required value={regForm.quantity} onChange={(e) => setRegForm((p) => ({ ...p, quantity: e.target.value }))} />
              <TextField label="Expiry Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={regForm.expiryDate} onChange={(e) => setRegForm((p) => ({ ...p, expiryDate: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setRegOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!regForm.masterChemicalId || !regForm.quantity || registerMutation.isPending}
            startIcon={registerMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => registerMutation.mutate()}>
            Register Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
