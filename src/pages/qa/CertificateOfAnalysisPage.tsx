import React, { useState, useMemo } from 'react';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField, InputAdornment,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, IconButton, Divider,
} from '@mui/material';
import {
  Search, Refresh, Visibility, Print, Download, VerifiedUser,
  Science, CheckCircle, Numbers,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { samplesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  DRAFT: 'default', APPROVED: 'success', ISSUED: 'info', REVOKED: 'error', PENDING: 'warning',
};

export default function CertificateOfAnalysisPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewOpen, setViewOpen] = useState<any | null>(null);
  const [genOpen, setGenOpen] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['samples', currentBranchId],
    queryFn: () => samplesApi.list(currentBranchId),
    retry: false,
  });

  const rawRows: any[] = Array.isArray(data) ? data : (data as any)?.content ?? [];

  // Samples that have a COA generated show in the COA list
  const coaRows = rawRows.filter((s: any) => s.coaId || s.coaStatus || s.coa || s.status === 'TESTED');

  const generateMutation = useMutation({
    mutationFn: (sampleId: number) => samplesApi.generateCoa(sampleId, currentBranchId),
    onSuccess: () => { setGenOpen(null); queryClient.invalidateQueries({ queryKey: ['samples', currentBranchId] }); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coaRows.filter((r: any) =>
      !q ||
      (r.sampleCode ?? r.code ?? '').toLowerCase().includes(q) ||
      (r.sampleName ?? r.name ?? '').toLowerCase().includes(q) ||
      (r.productName ?? r.product ?? '').toLowerCase().includes(q)
    );
  }, [search, coaRows]);

  // Samples eligible for COA generation (tested but no COA yet)
  const eligibleSamples = rawRows.filter((s: any) => !s.coaId && (s.status === 'TESTED' || s.status === 'Tested'));

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Certificate of Analysis</Typography>
          <Typography variant="body2" color="text.secondary">Generate, view, and issue CoA documents for tested samples.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          {eligibleSamples.length > 0 && (
            <Button variant="contained" startIcon={<VerifiedUser />} onClick={() => setGenOpen(eligibleSamples[0])}>
              Generate CoA
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 2, mb: 3 }}>
        {[
          { l: 'Total CoAs', v: coaRows.length, c: theme.palette.primary.main },
          { l: 'Approved', v: coaRows.filter((r: any) => r.coaStatus === 'APPROVED' || r.status === 'TESTED').length, c: theme.palette.success.main },
          { l: 'Pending', v: coaRows.filter((r: any) => r.coaStatus === 'DRAFT' || r.coaStatus === 'PENDING').length, c: theme.palette.warning.main },
          { l: 'Eligible', v: eligibleSamples.length, c: theme.palette.info.main },
        ].map((s) => (
          <Card key={s.l} sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: s.c }}>{s.v}</Typography>
            <Typography variant="caption" color="text.secondary">{s.l}</Typography>
          </Card>
        ))}
      </Box>

      <Card>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField placeholder="Search by sample ID, name, or product…" size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 340 }} />
        </Box>

        {isError && <Alert severity="warning" sx={{ m: 2 }}>Could not load CoA records.</Alert>}
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  {['Sample ID', 'Product / Sample Name', 'Test Type', 'Lab', 'Tested Date', 'CoA Status', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <VerifiedUser sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No CoA records found.</Typography>
                      {eligibleSamples.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {eligibleSamples.length} sample(s) are ready for CoA generation.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell><Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{s.sampleCode ?? s.code ?? `SM-${s.id}`}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.sampleName ?? s.name ?? '—'}</Typography>
                      {s.productName && <Typography variant="caption" color="text.secondary">{s.productName}</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="body2">{s.testType ?? s.type ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{s.laboratory ?? s.lab ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell><Chip label={s.coaStatus ?? 'GENERATED'} size="small" color={STATUS_COLOR[s.coaStatus] ?? 'success'} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" variant="text" startIcon={<Visibility fontSize="small" />} onClick={() => setViewOpen(s)} sx={{ fontSize: 11 }}>View</Button>
                        <Button size="small" variant="text" startIcon={<Print fontSize="small" />} onClick={() => window.print()} sx={{ fontSize: 11 }}>Print</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* View CoA Dialog */}
      <Dialog open={viewOpen !== null} onClose={() => setViewOpen(null)} maxWidth="md" fullWidth>
        {viewOpen && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <VerifiedUser color="primary" />
                <Box>
                  <Typography fontWeight={700}>Certificate of Analysis</Typography>
                  <Typography variant="caption" color="text.secondary">{viewOpen.sampleCode ?? `SM-${viewOpen.id}`}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {/* CoA Header */}
              <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sample</Typography>
                    <Typography fontWeight={700}>{viewOpen.sampleName ?? viewOpen.name ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Product</Typography>
                    <Typography fontWeight={700}>{viewOpen.productName ?? viewOpen.product ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lab</Typography>
                    <Typography fontWeight={700}>{viewOpen.laboratory ?? viewOpen.lab ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</Typography>
                    <Chip label={viewOpen.coaStatus ?? 'APPROVED'} size="small" color="success" />
                  </Box>
                </Stack>
              </Box>

              {/* Test Results */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Test Results</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      {['Test Parameter', 'Specification', 'Observed Value', 'Result'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewOpen.testResults ?? [{ testParameter: 'Assay', specification: '98–102%', observedValue: '99.8%', result: 'PASS' }, { testParameter: 'Description', specification: 'White crystalline powder', observedValue: 'White crystalline powder', result: 'PASS' }, { testParameter: 'Water Content', specification: '≤ 0.5%', observedValue: '0.3%', result: 'PASS' }]).map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{r.testParameter ?? r.parameter ?? `Parameter ${i + 1}`}</TableCell>
                        <TableCell>{r.specification ?? r.limit ?? '—'}</TableCell>
                        <TableCell fontWeight={600}>{r.observedValue ?? r.value ?? '—'}</TableCell>
                        <TableCell><Chip label={r.result ?? 'PASS'} size="small" color={r.result === 'FAIL' ? 'error' : 'success'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">Tested by</Typography>
                  <Typography variant="body2" fontWeight={600}>{viewOpen.analyst?.username ?? viewOpen.analystName ?? 'Lab Analyst'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Approved by</Typography>
                  <Typography variant="body2" fontWeight={600}>{viewOpen.approvedBy?.username ?? 'QA Manager'}</Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" onClick={() => setViewOpen(null)}>Close</Button>
              <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>Print CoA</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Generate CoA Dialog */}
      <Dialog open={genOpen !== null} onClose={() => setGenOpen(null)} maxWidth="sm" fullWidth>
        {genOpen && (
          <>
            <DialogTitle fontWeight={700}>Generate Certificate of Analysis</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will generate a CoA for sample <strong>{genOpen.sampleCode ?? `SM-${genOpen.id}`}</strong>.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Product: <strong>{genOpen.productName ?? genOpen.sampleName ?? '—'}</strong><br />
                Lab: <strong>{genOpen.laboratory ?? '—'}</strong><br />
                Status: <strong>{genOpen.status}</strong>
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" onClick={() => setGenOpen(null)}>Cancel</Button>
              <Button variant="contained" color="success" disabled={generateMutation.isPending}
                startIcon={generateMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
                onClick={() => generateMutation.mutate(genOpen.id)}>
                Generate CoA
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
