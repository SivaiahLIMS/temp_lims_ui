import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Alert, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, alpha, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Collapse, Divider, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Save, CheckCircle, Science, Build,
  Assignment, InfoOutlined, Warning, Cancel as CancelIcon,
  TaskAlt, Timer, ExpandMore, ExpandLess,
  UploadFile, ContentPaste, Download, AutoAwesome,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksheetsApi, chemicalsApi, instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import Stopwatch from '../../components/Stopwatch';
import {
  parseResultText,
  matchParsedToTestCases,
  generateResultTemplate,
  ParsedRow,
} from '../../utils/worksheetResultParser';

interface TestCaseEntry {
  testCaseId: string;
  resultValue: string;
  chemicalId: string;
  instrumentId: string;
  comments: string;
}

type ValidationStatus = 'pass' | 'fail' | 'oot' | null;

const ANALYST_ROLES = ['qc_analyst', 'qa_analyst', 'analyst'];

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { label: 'Draft', color: 'default' },
  'In Review': { label: 'In Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Rejected: { label: 'Rejected', color: 'error' },
  Submitted: { label: 'Submitted', color: 'info' },
};

function evaluateValidation(value: string, rule: any): ValidationStatus {
  if (!rule || value === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (rule.type === 'range') {
    if (num >= rule.min && num <= rule.max) return 'pass';
    if (rule.ootMin != null && rule.ootMax != null && num >= rule.ootMin && num <= rule.ootMax) return 'oot';
    return 'fail';
  }
  if (rule.type === 'max') {
    if (num <= rule.max) return 'pass';
    if (rule.ootMax != null && num <= rule.ootMax) return 'oot';
    return 'fail';
  }
  if (rule.type === 'min') {
    if (num >= rule.min) return 'pass';
    if (rule.ootMin != null && num >= rule.ootMin) return 'oot';
    return 'fail';
  }
  return null;
}

const VALIDATION_CFG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pass: { icon: <TaskAlt fontSize="small" />, color: '#2E7D32', label: 'Pass' },
  fail: { icon: <CancelIcon fontSize="small" />, color: '#C62828', label: 'OOS' },
  oot: { icon: <Warning fontSize="small" />, color: '#E65100', label: 'OOT' },
};

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

interface ChemicalTimer {
  tcId: string;
  testName: string;
  chemicalLabel: string;
  startedAt: number;
}

