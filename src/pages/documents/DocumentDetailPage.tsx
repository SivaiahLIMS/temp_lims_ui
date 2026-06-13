import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Chip, Stack, Button,
  CircularProgress, Alert, IconButton, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  alpha, useTheme, Tooltip, Badge, Select, MenuItem,
  FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, Publish, Block,
  History, Article, PlayArrow, Timer,
  Assignment, RuleFolder, HourglassEmpty, Visibility,
  Add, Delete, Edit, Save, DragIndicator,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, documentExecutionsApi } from '../../api/endpoints';
import type { DocumentField, FieldType } from '../../api/types';
import { useUIStore } from '../../store/uiStore';
import DocumentUploader from '../../components/DocumentUploader';
import Stopwatch from '../../components/Stopwatch';

type VersionStatus = 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Retired';

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { label: 'Draft', color: 'default' },
  'Under Review': { label: 'Under Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Published: { label: 'Published', color: 'info' },
  Retired: { label: 'Retired', color: 'error' },
};

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Free-text input' },
  { value: 'number', label: 'Number', description: 'Numeric entry with optional OOS range validation' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'dropdown_chemical', label: 'Chemical Dropdown', description: 'Select from registered chemicals' },
  { value: 'dropdown_instrument', label: 'Instrument Dropdown', description: 'Select from active instruments' },
  { value: 'comments', label: 'Comments', description: 'Multi-line free text comments' },
];

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  text: '#1565C0',
  number: '#2E7D32',
  date: '#E65100',
  dropdown_chemical: '#00695C',
  dropdown_instrument: '#0277BD',
  comments: '#546E7A',
};

const PLACEHOLDER_VERSIONS = [
  { id: 1, version: 3, status: 'Published', uploadedBy: 'John Smith', uploadedAt: '2026-05-20', filename: 'hplc_method_v3.docx' },
  { id: 2, version: 2, status: 'Retired', uploadedBy: 'Sarah Johnson', uploadedAt: '2026-03-10', filename: 'hplc_method_v2.docx' },
  { id: 3, version: 1, status: 'Retired', uploadedBy: 'Sarah Johnson', uploadedAt: '2025-11-05', filename: 'hplc_method_v1.docx' },
];

const PLACEHOLDER_EXECUTIONS = [
  { id: 1, execId: 'EXEC-001', status: 'Approved', createdBy: 'Mike Chen', createdAt: '2026-05-25', worksheetId: 3 },
  { id: 2, execId: 'EXEC-002', status: 'Pending Approval', createdBy: 'Emma Davis', createdAt: '2026-05-28', worksheetId: null },
  { id: 3, execId: 'EXEC-003', status: 'Draft', createdBy: 'Robert Wilson', createdAt: '2026-05-29', worksheetId: null },
];

