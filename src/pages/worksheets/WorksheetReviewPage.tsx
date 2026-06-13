import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Stack, CircularProgress,
  Alert, Divider, IconButton, TextField, Paper, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, History, Assignment,
  Person, CalendarToday, Tag,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksheetsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const REVIEWER_ROLES = ['qa_manager', 'qa_reviewer', 'approver', 'reviewer', 'manager'];

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { label: 'Draft', color: 'default' },
  'In Review': { label: 'In Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Rejected: { label: 'Rejected', color: 'error' },
  Submitted: { label: 'Submitted', color: 'info' },
};

const PLACEHOLDER_TEST_CASES = [
  { id: 'tc-1', name: 'pH Measurement', method: 'USP <791>', unit: 'pH units', specification: '6.5 – 7.5', resultValue: '7.1', chemical: 'Potassium Chloride', instrument: 'pH Meter-02 (Mettler Toledo)', comments: '' },
  { id: 'tc-2', name: 'Assay (HPLC)', method: 'USP <621>', unit: '%', specification: '98.0 – 102.0', resultValue: '99.4', chemical: 'Acetonitrile (HPLC Grade)', instrument: 'HPLC-01 (Agilent 1260)', comments: 'Duplicate injections performed' },
  { id: 'tc-3', name: 'Water Content (KF)', method: 'USP <921>', unit: '%w/w', specification: 'NMT 0.5', resultValue: '0.3', chemical: 'Karl Fischer Reagent', instrument: 'KF Titrator-01 (Metrohm)', comments: '' },
  { id: 'tc-4', name: 'Residue on Ignition', method: 'USP <281>', unit: '%', specification: 'NMT 0.1', resultValue: '0.05', chemical: 'Sulfuric Acid', instrument: 'Muffle Furnace-01', comments: '' },
  { id: 'tc-5', name: 'Microbial Limits', method: 'USP <61>', unit: 'CFU/g', specification: 'NMT 100', resultValue: '< 10', chemical: '', instrument: 'Incubator-01 (Memmert)', comments: 'No growth observed at 48h' },
];


interface ReviewHistoryEntry {
  id: number;
  reviewedBy: string;
  action: string;
  comments: string;
  reviewedAt: string;
}

