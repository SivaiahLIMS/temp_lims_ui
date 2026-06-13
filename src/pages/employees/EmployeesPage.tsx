import React, { useState } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, alpha, useTheme,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Tab, Tabs,
  Avatar,
} from '@mui/material';
import { Add, Search, Refresh, People, CheckCircle, Block } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const EMPTY_FORM = {
  employeeName: '', employeeCode: '', email: '', phone: '', department: '',
  designation: '', qualification: '', joiningDate: '',
};

export default function EmployeesPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', currentBranchId],
    queryFn: () => employeesApi.list(currentBranchId),
    retry: false,
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () => employeesApi.create({ ...form }, currentBranchId),
    onSuccess: () => { setCreateOpen(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['employees', currentBranchId] }); },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.activate(id, currentBranchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', currentBranchId] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.deactivate(id, currentBranchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', currentBranchId] }),
  });

  const filtered = rows.filter((r: any) => {
    const q = search.toLowerCase();
    const match = !q || (r.employeeName ?? r.name ?? '').toLowerCase().includes(q) || (r.employeeCode ?? r.code ?? '').toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q);
    if (tab === 1) return match && r.status !== 'INACTIVE';
    if (tab === 2) return match && r.status === 'INACTIVE';
    return match;
  });

  const initials = (name: string) => name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Employees</Typography>
          <Typography variant="body2" color="text.secondary">Manage lab personnel, roles, and assignments.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>New Employee</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total', v: rows.length, c: theme.palette.primary.main },
          { l: 'Active', v: rows.filter((r: any) => r.status !== 'INACTIVE').length, c: theme.palette.success.main },
          { l: 'Inactive', v: rows.filter((r: any) => r.status === 'INACTIVE').length, c: theme.palette.error.main },
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
            {[`All (${rows.length})`, 'Active', 'Inactive'].map((l) => <Tab key={l} label={l} sx={{ minHeight: 44, fontSize: 13 }} />)}
          </Tabs>
        </Box>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by name, code, or email…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 320 }} />
        </Box>
        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load employees.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Employee', 'Code', 'Department', 'Designation', 'Email', 'Status', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No employees found</TableCell></TableRow>
                ) : filtered.map((d: any) => {
                  const name = d.employeeName ?? d.name ?? 'Unknown';
                  const isActive = d.status !== 'INACTIVE';
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: 13, fontWeight: 700 }}>{initials(name)}</Avatar>
                          <Typography variant="body2" fontWeight={600}>{name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.employeeCode ?? d.code ?? `EMP-${d.id}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.department ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{d.designation ?? d.title ?? '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{d.email ?? '—'}</Typography></TableCell>
                      <TableCell><Chip label={isActive ? 'Active' : 'Inactive'} size="small" color={isActive ? 'success' : 'default'} /></TableCell>
                      <TableCell>
                        {isActive ? (
                          <Button size="small" variant="outlined" color="error" startIcon={<Block fontSize="small" />}
                            onClick={() => deactivateMutation.mutate(d.id)} sx={{ fontSize: 11 }}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle fontSize="small" />}
                            onClick={() => activateMutation.mutate(d.id)} sx={{ fontSize: 11 }}>
                            Activate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Employee</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Full Name" fullWidth required size="small" value={form.employeeName} onChange={(e) => setForm((p) => ({ ...p, employeeName: e.target.value }))} />
              <TextField label="Employee Code" fullWidth size="small" value={form.employeeCode} onChange={(e) => setForm((p) => ({ ...p, employeeCode: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Email" type="email" fullWidth size="small" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <TextField label="Phone" fullWidth size="small" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Department" fullWidth size="small" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
              <TextField label="Designation / Title" fullWidth size="small" value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Qualification" fullWidth size="small" value={form.qualification} onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))} />
              <TextField label="Joining Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.employeeName.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}>
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