const EMPTY_FIELD: Omit<DocumentField, 'id'> = {
  document_id: 0,
  version_id: null,
  label: '',
  field_type: 'text',
  placeholder: '--',
  required: false,
  validation_rule: null,
  sort_order: 0,
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [stopwatchOpen, setStopwatchOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [createExecDialogOpen, setCreateExecDialogOpen] = useState(false);

  // Field management state
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [editField, setEditField] = useState<DocumentField | null>(null);
  const [fieldForm, setFieldForm] = useState<Omit<DocumentField, 'id'>>(EMPTY_FIELD);

  // ── Document queries ─────────────────────────────────────────────────────
  const { data: docData, isLoading: docLoading, isError: docError } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: () => documentsApi.getVersions(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const { data: executions } = useQuery({
    queryKey: ['document-executions', id],
    queryFn: () => documentExecutionsApi.listAll(currentBranchId),
    retry: false,
  });

  const doc = (docData as any) ?? null;
  const docTitle = doc?.title ?? doc?.name ?? `Document #${id}`;
  const docCode = doc?.documentCode ?? doc?.code ?? `DOC-${id}`;
  const docType = doc?.type ?? doc?.documentType ?? 'Document';

  const versions = Array.isArray(versionsData) && versionsData.length > 0
    ? versionsData.map((v: any) => ({
        id: v.id ?? v.versionId,
        version: v.versionNumber ?? v.version,
        status: v.status ?? 'Draft',
        uploadedBy: v.uploadedBy?.username ?? v.uploadedByName ?? 'Unknown',
        uploadedAt: v.uploadedAt?.split('T')[0] ?? v.createdAt?.split('T')[0] ?? '',
        filename: v.filename ?? v.originalFilename ?? `version_${v.versionNumber}.docx`,
      }))
    : [];

  const latestVersion = versions[0];
  const activeVersion = selectedVersion != null
    ? versions.find((v) => v.version === selectedVersion) ?? latestVersion
    : latestVersion;

  const docExecutions = Array.isArray(executions)
    ? executions.filter((e: any) => String(e.documentId) === id)
    : [];

  const currentStatus = activeVersion?.status as VersionStatus | undefined;
  const statusCfg = STATUS_CONFIG[currentStatus ?? 'Draft'] ?? { label: currentStatus ?? 'Unknown', color: 'default' as const };

  // ── Document fields (via backend REST) ───────────────────────────────────
  const { data: rawFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['document-fields', id],
    queryFn: () => documentsApi.listFields(Number(id)),
    enabled: !!id,
    retry: false,
  });
  const dbFields: DocumentField[] = Array.isArray(rawFields)
    ? rawFields
    : ((rawFields as any)?.data ?? []);

  const addFieldMutation = useMutation({
    mutationFn: (field: Omit<DocumentField, 'id'>) =>
      documentsApi.createField(Number(id), field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-fields', id] });
      setAddFieldOpen(false);
      setFieldForm({ ...EMPTY_FIELD, document_id: Number(id) });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ fid, updates }: { fid: string; updates: Partial<DocumentField> }) =>
      documentsApi.updateField(Number(id), fid, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-fields', id] });
      setEditField(null);
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fid: string) => documentsApi.deactivateField(Number(id), fid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-fields', id] }),
  });

  const openAddField = () => {
    setFieldForm({ ...EMPTY_FIELD, document_id: Number(id), sort_order: dbFields.length });
    setAddFieldOpen(true);
  };

  const openEditField = (field: DocumentField) => {
    setEditField(field);
    setFieldForm({ ...field });
  };

  // ── Lifecycle mutations ───────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () => documentsApi.submitForReview(Number(id), activeVersion!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-versions', id] }),
  });

  const approveMutation = useMutation({
    mutationFn: () => documentsApi.approve(Number(id), activeVersion!.id, { comments: reviewComment }),
    onSuccess: () => {
      setApproveDialogOpen(false);
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => documentsApi.reject(Number(id), activeVersion!.id, { comments: reviewComment }),
    onSuccess: () => {
      setRejectDialogOpen(false);
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => documentsApi.publish(Number(id), activeVersion!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-versions', id] }),
  });

  const retireMutation = useMutation({
    mutationFn: () => documentsApi.retire(Number(id), activeVersion!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-versions', id] }),
  });

  const createExecMutation = useMutation({
    mutationFn: () => documentExecutionsApi.create({
      documentId: Number(id),
      versionId: activeVersion?.id,
      branchId: currentBranchId,
    }),
    onSuccess: (data: any) => {
      setCreateExecDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document-executions', id] });
      if (data?.id) navigate(`/documents/${id}/executions/${data.id}`);
    },
  });

  if (docLoading) {
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
        <IconButton onClick={() => navigate('/documents')} size="small" sx={{ color: 'text.secondary', mt: 0.5 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary">Document Management</Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.25 }}>
            <Typography variant="h5" fontWeight={700}>{docTitle}</Typography>
            <Chip label={docCode} size="small" variant="outlined" sx={{ fontWeight: 600, fontFamily: 'monospace' }} />
            <Chip label={docType} size="small" variant="outlined" color="secondary" />
            {activeVersion && <Chip label={statusCfg.label} color={statusCfg.color} size="small" />}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Tooltip title="Open stopwatch">
            <Chip
              icon={<Timer fontSize="small" />} label="Timer" size="small" variant="outlined"
              onClick={() => setStopwatchOpen(true)}
              sx={{ cursor: 'pointer', fontWeight: 600 }}
            />
          </Tooltip>
          <DocumentUploader
            compact buttonLabel="Upload Version"
            accept={['.docx', '.doc']}
            onUpload={(file) => documentsApi.uploadDocx(Number(id), file, currentBranchId)}
            onAllDone={() => {
              queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
              queryClient.invalidateQueries({ queryKey: ['document', id] });
            }}
          />
          {currentStatus === 'Draft' && (
            <Button variant="outlined" size="small" color="warning"
              startIcon={submitMutation.isPending ? <CircularProgress size={14} /> : <HourglassEmpty />}
              onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
            >
              Submit for Review
            </Button>
          )}
          {currentStatus === 'Under Review' && (
            <>
              <Button variant="contained" size="small" color="success" startIcon={<CheckCircle />} onClick={() => setApproveDialogOpen(true)}>Approve</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<Cancel />} onClick={() => setRejectDialogOpen(true)}>Reject</Button>
            </>
          )}
          {currentStatus === 'Approved' && (
            <Button variant="contained" size="small" color="info" startIcon={<Publish />}
              onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              Publish
            </Button>
          )}
          {currentStatus === 'Published' && (
            <>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={() => setCreateExecDialogOpen(true)}>Create Execution</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<Block />}
                onClick={() => retireMutation.mutate()} disabled={retireMutation.isPending}>
                Retire
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {docError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load document details from server. Showing sample data.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            label={
              <Badge badgeContent={dbFields.length || undefined} color="primary" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                Document Fields
              </Badge>
            }
            icon={<RuleFolder fontSize="small" />} iconPosition="start"
          />
          <Tab label={`Versions (${versions.length})`} icon={<History fontSize="small" />} iconPosition="start" />
          <Tab
            label={
              <Badge badgeContent={docExecutions.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                Executions
              </Badge>
            }
            icon={<Assignment fontSize="small" />} iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* ── Tab 0: Document Fields ── */}
      {activeTab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Document Fields</Typography>
              <Typography variant="body2" color="text.secondary">
                Define each field that will appear as an input in worksheet executions. Set the type to control which control renders in execution forms.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} size="small" onClick={openAddField}>
              Add Field
            </Button>
          </Stack>

          {fieldsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : dbFields.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <RuleFolder sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No fields defined yet. Add the fields that analysts will fill in when executing this document.
              </Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={openAddField}>Add First Field</Button>
            </Card>
          ) : (
            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Field Label</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>OOS/OOT Validation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Preview</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dbFields.map((field, idx) => {
                      const ftColor = FIELD_TYPE_COLORS[field.field_type] ?? theme.palette.primary.main;
                      const ftLabel = FIELD_TYPES.find((t) => t.value === field.field_type)?.label ?? field.field_type;
                      return (
                        <TableRow key={field.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{idx + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{field.label}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ftLabel}
                              size="small"
                              sx={{ fontSize: 11, bgcolor: alpha(ftColor, 0.12), color: ftColor, fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            {field.required
                              ? <Chip label="Required" size="small" color="error" />
                              : <Typography variant="caption" color="text.disabled">Optional</Typography>
                            }
                          </TableCell>
                          <TableCell>
                            {field.validation_rule?.type === 'range' ? (
                              <Chip
                                label={`${field.validation_rule.min} – ${field.validation_rule.max}`}
                                size="small" color="warning" variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: 11 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <FieldPreview field={field} />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                              <Tooltip title="Edit field">
                                <IconButton size="small" onClick={() => openEditField(field)} sx={{ color: theme.palette.primary.main }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete field">
                                <IconButton
                                  size="small"
                                  onClick={() => deleteFieldMutation.mutate(field.id)}
                                  sx={{ color: theme.palette.error.main }}
                                  disabled={deleteFieldMutation.isPending}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {/* ── Tab 1: Versions ── */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Version History</Typography>
          {versionsLoading ? (
            <CircularProgress />
          ) : (
            <Stack spacing={1.5}>
              {versions.map((v) => {
                const vCfg = STATUS_CONFIG[v.status] ?? { label: v.status, color: 'default' as const };
                const isActive = v.version === (selectedVersion ?? versions[0]?.version);
                return (
                  <Paper key={v.id} variant="outlined" onClick={() => setSelectedVersion(v.version)}
                    sx={{
                      p: 2.5, cursor: 'pointer',
                      borderColor: isActive ? theme.palette.primary.main : theme.palette.divider,
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.03) : '#fff',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.03) },
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : theme.palette.grey[100], display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? theme.palette.primary.main : theme.palette.text.secondary }}>
                          <Article fontSize="small" />
                        </Box>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={700}>Version {v.version}</Typography>
                            {isActive && v.version === versions[0]?.version && <Chip label="Latest" size="small" color="primary" />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {v.filename} &bull; Uploaded by {v.uploadedBy} on {v.uploadedAt}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip label={vCfg.label} color={vCfg.color} size="small" />
                        <Tooltip title="View parsed content">
                          <IconButton size="small" color="primary"><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      {/* ── Tab 2: Executions ── */}
      {activeTab === 2 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Document Executions</Typography>
              <Typography variant="body2" color="text.secondary">
                Execution instances created from this document.
              </Typography>
            </Box>
            <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={() => setCreateExecDialogOpen(true)}>
              New Execution
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Execution ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Worksheet</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docExecutions.map((exec: any) => {
                    const execCfg = STATUS_CONFIG[exec.status] ?? { label: exec.status, color: 'default' as const };
                    return (
                      <TableRow key={exec.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', color: theme.palette.primary.main }}>
                            {exec.execId ?? `EXEC-${exec.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip label={execCfg.label} color={execCfg.color} size="small" /></TableCell>
                        <TableCell><Typography variant="body2">{exec.createdBy}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{exec.createdAt?.split('T')[0] ?? exec.createdAt}</Typography></TableCell>
                        <TableCell>
                          {exec.worksheetId
                            ? <Button size="small" variant="text" color="primary" onClick={() => navigate(`/worksheets/${exec.worksheetId}/execute`)} sx={{ fontSize: 12 }}>WS-{exec.worksheetId}</Button>
                            : <Typography variant="caption" color="text.disabled">—</Typography>
                          }
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="text" startIcon={<Visibility fontSize="small" />} onClick={() => navigate(`/documents/${id}/executions/${exec.id}`)} sx={{ fontSize: 12 }}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {docExecutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Stack alignItems="center" spacing={1}>
                          <Assignment sx={{ fontSize: 36, color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.secondary">No executions yet</Typography>
                          <Button size="small" variant="outlined" onClick={() => setCreateExecDialogOpen(true)}>Create First Execution</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ── Stopwatch ── */}
      <Stopwatch dialogMode dialogOpen={stopwatchOpen} onDialogClose={() => setStopwatchOpen(false)} label="Document Timer" />

      {/* ── Add / Edit Field Dialog ── */}
      <FieldDialog
        open={addFieldOpen || editField != null}
        title={editField ? 'Edit Field' : 'Add Field'}
        value={fieldForm}
        onChange={setFieldForm}
        onClose={() => { setAddFieldOpen(false); setEditField(null); }}
        onSave={() => {
          if (editField) {
            updateFieldMutation.mutate({ fid: editField.id, updates: fieldForm });
          } else {
            addFieldMutation.mutate({ ...fieldForm, document_id: Number(id) });
          }
        }}
        isSaving={addFieldMutation.isPending || updateFieldMutation.isPending}
        error={(addFieldMutation.error ?? updateFieldMutation.error) as Error | null}
      />

      {/* ── Approve Dialog ── */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Approve Version {activeVersion?.version}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Confirm approval of <strong>{docCode} v{activeVersion?.version}</strong>.
          </Typography>
          <TextField label="Approval comments (optional)" multiline minRows={2} fullWidth size="small" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setApproveDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="success"
            startIcon={approveMutation.isPending ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Reject Version {activeVersion?.version}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for rejecting <strong>{docCode} v{activeVersion?.version}</strong>.
          </Typography>
          <TextField label="Reason for rejection" multiline minRows={3} fullWidth size="small" required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRejectDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="error"
            startIcon={rejectMutation.isPending ? <CircularProgress size={16} /> : <Cancel />}
            onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !reviewComment.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create Execution Dialog ── */}
      <Dialog open={createExecDialogOpen} onClose={() => setCreateExecDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Create New Execution</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            A new execution instance will be created from <strong>{docCode} v{activeVersion?.version}</strong>.
            All {dbFields.length} defined fields will become editable inputs in the execution form.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateExecDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained"
            startIcon={createExecMutation.isPending ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={() => createExecMutation.mutate()} disabled={createExecMutation.isPending}>
            Create Execution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── FieldPreview — inline mini-preview of the field control ──────────────────
function FieldPreview({ field }: { field: DocumentField }) {
  const theme = useTheme();
  switch (field.field_type) {
    case 'text':
      return (
        <Box sx={{ px: 1.5, py: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.grey[50], minWidth: 120, fontSize: 12, color: 'text.disabled' }}>
          {field.placeholder}
        </Box>
      );
    case 'number':
      return (
        <Box sx={{ px: 1.5, py: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.grey[50], minWidth: 80, fontSize: 12, color: 'text.disabled', textAlign: 'right' }}>
          {field.placeholder}
        </Box>
      );
    case 'date':
      return (
        <Box sx={{ px: 1.5, py: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.grey[50], fontSize: 12, color: 'text.disabled' }}>
          yyyy-mm-dd
        </Box>
      );
    case 'dropdown_chemical':
      return (
        <Chip label="Chemical selector" size="small" sx={{ fontSize: 10, bgcolor: alpha('#00695C', 0.1), color: '#00695C' }} />
      );
    case 'dropdown_instrument':
      return (
        <Chip label="Instrument selector" size="small" sx={{ fontSize: 10, bgcolor: alpha('#0277BD', 0.1), color: '#0277BD' }} />
      );
    case 'comments':
      return (
        <Box sx={{ px: 1.5, py: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.grey[50], minWidth: 120, fontSize: 12, color: 'text.disabled', fontStyle: 'italic' }}>
          Multi-line…
        </Box>
      );
    default:
      return <Typography variant="caption" color="text.disabled">{field.placeholder}</Typography>;
  }
}

// ── FieldDialog — add or edit a field ────────────────────────────────────────
interface FieldDialogProps {
  open: boolean;
  title: string;
  value: Omit<DocumentField, 'id'>;
  onChange: (v: Omit<DocumentField, 'id'>) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  error: Error | null;
}

function FieldDialog({ open, title, value, onChange, onClose, onSave, isSaving, error }: FieldDialogProps) {
  const isRange = value.field_type === 'number';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Field Label" size="small" fullWidth required
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="e.g. Sample ID"
        />

        <FormControl size="small" fullWidth>
          <InputLabel>Field Type</InputLabel>
          <Select
            value={value.field_type}
            label="Field Type"
            onChange={(e) => onChange({ ...value, field_type: e.target.value as FieldType })}
          >
            {FIELD_TYPES.map((ft) => (
              <MenuItem key={ft.value} value={ft.value}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{ft.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{ft.description}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Controls which input renders in execution forms</FormHelperText>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Required</InputLabel>
          <Select
            value={value.required ? 'yes' : 'no'}
            label="Required"
            onChange={(e) => onChange({ ...value, required: e.target.value === 'yes' })}
          >
            <MenuItem value="yes">Required — analyst must fill this</MenuItem>
            <MenuItem value="no">Optional</MenuItem>
          </Select>
        </FormControl>

        {isRange && (
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              OOS / OOT Validation Range
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min" size="small" type="number"
                value={value.validation_rule?.min ?? ''}
                onChange={(e) => onChange({
                  ...value,
                  validation_rule: { type: 'range', min: Number(e.target.value), max: value.validation_rule?.max ?? 0 },
                })}
              />
              <TextField
                label="Max" size="small" type="number"
                value={value.validation_rule?.max ?? ''}
                onChange={(e) => onChange({
                  ...value,
                  validation_rule: { type: 'range', min: value.validation_rule?.min ?? 0, max: Number(e.target.value) },
                })}
              />
            </Stack>
            <FormHelperText>Values outside this range will trigger an OOS/OOT flag</FormHelperText>
          </Box>
        )}

        <TextField
          label="Sort Order" size="small" type="number"
          value={value.sort_order}
          onChange={(e) => onChange({ ...value, sort_order: Number(e.target.value) })}
        />

        {error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
          onClick={onSave}
          disabled={isSaving || !value.label}
        >
          Save Field
        </Button>
      </DialogActions>
    </Dialog>
  );
}