function ChemicalIssuanceTimerPanel({
  timers, onStop,
}: {
  timers: ChemicalTimer[];
  onStop: (tcId: string) => void;
}) {
  const theme = useTheme();
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const now = Date.now();
    setElapsedMap(() => {
      const next: Record<string, number> = {};
      timers.forEach((t) => { next[t.tcId] = now - t.startedAt; });
      return next;
    });
  }, [timers]);

  useEffect(() => {
    if (timers.length === 0) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(tick, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timers, tick]);

  if (timers.length === 0) return null;

  return (
    <Card sx={{ mb: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`, bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
      <Box
        sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expanded ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}` : 'none' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Timer fontSize="small" sx={{ color: theme.palette.warning.main }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.palette.warning.dark }}>Chemical Issuance Timers</Typography>
          <Chip label={`${timers.length} active`} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
        </Stack>
        <IconButton size="small">{expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}</IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Timers start automatically when a chemical is selected. Stop when the chemical is returned or consumed.
          </Typography>
          <Stack spacing={1}>
            {timers.map((t) => {
              const elapsed = elapsedMap[t.tcId] ?? (Date.now() - t.startedAt);
              const isLong = elapsed > 30 * 60 * 1000;
              return (
                <Box key={t.tcId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1.5, bgcolor: isLong ? alpha(theme.palette.error.main, 0.06) : alpha(theme.palette.warning.main, 0.06), border: `1px solid ${isLong ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.warning.main, 0.2)}` }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Science fontSize="small" sx={{ color: isLong ? theme.palette.error.main : theme.palette.warning.main }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t.chemicalLabel}</Typography>
                      <Typography variant="caption" color="text.secondary">Used in: {t.testName}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 16, fontWeight: 700, color: isLong ? theme.palette.error.main : theme.palette.warning.main, letterSpacing: 1 }}>
                      {formatMs(elapsed)}
                    </Typography>
                    {isLong && <Chip label="Long issuance" size="small" color="error" sx={{ height: 20, fontSize: 10 }} />}
                    <Button size="small" variant="outlined" color="warning" onClick={() => onStop(t.tcId)} sx={{ fontSize: 11, px: 1.5, py: 0.25, minWidth: 60 }}>Stop</Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Card>
  );
}

// ─── Upload Results Dialog ─────────────────────────────────────────────────────
function UploadResultsDialog({
  open,
  onClose,
  testCases,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  testCases: Array<{ id: string; name: string; unit: string; specification: string }>;
  onApply: (map: Record<string, { resultValue: string; comments: string }>) => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'upload' | 'paste'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [preview, setPreview] = useState<Array<{ tcId: string; name: string; resultValue: string; comments: string }>>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParseText = (text: string) => {
    setPasteText(text);
    setParseError('');
    if (!text.trim()) { setPreview([]); return; }
    try {
      const parsed = parseResultText(text);
      const mapped = matchParsedToTestCases(parsed, testCases);
      const rows = testCases.map((tc) => ({
        tcId: tc.id,
        name: tc.name,
        resultValue: mapped[tc.id]?.resultValue ?? '',
        comments: mapped[tc.id]?.comments ?? '',
      }));
      setPreview(rows);
    } catch (e) {
      setParseError('Could not parse the pasted data. Please check the format.');
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => handleParseText(String(e.target?.result ?? ''));
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleApply = () => {
    const map: Record<string, { resultValue: string; comments: string }> = {};
    preview.forEach((r) => { if (r.resultValue) map[r.tcId] = { resultValue: r.resultValue, comments: r.comments }; });
    onApply(map);
    onClose();
    setPasteText('');
    setPreview([]);
  };

  const filledCount = preview.filter((r) => r.resultValue).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <UploadFile sx={{ color: theme.palette.primary.main }} />
          <Box>
            <Typography fontWeight={700}>Import Results</Typography>
            <Typography variant="caption" color="text.secondary">Upload a CSV file or paste data from Excel/LIMS instruments</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {/* Mode tabs */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small" variant={mode === 'paste' ? 'contained' : 'outlined'}
            startIcon={<ContentPaste fontSize="small" />}
            onClick={() => setMode('paste')}
          >
            Paste from Clipboard / Excel
          </Button>
          <Button
            size="small" variant={mode === 'upload' ? 'contained' : 'outlined'}
            startIcon={<UploadFile fontSize="small" />}
            onClick={() => setMode('upload')}
          >
            Upload CSV File
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small" variant="outlined" startIcon={<Download fontSize="small" />}
            onClick={() => {
              const csv = generateResultTemplate(testCases);
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'worksheet_results_template.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Template
          </Button>
        </Stack>

        {mode === 'paste' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Copy cells from Excel (Test Name | Result Value | Comments) and paste below.
              Single-column pastes (result values only) fill test cases in order.
            </Typography>
            <TextField
              fullWidth multiline minRows={6} maxRows={14}
              placeholder={`Paste here. Accepted formats:\n\nSingle column (result values in order):\n99.8\n0.3\n\nTwo columns (test name + result):\nAssay\t99.8\nWater Content\t0.3\n\nThree columns:\nAssay\t99.8\tSee raw data sheet`}
              value={pasteText}
              onChange={(e) => handleParseText(e.target.value)}
              sx={{ fontFamily: 'monospace', fontSize: 13 }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Box>
        )}

        {mode === 'upload' && (
          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            sx={{
              mb: 2, p: 4, border: '2px dashed', borderColor: 'divider',
              borderRadius: 2, textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.03) },
            }}
          >
            <UploadFile sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>Click to select or drag & drop a CSV file</Typography>
            <Typography variant="caption" color="text.secondary">
              CSV with columns: Test Name, Result Value, [Comments]
            </Typography>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </Box>
        )}

        {parseError && <Alert severity="error" sx={{ mb: 2 }}>{parseError}</Alert>}

        {/* Preview table */}
        {preview.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Preview — {filledCount} of {testCases.length} test cases matched
              </Typography>
              <Chip
                label={`${filledCount} filled`}
                size="small"
                color={filledCount > 0 ? 'success' : 'default'}
              />
            </Stack>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Test Case', 'Imported Value', 'Comments', 'Status'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((r) => (
                    <TableRow key={r.tcId} sx={{ bgcolor: r.resultValue ? 'transparent' : alpha(theme.palette.grey[500], 0.04) }}>
                      <TableCell><Typography variant="body2" fontWeight={r.resultValue ? 600 : 400}>{r.name}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: r.resultValue ? theme.palette.primary.main : 'text.disabled' }}>
                          {r.resultValue || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{r.comments || '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={r.resultValue ? 'Matched' : 'Not found'}
                          size="small"
                          color={r.resultValue ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CheckCircle />}
          disabled={filledCount === 0}
          onClick={handleApply}
        >
          Apply {filledCount > 0 ? `${filledCount} Results` : 'Results'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Execution Page ───────────────────────────────────────────────────────
export default function WorksheetExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isAnalyst = ANALYST_ROLES.some((role) =>
    user?.permissions?.some((p) => p.toLowerCase().includes(role))
  );

  const [entries, setEntries] = useState<Record<string, TestCaseEntry>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [stopwatchDialogOpen, setStopwatchDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [chemicalTimers, setChemicalTimers] = useState<ChemicalTimer[]>([]);
  const [snack, setSnack] = useState('');

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

  const { data: chemicalsData } = useQuery({
    queryKey: ['chemicals-available', currentBranchId],
    queryFn: () => chemicalsApi.availableInBranch(currentBranchId),
    retry: false,
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ['instruments-active', currentBranchId],
    queryFn: () => instrumentsApi.active(currentBranchId),
    retry: false,
  });

  const chemicals: { id: string; label: string }[] = Array.isArray(chemicalsData)
    ? chemicalsData.map((c: any) => ({
        id: String(c.id ?? c.registrationId),
        label: c.chemical?.name ?? c.name ?? c.casNo ?? `Chemical #${c.id}`,
      }))
    : [];

  const instruments: { id: string; label: string }[] = Array.isArray(instrumentsData)
    ? instrumentsData.map((ins: any) => ({
        id: String(ins.id ?? ins.instrumentId),
        label: ins.name ?? ins.instrumentName ?? `Instrument #${ins.id}`,
      }))
    : [];

  const testCases = Array.isArray((execData as any)?.testCases)
    ? (execData as any).testCases.map((tc: any) => ({
        id: String(tc.id ?? tc.testCaseId),
        name: tc.name ?? tc.testName ?? 'Test',
        method: tc.method ?? tc.methodReference ?? '—',
        unit: tc.unit ?? '',
        specification: tc.specification ?? tc.acceptanceCriteria ?? '—',
        validationRule: tc.validationRule ?? null,
      }))
    : [];

  useEffect(() => {
    if (Array.isArray((execData as any)?.testCases)) {
      const prefilled: Record<string, TestCaseEntry> = {};
      const alreadySaved: Record<string, boolean> = {};
      (execData as any).testCases.forEach((tc: any) => {
        const tcId = String(tc.id ?? tc.testCaseId);
        if (tc.resultValue !== undefined && tc.resultValue !== null) {
          prefilled[tcId] = {
            testCaseId: tcId,
            resultValue: String(tc.resultValue),
            chemicalId: String(tc.chemicalId ?? ''),
            instrumentId: String(tc.instrumentId ?? ''),
            comments: tc.comments ?? '',
          };
          alreadySaved[tcId] = true;
        }
      });
      setEntries(prefilled);
      setSaved(alreadySaved);
    }
  }, [execData]);

  const saveFieldMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: unknown }) =>
      worksheetsApi.saveFieldValue(Number(id), slotId, data, currentBranchId),
    onSuccess: (_, variables) => {
      setSaved((prev) => ({ ...prev, [String(variables.slotId)]: true }));
      queryClient.invalidateQueries({ queryKey: ['worksheet-execution', id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => worksheetsApi.submit(Number(id), currentBranchId),
    onSuccess: () => {
      setSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['worksheet', id] });
    },
  });

  const getEntry = (tcId: string): TestCaseEntry =>
    entries[tcId] ?? { testCaseId: tcId, resultValue: '', chemicalId: '', instrumentId: '', comments: '' };

  const updateEntry = (tcId: string, field: keyof TestCaseEntry, value: string) => {
    setSaved((prev) => ({ ...prev, [tcId]: false }));
    setEntries((prev) => ({ ...prev, [tcId]: { ...getEntry(tcId), [field]: value } }));

    if (field === 'chemicalId') {
      if (value) {
        const testCase = testCases.find((tc: any) => tc.id === tcId);
        const chemical = chemicals.find((c) => c.id === value);
        setChemicalTimers((prev) => {
          const exists = prev.find((t) => t.tcId === tcId);
          if (exists) return prev.map((t) => t.tcId === tcId ? { ...t, chemicalLabel: chemical?.label ?? value } : t);
          return [...prev, { tcId, testName: testCase?.name ?? `Test ${tcId}`, chemicalLabel: chemical?.label ?? value, startedAt: Date.now() }];
        });
      } else {
        setChemicalTimers((prev) => prev.filter((t) => t.tcId !== tcId));
      }
    }
  };

  /** Apply imported results to all test case entries at once */
  const handleImportApply = (map: Record<string, { resultValue: string; comments: string }>) => {
    setEntries((prev) => {
      const next = { ...prev };
      Object.entries(map).forEach(([tcId, { resultValue, comments }]) => {
        next[tcId] = { ...getEntry(tcId), resultValue, comments };
      });
      return next;
    });
    setSaved((prev) => {
      const next = { ...prev };
      Object.keys(map).forEach((tcId) => { next[tcId] = false; });
      return next;
    });
    setSnack(`${Object.keys(map).length} result(s) imported. Review and save each row.`);
  };

  /** Save all dirty rows in one click */
  const handleSaveAll = () => {
    const dirtyIds = testCases
      .map((tc: any) => tc.id)
      .filter((tcId: string) => !saved[tcId] && (getEntry(tcId).resultValue || getEntry(tcId).comments));
    dirtyIds.forEach((tcId: string) => {
      const entry = getEntry(tcId);
      saveFieldMutation.mutate({
        slotId: Number(tcId.replace('tc-', '')),
        data: {
          resultValue: entry.resultValue,
          chemicalId: entry.chemicalId || null,
          instrumentId: entry.instrumentId || null,
          comments: entry.comments || null,
        },
      });
    });
  };

  const stopChemicalTimer = (tcId: string) => {
    setChemicalTimers((prev) => prev.filter((t) => t.tcId !== tcId));
  };

  const handleSave = (tcId: string) => {
    const entry = getEntry(tcId);
    saveFieldMutation.mutate({
      slotId: Number(tcId.replace('tc-', '')),
      data: {
        resultValue: entry.resultValue,
        chemicalId: entry.chemicalId || null,
        instrumentId: entry.instrumentId || null,
        comments: entry.comments || null,
      },
    });
  };

  const wsData = (worksheet as any) ?? null;
  const wsTitle = wsData?.title ?? wsData?.name ?? `Worksheet #${id}`;
  const wsStatus = wsData?.status ?? 'Draft';
  const wsCode = wsData?.worksheetCode ?? wsData?.code ?? `WS-${id}`;
  const statusCfg = STATUS_CONFIG[wsStatus] ?? { label: wsStatus, color: 'default' as const };
  const canEdit = isAnalyst && !['Approved', 'Rejected', 'Submitted'].includes(wsStatus);

  const oosCount = testCases.filter((tc: any) =>
    evaluateValidation(getEntry(tc.id).resultValue, tc.validationRule) === 'fail'
  ).length;

  const ootCount = testCases.filter((tc: any) =>
    evaluateValidation(getEntry(tc.id).resultValue, tc.validationRule) === 'oot'
  ).length;

  const dirtyCount = testCases.filter((tc: any) => !saved[tc.id] && getEntry(tc.id).resultValue).length;

  if (wsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/worksheets')} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700}>{wsTitle}</Typography>
            <Chip label={wsCode} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
            {oosCount > 0 && <Chip label={`${oosCount} OOS`} size="small" color="error" icon={<CancelIcon fontSize="small" />} />}
            {ootCount > 0 && <Chip label={`${ootCount} OOT`} size="small" color="warning" icon={<Warning fontSize="small" />} />}
            {dirtyCount > 0 && <Chip label={`${dirtyCount} unsaved`} size="small" color="info" />}
          </Stack>
          {wsData?.assignedTo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Assigned to: {wsData.assignedTo?.username ?? wsData.assignedTo}
            </Typography>
          )}
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} flexShrink={0}>
          {canEdit && (
            <>
              {/* Upload / Import */}
              <Tooltip title="Import results from CSV or clipboard">
                <Button
                  variant="outlined" size="small"
                  startIcon={<UploadFile fontSize="small" />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ fontSize: 12 }}
                >
                  Import Results
                </Button>
              </Tooltip>

              {/* Save All */}
              {dirtyCount > 0 && (
                <Tooltip title={`Save all ${dirtyCount} modified rows`}>
                  <Button
                    variant="outlined" size="small" color="success"
                    startIcon={<Save fontSize="small" />}
                    onClick={handleSaveAll}
                    sx={{ fontSize: 12 }}
                  >
                    Save All ({dirtyCount})
                  </Button>
                </Tooltip>
              )}

              <Button
                variant="contained" startIcon={<Assignment />} size="small"
                onClick={() => setSubmitDialogOpen(true)}
              >
                Submit for Review
              </Button>
            </>
          )}

          <Tooltip title="Analysis timer">
            <Chip
              icon={<Timer fontSize="small" />}
              label="Timer"
              size="small"
              variant="outlined"
              onClick={() => setStopwatchDialogOpen(true)}
              sx={{ cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
            />
          </Tooltip>
          <Stopwatch
            dialogMode
            dialogOpen={stopwatchDialogOpen}
            onDialogClose={() => setStopwatchDialogOpen(false)}
            label="Analysis Timer"
          />
        </Stack>
      </Stack>

      {wsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load worksheet details from server. Showing default test cases.
        </Alert>
      )}

      {(oosCount > 0 || ootCount > 0) && (
        <Alert severity={oosCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
          {oosCount > 0 && <><strong>{oosCount} out-of-specification (OOS)</strong> result{oosCount > 1 ? 's' : ''} detected. {' '}</>}
          {ootCount > 0 && <><strong>{ootCount} out-of-trend (OOT)</strong> result{ootCount > 1 ? 's' : ''} flagged. {' '}</>}
          OOS/OOT rules are applied automatically from the worksheet template field configuration.
        </Alert>
      )}

      {/* Chemical Issuance Timers */}
      <ChemicalIssuanceTimerPanel timers={chemicalTimers} onStop={stopChemicalTimer} />

      {!canEdit && !wsLoading && (
        <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 2 }}>
          {['Approved', 'Rejected'].includes(wsStatus)
            ? `This worksheet is ${wsStatus.toLowerCase()} and is read-only.`
            : 'You have view-only access to this worksheet.'}
        </Alert>
      )}

      {/* Import hint banner — shown when no test cases have results yet */}
      {canEdit && testCases.length > 0 && !Object.values(entries).some((e) => e.resultValue) && (
        <Box
          sx={{
            mb: 2, p: 2, borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AutoAwesome sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>Bulk import available</Typography>
              <Typography variant="caption" color="text.secondary">
                Have instrument data in Excel? Import all results at once instead of entering them manually.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<ContentPaste fontSize="small" />} onClick={() => setUploadOpen(true)} sx={{ fontSize: 12 }}>
              Paste from Clipboard
            </Button>
            <Button size="small" variant="outlined" startIcon={<UploadFile fontSize="small" />} onClick={() => setUploadOpen(true)} sx={{ fontSize: 12 }}>
              Upload CSV
            </Button>
          </Stack>
        </Box>
      )}

      {/* Test Cases Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={700}>Test Cases</Typography>
                <Typography variant="body2" color="text.secondary">
                  {canEdit
                    ? 'Enter results manually, or use "Import Results" to paste from Excel/instrument exports.'
                    : 'Test case results are shown below.'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {oosCount > 0 && <Chip label={`${oosCount} OOS`} color="error" size="small" />}
                {ootCount > 0 && <Chip label={`${ootCount} OOT`} color="warning" size="small" />}
                {canEdit && (
                  <Tooltip title="Import results from CSV or paste from Excel">
                    <IconButton size="small" onClick={() => setUploadOpen(true)} sx={{ color: theme.palette.primary.main }}>
                      <UploadFile fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Box>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Specification</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>OOS/OOT</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}><Science fontSize="small" /><span>Chemical Used</span></Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}><Build fontSize="small" /><span>Instrument Used</span></Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Comments</TableCell>
                  {canEdit && <TableCell sx={{ fontWeight: 700, minWidth: 80 }} align="center">Save</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {testCases.map((tc: any) => {
                  const entry = getEntry(tc.id);
                  const valStatus = evaluateValidation(entry.resultValue, tc.validationRule);
                  const valCfg = valStatus ? VALIDATION_CFG[valStatus] : null;
                  const isSaving = saveFieldMutation.isPending;
                  const isSaved = saved[tc.id];
                  const isDirty = !isSaved && (entry.resultValue || entry.chemicalId || entry.instrumentId || entry.comments);

                  return (
                    <TableRow
                      key={tc.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                        bgcolor:
                          valStatus === 'fail' ? alpha(theme.palette.error.main, 0.03) :
                          valStatus === 'oot' ? alpha(theme.palette.warning.main, 0.03) :
                          isSaved ? alpha(theme.palette.success.main, 0.03) : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{tc.name}</Typography>
                        {tc.validationRule && (
                          <Typography variant="caption" sx={{ color: theme.palette.warning.main, display: 'block' }}>
                            {tc.validationRule.type === 'range'
                              ? `${tc.validationRule.min}–${tc.validationRule.max} ${tc.unit}`
                              : tc.validationRule.type === 'max'
                                ? `≤ ${tc.validationRule.max} ${tc.unit}`
                                : `≥ ${tc.validationRule.min} ${tc.unit}`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{tc.method}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{tc.specification}</Typography></TableCell>
                      <TableCell>
                        {canEdit ? (
                          <TextField
                            size="small"
                            placeholder="—"
                            value={entry.resultValue}
                            onChange={(e) => updateEntry(tc.id, 'resultValue', e.target.value)}
                            InputProps={{
                              endAdornment: tc.unit ? (
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, whiteSpace: 'nowrap' }}>{tc.unit}</Typography>
                              ) : undefined,
                            }}
                            sx={{
                              width: 140,
                              '& .MuiOutlinedInput-root fieldset': {
                                borderColor:
                                  valStatus === 'fail' ? theme.palette.error.main :
                                  valStatus === 'oot' ? theme.palette.warning.main : undefined,
                                borderWidth: valStatus ? 2 : 1,
                              },
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.resultValue ? 'text.primary' : 'text.disabled' }}>
                            {entry.resultValue || '—'}
                            {entry.resultValue && tc.unit && <Typography component="span" variant="caption" color="text.secondary"> {tc.unit}</Typography>}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {valCfg ? (
                          <Tooltip title={valStatus === 'fail' ? 'OOS — value outside specification limit' : valStatus === 'oot' ? 'OOT — value within trend warning range' : 'Result is within specification'}>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: valCfg.color }}>
                              {valCfg.icon}
                              <Typography variant="caption" fontWeight={700} sx={{ color: valCfg.color }}>{valCfg.label}</Typography>
                            </Stack>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <FormControl size="small" sx={{ width: 190 }}>
                            <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Chemical</InputLabel>
                            <Select
                              displayEmpty value={entry.chemicalId}
                              onChange={(e) => updateEntry(tc.id, 'chemicalId', e.target.value)}
                              label="Chemical"
                              renderValue={(val) =>
                                val ? chemicals.find((c) => c.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                              }
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {chemicals.map((c) => <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>{c.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.chemicalId ? 'text.primary' : 'text.disabled' }}>
                            {chemicals.find((c) => c.id === entry.chemicalId)?.label ?? '—'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <FormControl size="small" sx={{ width: 190 }}>
                            <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Instrument</InputLabel>
                            <Select
                              displayEmpty value={entry.instrumentId}
                              onChange={(e) => updateEntry(tc.id, 'instrumentId', e.target.value)}
                              label="Instrument"
                              renderValue={(val) =>
                                val ? instruments.find((ins) => ins.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                              }
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {instruments.map((ins) => <MenuItem key={ins.id} value={ins.id} sx={{ fontSize: 13 }}>{ins.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.instrumentId ? 'text.primary' : 'text.disabled' }}>
                            {instruments.find((ins) => ins.id === entry.instrumentId)?.label ?? '—'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <TextField
                            size="small"
                            placeholder="Optional comments…"
                            multiline minRows={1} maxRows={3}
                            value={entry.comments}
                            onChange={(e) => updateEntry(tc.id, 'comments', e.target.value)}
                            sx={{ width: 190 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.comments ? 'text.primary' : 'text.disabled', fontSize: 13 }}>
                            {entry.comments || '—'}
                          </Typography>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <Tooltip title={isSaved ? 'Saved' : 'Save this row'}>
                            <span>
                              <IconButton
                                size="small"
                                color={isSaved ? 'success' : 'primary'}
                                onClick={() => handleSave(tc.id)}
                                disabled={isSaving || (!isDirty && !isSaved)}
                                sx={{ transition: 'transform 0.15s', '&:not(:disabled):hover': { transform: 'scale(1.15)' } }}
                              >
                                {isSaved ? <CheckCircle fontSize="small" /> : <Save fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {canEdit && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/worksheets')}>Back to List</Button>
          {dirtyCount > 0 && (
            <Button variant="outlined" color="success" startIcon={<Save />} onClick={handleSaveAll}>
              Save All ({dirtyCount})
            </Button>
          )}
          <Button variant="contained" startIcon={<Assignment />} onClick={() => setSubmitDialogOpen(true)}>
            Submit Worksheet for Review
          </Button>
        </Box>
      )}

      {/* Upload/Import Dialog */}
      <UploadResultsDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        testCases={testCases}
        onApply={handleImportApply}
      />

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Submit Worksheet for Review</DialogTitle>
        <DialogContent>
          {(oosCount > 0 || ootCount > 0) ? (
            <Alert severity={oosCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {oosCount > 0 && `${oosCount} OOS result(s) detected. `}
              {ootCount > 0 && `${ootCount} OOT result(s) flagged. `}
              These will be highlighted for the reviewer.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>All validated fields are within specification.</Alert>
          )}
          {dirtyCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>{dirtyCount} row(s) have unsaved changes. Save them before submitting.</Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Once submitted, this worksheet will be locked and routed for QA review.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setSubmitDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={submitMutation.isPending ? <CircularProgress size={16} /> : <Assignment />}
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack('')}
        message={snack}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnack('')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
