import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Stack, Button,
  CircularProgress, Alert, IconButton, TextField, Select,
  MenuItem, FormControl, InputLabel, Paper, Divider,
  alpha, useTheme, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack, Save, CheckCircle, Science, Build, Assignment,
  InfoOutlined, Warning, CheckCircleOutlined, Cancel, Timer,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentExecutionsApi, documentsApi, chemicalsApi, instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import Stopwatch from '../../components/Stopwatch';

interface FieldEntry {
  fieldId: string;
  value: string;
  chemicalId: string;
  instrumentId: string;
  comments: string;
}

type ValidationStatus = 'pass' | 'fail' | 'oot' | null;


function evaluateValidation(
  value: string,
  rule: any
): ValidationStatus {
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

const VALIDATION_STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pass: { icon: <CheckCircleOutlined fontSize="small" />, color: '#2E7D32', label: 'Pass' },
  fail: { icon: <Cancel fontSize="small" />, color: '#C62828', label: 'OOS' },
  oot: { icon: <Warning fontSize="small" />, color: '#E65100', label: 'OOT' },
};

export default function DocumentExecutionPage() {
  const { docId, execId } = useParams<{ docId: string; execId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<Record<string, FieldEntry>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [stopwatchDialogOpen, setStopwatchDialogOpen] = useState(false);

  const { data: execData, isLoading: execLoading } = useQuery({
    queryKey: ['doc-execution', execId],
    queryFn: () => documentExecutionsApi.getById(Number(execId)),
    enabled: !!execId,
    retry: false,
  });

  const { data: fieldValuesData } = useQuery({
    queryKey: ['doc-exec-field-values', execId],
    queryFn: () => documentExecutionsApi.getFieldValues(Number(execId)),
    enabled: !!execId,
    retry: false,
  });

  const { data: parsedData } = useQuery({
    queryKey: ['document-parsed-for-exec', docId],
    queryFn: async () => {
      const versions = await documentsApi.getVersions(Number(docId));
      if (Array.isArray(versions) && versions.length > 0) {
        const latest = versions[0];
        return documentsApi.getParsed(Number(docId), latest.id ?? latest.versionId);
      }
      return null;
    },
    enabled: !!docId,
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

  const fields = Array.isArray((parsedData as any)?.fields)
    ? (parsedData as any).fields.map((f: any) => ({
        id: String(f.id ?? f.fieldId),
        label: f.label ?? f.name ?? `Field ${f.id}`,
        type: f.type ?? 'text',
        required: f.required ?? false,
        validationRule: f.validationRule ?? null,
      }))
    : [];

  const chemicals: { id: string; label: string }[] = Array.isArray(chemicalsData)
    ? chemicalsData.map((c: any) => ({
        id: String(c.id ?? c.registrationId),
        label: c.chemical?.name ?? c.name ?? `Chemical #${c.id}`,
      }))
    : [];

  const instruments: { id: string; label: string }[] = Array.isArray(instrumentsData)
    ? instrumentsData.map((ins: any) => ({
        id: String(ins.id ?? ins.instrumentId),
        label: ins.name ?? ins.instrumentName ?? `Instrument #${ins.id}`,
      }))
    : [];

  // Pre-populate from saved field values
  useEffect(() => {
    if (Array.isArray(fieldValuesData)) {
      const prefilled: Record<string, FieldEntry> = {};
      const savedMap: Record<string, boolean> = {};
      fieldValuesData.forEach((fv: any) => {
        const fId = String(fv.fieldId ?? fv.id);
        if (fv.value != null) {
          prefilled[fId] = {
            fieldId: fId,
            value: String(fv.value),
            chemicalId: String(fv.chemicalId ?? ''),
            instrumentId: String(fv.instrumentId ?? ''),
            comments: fv.comments ?? '',
          };
          savedMap[fId] = true;
        }
      });
      setEntries(prefilled);
      setSaved(savedMap);
    }
  }, [fieldValuesData]);

  const saveFieldMutation = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: unknown }) =>
      documentExecutionsApi.saveFieldValue(Number(execId), fieldId, data),
    onSuccess: (_, vars) => {
      setSaved((prev) => ({ ...prev, [String(vars.fieldId)]: true }));
      queryClient.invalidateQueries({ queryKey: ['doc-exec-field-values', execId] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => documentExecutionsApi.submit(Number(execId)),
    onSuccess: () => {
      setSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['doc-execution', execId] });
    },
  });

  const getEntry = (fId: string): FieldEntry =>
    entries[fId] ?? { fieldId: fId, value: '', chemicalId: '', instrumentId: '', comments: '' };

  const updateEntry = (fId: string, field: keyof FieldEntry, value: string) => {
    setSaved((prev) => ({ ...prev, [fId]: false }));
    setEntries((prev) => ({ ...prev, [fId]: { ...getEntry(fId), [field]: value } }));
  };

  const handleSave = (fId: string) => {
    const entry = getEntry(fId);
    saveFieldMutation.mutate({
      fieldId: Number(fId.replace('f-', '')),
      data: {
        value: entry.value,
        chemicalId: entry.chemicalId || null,
        instrumentId: entry.instrumentId || null,
        comments: entry.comments || null,
      },
    });
  };

  const exec = (execData as any) ?? null;
  const execStatus = exec?.status ?? 'Draft';
  const canEdit = !['Approved', 'Rejected', 'Submitted'].includes(execStatus);

  const oosCount = fields.filter((f: any) => {
    const entry = getEntry(f.id);
    return evaluateValidation(entry.value, f.validationRule) === 'fail';
  }).length;

  const ootCount = fields.filter((f: any) => {
    const entry = getEntry(f.id);
    return evaluateValidation(entry.value, f.validationRule) === 'oot';
  }).length;

  if (execLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(`/documents/${docId}`)} size="small" sx={{ color: 'text.secondary', mt: 0.5 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary">Document Execution</Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.25 }}>
            <Typography variant="h5" fontWeight={700}>
              Execution {exec?.code ?? exec?.execId ?? `#${execId}`}
            </Typography>
            <Chip
              label={execStatus}
              size="small"
              color={
                execStatus === 'Approved' ? 'success' :
                execStatus === 'Rejected' ? 'error' :
                execStatus === 'Submitted' ? 'warning' : 'default'
              }
            />
            {oosCount > 0 && (
              <Chip label={`${oosCount} OOS`} size="small" color="error" icon={<Cancel fontSize="small" />} />
            )}
            {ootCount > 0 && (
              <Chip label={`${ootCount} OOT`} size="small" color="warning" icon={<Warning fontSize="small" />} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Path: /document-executions/{execId} — replaces <code>--</code> with live inputs, OOS/OOT rules auto-applied from template
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Assignment />}
            size="small"
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit for Approval
          </Button>
        )}
        {/* Stopwatch — for timing document execution steps */}
        <Tooltip title="Execution timer">
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
          label="Execution Timer"
        />
      </Stack>

      {(oosCount > 0 || ootCount > 0) && (
        <Alert
          severity={oosCount > 0 ? 'error' : 'warning'}
          icon={oosCount > 0 ? <Cancel /> : <Warning />}
          sx={{ mb: 2 }}
        >
          {oosCount > 0 && <><strong>{oosCount} out-of-specification (OOS)</strong> result{oosCount > 1 ? 's' : ''} detected. {' '}</>}
          {ootCount > 0 && <><strong>{ootCount} out-of-trend (OOT)</strong> result{ootCount > 1 ? 's' : ''} flagged. {' '}</>}
          Review flagged fields before submitting.
        </Alert>
      )}

      {!canEdit && (
        <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 2 }}>
          This execution is <strong>{execStatus}</strong> and is read-only.
        </Alert>
      )}

      {/* Fields */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={700}>Document Fields</Typography>
            <Typography variant="body2" color="text.secondary">
              {canEdit
                ? 'Each — placeholder from the DOCX is replaced with an input. OOS/OOT validation rules apply automatically.'
                : 'Field values recorded for this execution.'}
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Paper elevation={0}>
              <Box
                component="table"
                sx={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  '& th, & td': {
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    textAlign: 'left',
                    verticalAlign: 'middle',
                  },
                  '& th': {
                    bgcolor: theme.palette.grey[50],
                    fontWeight: 700,
                    fontSize: 12,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  },
                  '& tr:last-child td': { borderBottom: 'none' },
                  '& tr:hover td': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: 200 }}>Field</th>
                    <th style={{ width: 60 }}>Req.</th>
                    <th style={{ width: 180 }}>Value (replaces —)</th>
                    <th style={{ width: 100 }}>Validation</th>
                    <th style={{ width: 190 }}>Chemical Used</th>
                    <th style={{ width: 190 }}>Instrument Used</th>
                    <th style={{ width: 180 }}>Comments</th>
                    {canEdit && <th style={{ width: 70, textAlign: 'center' }}>Save</th>}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field: any) => {
                    const entry = getEntry(field.id);
                    const valStatus = evaluateValidation(entry.value, field.validationRule);
                    const valCfg = valStatus ? VALIDATION_STATUS_CONFIG[valStatus] : null;
                    const isSaved = saved[field.id];
                    const isDirty = !isSaved && (entry.value || entry.chemicalId || entry.instrumentId || entry.comments);

                    return (
                      <tr key={field.id}>
                        {/* Field label */}
                        <td>
                          <Typography variant="body2" fontWeight={600}>{field.label}</Typography>
                          {field.validationRule && (
                            <Typography variant="caption" sx={{ color: theme.palette.warning.main, display: 'block', mt: 0.25 }}>
                              {field.validationRule.type === 'range'
                                ? `Spec: ${field.validationRule.min}–${field.validationRule.max}`
                                : field.validationRule.type === 'max'
                                  ? `Spec: ≤ ${field.validationRule.max}`
                                  : `Spec: ≥ ${field.validationRule.min}`
                              }
                            </Typography>
                          )}
                        </td>

                        {/* Required */}
                        <td>
                          {field.required ? (
                            <Typography variant="caption" color="error.main" fontWeight={700}>REQ</Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled">opt</Typography>
                          )}
                        </td>

                        {/* Value input */}
                        <td>
                          {canEdit ? (
                            <TextField
                              size="small"
                              placeholder="—"
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              multiline={field.type === 'textarea'}
                              minRows={field.type === 'textarea' ? 1 : undefined}
                              maxRows={field.type === 'textarea' ? 3 : undefined}
                              value={entry.value}
                              onChange={(e) => updateEntry(field.id, 'value', e.target.value)}
                              sx={{
                                width: 160,
                                '& .MuiOutlinedInput-root fieldset': {
                                  borderColor: valStatus === 'fail' ? theme.palette.error.main :
                                    valStatus === 'oot' ? theme.palette.warning.main : undefined,
                                },
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: entry.value ? 'text.primary' : 'text.disabled' }}>
                              {entry.value || '—'}
                            </Typography>
                          )}
                        </td>

                        {/* OOS/OOT indicator */}
                        <td>
                          {valCfg ? (
                            <Tooltip title={
                              valStatus === 'fail'
                                ? `OOS — Out of Specification`
                                : valStatus === 'oot'
                                  ? `OOT — Out of Trend`
                                  : 'Pass'
                            }>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: valCfg.color }}>
                                {valCfg.icon}
                                <Typography variant="caption" fontWeight={700} sx={{ color: valCfg.color }}>
                                  {valCfg.label}
                                </Typography>
                              </Stack>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </td>

                        {/* Chemical dropdown */}
                        <td>
                          {canEdit ? (
                            <FormControl size="small" sx={{ width: 180 }}>
                              <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Chemical</InputLabel>
                              <Select
                                displayEmpty
                                value={entry.chemicalId}
                                onChange={(e) => updateEntry(field.id, 'chemicalId', e.target.value)}
                                label="Chemical"
                                renderValue={(val) =>
                                  val ? chemicals.find((c) => c.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                                }
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {chemicals.map((c) => (
                                  <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>{c.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="body2" sx={{ color: entry.chemicalId ? 'text.primary' : 'text.disabled' }}>
                              {chemicals.find((c) => c.id === entry.chemicalId)?.label ?? '—'}
                            </Typography>
                          )}
                        </td>

                        {/* Instrument dropdown */}
                        <td>
                          {canEdit ? (
                            <FormControl size="small" sx={{ width: 180 }}>
                              <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Instrument</InputLabel>
                              <Select
                                displayEmpty
                                value={entry.instrumentId}
                                onChange={(e) => updateEntry(field.id, 'instrumentId', e.target.value)}
                                label="Instrument"
                                renderValue={(val) =>
                                  val ? instruments.find((i) => i.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                                }
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {instruments.map((ins) => (
                                  <MenuItem key={ins.id} value={ins.id} sx={{ fontSize: 13 }}>{ins.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="body2" sx={{ color: entry.instrumentId ? 'text.primary' : 'text.disabled' }}>
                              {instruments.find((i) => i.id === entry.instrumentId)?.label ?? '—'}
                            </Typography>
                          )}
                        </td>

                        {/* Comments */}
                        <td>
                          {canEdit ? (
                            <TextField
                              size="small"
                              placeholder="Optional…"
                              multiline minRows={1} maxRows={3}
                              value={entry.comments}
                              onChange={(e) => updateEntry(field.id, 'comments', e.target.value)}
                              sx={{ width: 170 }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: entry.comments ? 'text.primary' : 'text.disabled', fontSize: 13 }}>
                              {entry.comments || '—'}
                            </Typography>
                          )}
                        </td>

                        {/* Save button */}
                        {canEdit && (
                          <td style={{ textAlign: 'center' }}>
                            <Tooltip title={isSaved ? 'Saved' : 'Save this field'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={isSaved ? 'success' : 'primary'}
                                  onClick={() => handleSave(field.id)}
                                  disabled={saveFieldMutation.isPending || (!isDirty && !isSaved)}
                                  sx={{ transition: 'transform 0.15s', '&:not(:disabled):hover': { transform: 'scale(1.15)' } }}
                                >
                                  {isSaved ? <CheckCircle fontSize="small" /> : <Save fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {canEdit && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(`/documents/${docId}`)}>
            Back to Document
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit for Approval
          </Button>
        </Box>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Submit for Approval</DialogTitle>
        <DialogContent>
          {(oosCount > 0 || ootCount > 0) ? (
            <Alert severity={oosCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {oosCount > 0 && `${oosCount} OOS result(s) detected. `}
              {ootCount > 0 && `${ootCount} OOT result(s) flagged. `}
              Submitting will flag these for reviewer attention.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              All validated fields are within specification.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Once submitted, this execution will be locked for editing and routed for approval.
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
    </Box>
  );
}