export default function WorksheetReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canReview = REVIEWER_ROLES.some((role) =>
    user?.permissions?.some((p) => p.toLowerCase().includes(role))
  );

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const { data: worksheet, isLoading: wsLoading, isError: wsError } = useQuery({
    queryKey: ['worksheet', id],
    queryFn: () => worksheetsApi.getById(Number(id), currentBranchId),
    enabled: !!id,
    retry: false,
  });

  const { data: execData } = useQuery({
    queryKey: ['worksheet-execution', id],
    queryFn: () => worksheetsApi.getExecutionData(Number(id), currentBranchId),
    enabled: !!id,
    retry: false,
  });

  const { data: reviewHistory } = useQuery({
    queryKey: ['worksheet-review-history', id],
    queryFn: () => worksheetsApi.getReviewHistory(Number(id), currentBranchId),
    enabled: !!id,
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      worksheetsApi.approve(Number(id), { comments: reviewComment }, currentBranchId),
    onSuccess: () => {
      setApproveDialogOpen(false);
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['worksheet', id] });
      queryClient.invalidateQueries({ queryKey: ['worksheet-review-history', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      worksheetsApi.reject(Number(id), { comments: reviewComment }, currentBranchId),
    onSuccess: () => {
      setRejectDialogOpen(false);
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['worksheet', id] });
      queryClient.invalidateQueries({ queryKey: ['worksheet-review-history', id] });
    },
  });

  const wsData = (worksheet as any) ?? null;
  const wsTitle = wsData?.title ?? wsData?.name ?? `Worksheet #${id}`;
  const wsStatus = wsData?.status ?? 'In Review';
  const wsCode = wsData?.worksheetCode ?? wsData?.code ?? `WS-${id}`;
  const statusCfg = STATUS_CONFIG[wsStatus] ?? { label: wsStatus, color: 'default' as const };

  const testCases = Array.isArray(execData?.testCases) && execData.testCases.length > 0
    ? execData.testCases.map((tc: any) => ({
        id: String(tc.id ?? tc.testCaseId),
        name: tc.name ?? tc.testName ?? 'Test',
        method: tc.method ?? tc.methodReference ?? '—',
        unit: tc.unit ?? '',
        specification: tc.specification ?? tc.acceptanceCriteria ?? '—',
        resultValue: tc.resultValue != null ? String(tc.resultValue) : '—',
        chemical: tc.chemical?.name ?? tc.chemicalName ?? '',
        instrument: tc.instrument?.name ?? tc.instrumentName ?? '',
        comments: tc.comments ?? '',
      }))
    : PLACEHOLDER_TEST_CASES;

  const history: ReviewHistoryEntry[] = Array.isArray(reviewHistory)
    ? reviewHistory.map((h: any) => ({
        id: h.id,
        reviewedBy: h.reviewedBy?.username ?? h.reviewerName ?? 'Unknown',
        action: h.action ?? h.decision ?? 'Review',
        comments: h.comments ?? '',
        reviewedAt: h.reviewedAt ?? h.createdAt ?? '',
      }))
    : [];

  const isFinalized = ['Approved', 'Rejected'].includes(wsStatus);

  if (wsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/worksheets')} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
            Worksheet Review
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.25 }}>
            <Typography variant="h5" fontWeight={700}>{wsTitle}</Typography>
            <Chip label={wsCode} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
          </Stack>
        </Box>
        {canReview && !isFinalized && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              size="small"
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              size="small"
              onClick={() => setApproveDialogOpen(true)}
            >
              Approve
            </Button>
          </Stack>
        )}
      </Stack>

      {wsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load worksheet from server. Showing sample data.
        </Alert>
      )}

      {/* Word-Document styled container */}
      <Paper
        elevation={2}
        sx={{
          bgcolor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
          fontFamily: '"Times New Roman", Times, serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Document Header Band */}
        <Box
          sx={{
            bgcolor: '#1a3a5c',
            color: '#fff',
            px: 5,
            py: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', mb: 0.5 }}>
              Laboratory Information Management System
            </Typography>
            <Typography sx={{ fontFamily: '"Times New Roman", Times, serif', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
              Analytical Worksheet
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{wsCode}</Typography>
            <Chip
              label={statusCfg.label}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: wsStatus === 'Approved' ? '#2e7d32' : wsStatus === 'Rejected' ? '#c62828' : '#e65100',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                height: 20,
              }}
            />
          </Box>
        </Box>

        {/* Document Body */}
        <Box sx={{ px: 5, py: 4 }}>
          {/* Title */}
          <Typography
            sx={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              mb: 3,
              color: '#1a1a1a',
            }}
          >
            {wsTitle}
          </Typography>

          <Divider sx={{ mb: 3, borderColor: '#1a3a5c', borderWidth: 2 }} />

          {/* Metadata grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              mb: 4,
              border: '1px solid #c0c0c0',
            }}
          >
            {[
              { icon: <Tag fontSize="small" />, label: 'Document No.', value: wsCode },
              { icon: <CalendarToday fontSize="small" />, label: 'Date', value: wsData?.createdAt?.split('T')[0] ?? wsData?.createdDate ?? new Date().toISOString().split('T')[0] },
              { icon: <Person fontSize="small" />, label: 'Analyst', value: wsData?.assignedTo?.username ?? wsData?.assignedToName ?? 'Unassigned' },
              { icon: <Assignment fontSize="small" />, label: 'Status', value: wsStatus },
            ].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.5,
                  borderRight: idx % 2 === 0 ? '1px solid #c0c0c0' : 'none',
                  borderBottom: idx < 2 ? '1px solid #c0c0c0' : 'none',
                  bgcolor: idx % 4 < 2 ? alpha('#1a3a5c', 0.03) : '#fff',
                }}
              >
                <Box sx={{ color: '#1a3a5c', display: 'flex', mt: 0.2 }}>{item.icon}</Box>
                <Box>
                  <Typography sx={{ fontFamily: 'inherit', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontFamily: '"Times New Roman", Times, serif', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Section heading */}
          <Typography
            sx={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#1a3a5c',
              borderBottom: '2px solid #1a3a5c',
              pb: 0.5,
              mb: 2,
            }}
          >
            1. Test Results
          </Typography>

          {/* Results Table */}
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 12.5,
              mb: 4,
            }}
          >
            <Box
              component="thead"
              sx={{
                '& th': {
                  bgcolor: '#1a3a5c',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  px: 1.5,
                  py: 1,
                  border: '1px solid #0d2440',
                  textAlign: 'left',
                },
              }}
            >
              <tr>
                <th style={{ width: '20%' }}>Test / Parameter</th>
                <th style={{ width: '12%' }}>Method Ref.</th>
                <th style={{ width: '16%' }}>Specification</th>
                <th style={{ width: '10%' }}>Result</th>
                <th style={{ width: '10%' }}>Unit</th>
                <th style={{ width: '16%' }}>Chemical Used</th>
                <th style={{ width: '16%' }}>Instrument Used</th>
              </tr>
            </Box>
            <Box
              component="tbody"
              sx={{
                '& td': {
                  px: 1.5,
                  py: 1.25,
                  border: '1px solid #c0c0c0',
                  verticalAlign: 'top',
                },
                '& tr:nth-of-type(even) td': {
                  bgcolor: alpha('#1a3a5c', 0.025),
                },
              }}
            >
              {testCases.map((tc) => (
                <tr key={tc.id}>
                  <td style={{ fontWeight: 600, color: '#1a1a1a' }}>{tc.name}</td>
                  <td style={{ color: '#555', fontStyle: 'italic' }}>{tc.method}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{tc.specification}</td>
                  <td style={{ fontWeight: 700, color: '#1a3a5c' }}>
                    {tc.resultValue || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ color: '#555' }}>{tc.unit || '—'}</td>
                  <td style={{ color: '#444' }}>{tc.chemical || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}</td>
                  <td style={{ color: '#444' }}>{tc.instrument || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}</td>
                </tr>
              ))}
            </Box>
          </Box>

          {/* Comments rows beneath table */}
          {testCases.some((tc) => tc.comments) && (
            <>
              <Typography
                sx={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: '#1a3a5c',
                  borderBottom: '2px solid #1a3a5c',
                  pb: 0.5,
                  mb: 2,
                }}
              >
                2. Analyst Comments
              </Typography>
              {testCases
                .filter((tc) => tc.comments)
                .map((tc) => (
                  <Box key={tc.id} sx={{ mb: 1.5, display: 'flex', gap: 2 }}>
                    <Typography sx={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, minWidth: 180, color: '#1a1a1a' }}>
                      {tc.name}:
                    </Typography>
                    <Typography sx={{ fontFamily: 'inherit', fontSize: 12.5, color: '#333', flex: 1 }}>
                      {tc.comments}
                    </Typography>
                  </Box>
                ))}
              <Box sx={{ mb: 3 }} />
            </>
          )}

          {/* Signature block */}
          <Typography
            sx={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#1a3a5c',
              borderBottom: '2px solid #1a3a5c',
              pb: 0.5,
              mb: 3,
            }}
          >
            {testCases.some((tc) => tc.comments) ? '3.' : '2.'} Signatures
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
            {['Analyst', 'Reviewer / Approver'].map((role) => (
              <Box key={role}>
                <Typography sx={{ fontFamily: 'inherit', fontSize: 11.5, color: '#555', mb: 3 }}>{role}</Typography>
                <Box sx={{ borderTop: '1px solid #333', mb: 1 }} />
                <Typography sx={{ fontFamily: 'inherit', fontSize: 11, color: '#888' }}>Signature &amp; Date</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Document Footer */}
        <Box
          sx={{
            borderTop: '1px solid #c0c0c0',
            px: 5,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            bgcolor: '#f8f8f8',
          }}
        >
          <Typography sx={{ fontFamily: 'inherit', fontSize: 10, color: '#888' }}>
            LIMS — Analytical Worksheet {wsCode}
          </Typography>
          <Typography sx={{ fontFamily: 'inherit', fontSize: 10, color: '#888' }}>
            Confidential — For internal use only
          </Typography>
          <Typography sx={{ fontFamily: 'inherit', fontSize: 10, color: '#888' }}>
            Page 1 of 1
          </Typography>
        </Box>
      </Paper>

      {/* Review History */}
      {history.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <History sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={700}>Review History</Typography>
          </Stack>
          <Stack spacing={1.5}>
            {history.map((entry) => (
              <Paper
                key={entry.id}
                variant="outlined"
                sx={{ px: 2.5, py: 1.75, borderRadius: 1.5 }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Chip
                      label={entry.action}
                      size="small"
                      color={entry.action.toLowerCase().includes('approve') ? 'success' : entry.action.toLowerCase().includes('reject') ? 'error' : 'default'}
                    />
                    <Typography variant="body2" fontWeight={600}>{entry.reviewedBy}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {entry.reviewedAt ? new Date(entry.reviewedAt).toLocaleString() : ''}
                  </Typography>
                </Stack>
                {entry.comments && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {entry.comments}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Approve Worksheet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to approve <strong>{wsCode}</strong>. This action confirms all test results are satisfactory.
          </Typography>
          <TextField
            label="Comments (optional)"
            multiline
            minRows={3}
            fullWidth
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setApproveDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={approveMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Worksheet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to reject <strong>{wsCode}</strong>. Please provide a reason for rejection.
          </Typography>
          <TextField
            label="Reason for rejection"
            multiline
            minRows={3}
            fullWidth
            required
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setRejectDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={rejectMutation.isPending ? <CircularProgress size={16} /> : <Cancel />}
            onClick={() => rejectMutation.mutate()}
            disabled={rejectMutation.isPending || !reviewComment.trim()}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
