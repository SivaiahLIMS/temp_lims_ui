import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField,
  InputAdornment, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs, IconButton,
  alpha, useTheme, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add, Search, Article, FilterList, Description,
  CheckCircle, HourglassEmpty, Block, Visibility, Upload,
  Close,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import DocumentUploader from '../../components/DocumentUploader';

type DocStatus = 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Retired';

interface DocumentRow {
  id: string;
  docId: string;
  title: string;
  type: string;
  status: DocStatus;
  version: number;
  updatedAt: string;
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { label: 'Draft', color: 'default' },
  'Under Review': { label: 'Under Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Published: { label: 'Published', color: 'info' },
  Retired: { label: 'Retired', color: 'error' },
};

const PLACEHOLDER_DOCS: DocumentRow[] = [];

const TAB_FILTERS: { label: string; key: string; filter: (d: DocumentRow) => boolean }[] = [
  { label: 'All Documents', key: 'all', filter: () => true },
  { label: 'Draft', key: 'draft', filter: (d) => d.status === 'Draft' },
  { label: 'Under Review', key: 'review', filter: (d) => d.status === 'Under Review' },
  { label: 'Approved / Published', key: 'approved', filter: (d) => ['Approved', 'Published'].includes(d.status) },
  { label: 'Retired', key: 'retired', filter: (d) => d.status === 'Retired' },
];

export default function DocumentsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [newDocDialog, setNewDocDialog] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [newDocForm, setNewDocForm] = useState({ title: '', type: 'SOP', description: '' });

  const { data: apiDocs, isLoading, isError } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
    retry: false,
  });

  const rows: DocumentRow[] = Array.isArray(apiDocs)
    ? (apiDocs as any[]).map((d) => ({
        id: String(d.id),
        docId: d.documentCode ?? d.code ?? `DOC-${d.id}`,
        title: d.title ?? d.name ?? 'Untitled',
        type: d.type ?? d.documentType ?? 'Document',
        status: d.status ?? 'Draft',
        version: d.currentVersion ?? d.version ?? 1,
        updatedAt: d.updatedAt?.split('T')[0] ?? d.updatedDate ?? '',
      }))
    : [];

  const createMutation = useMutation({
    mutationFn: () => documentsApi.create({ ...newDocForm }),
    onSuccess: (data: any) => {
      setNewDocDialog(false);
      setNewDocForm({ title: '', type: 'SOP', description: '' });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      // Prompt to upload DOCX right after creation
      if (data?.id) setUploadTargetId(Number(data.id));
    },
  });

  const handleUpload = async (file: File) => {
    if (!uploadTargetId) throw new Error('No document selected');
    return documentsApi.uploadDocx(uploadTargetId, file, currentBranchId);
  };

  const handleUploadDone = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    setUploadTargetId(null);
  };

  const filtered = rows
    .filter(TAB_FILTERS[activeTab].filter)
    .filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const statusCounts = {
    draft: rows.filter((d) => d.status === 'Draft').length,
    review: rows.filter((d) => d.status === 'Under Review').length,
    approved: rows.filter((d) => ['Approved', 'Published'].includes(d.status)).length,
    retired: rows.filter((d) => d.status === 'Retired').length,
  };

  const columns: GridColDef[] = [
    {
      field: 'docId', headerName: 'Doc ID', width: 140,
      renderCell: (p) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: theme.palette.primary.main }}>
          {p.value}
        </Typography>
      ),
    },
    { field: 'title', headerName: 'Title', flex: 2, minWidth: 240 },
    {
      field: 'type', headerName: 'Type', width: 130,
      renderCell: (p) => (
        <Chip label={p.value} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600 }} />
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (p) => {
        const cfg = STATUS_CONFIG[p.value as DocStatus] ?? { label: p.value, color: 'default' as const };
        return <Chip label={cfg.label} color={cfg.color} size="small" />;
      },
    },
    {
      field: 'version', headerName: 'Version', width: 90, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>v{p.value}</Typography>
      ),
    },
    { field: 'updatedAt', headerName: 'Last Updated', width: 130 },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small" variant="text" color="primary"
            startIcon={<Visibility fontSize="small" />}
            onClick={() => navigate(`/documents/${p.row.id}`)}
            sx={{ fontSize: 12, px: 1 }}
          >
            View
          </Button>
          {/* Compact uploader per row */}
          <DocumentUploader
            compact
            buttonLabel="Upload"
            accept={['.docx', '.doc', '.pdf']}
            onUpload={(file) => {
              setUploadTargetId(Number(p.row.id));
              return documentsApi.uploadDocx(Number(p.row.id), file, currentBranchId);
            }}
            onAllDone={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
          />
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Documents</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            DOCX upload, parsing, lifecycle management and worksheet execution
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {/* Global uploader — creates a new doc + uploads in one flow */}
          <DocumentUploader
            compact
            buttonLabel="Quick Upload"
            accept={['.docx', '.doc', '.pdf']}
            subtitle="Upload a DOCX to create a new document version"
            onUpload={(file) => {
              if (!uploadTargetId) throw new Error('Select a document first');
              return documentsApi.uploadDocx(uploadTargetId, file, currentBranchId);
            }}
            onAllDone={handleUploadDone}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewDocDialog(true)}
          >
            New Document
          </Button>
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Draft', count: statusCounts.draft, icon: <Description />, color: theme.palette.grey[600] },
          { label: 'Under Review', count: statusCounts.review, icon: <HourglassEmpty />, color: theme.palette.warning.main },
          { label: 'Approved / Published', count: statusCounts.approved, icon: <CheckCircle />, color: theme.palette.success.main },
          { label: 'Retired', count: statusCounts.retired, icon: <Block />, color: theme.palette.error.main },
        ].map((stat) => (
          <Card key={stat.label} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: alpha(stat.color, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stat.count}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      {/* Main table card */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 44 }}>
            {TAB_FILTERS.map((t) => (
              <Tab key={t.key} label={t.label} sx={{ minHeight: 44, py: 0 }} />
            ))}
          </Tabs>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <TextField
            placeholder="Search documents…"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" size="small" startIcon={<FilterList />}>Filter</Button>
        </Stack>

        {isError && (
          <Alert severity="warning" sx={{ mx: 2, mt: 2 }}>
            Could not load documents from the server. Please try again.
          </Alert>
        )}

        <Box sx={{ height: 520 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filtered}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { borderColor: theme.palette.divider },
                '& .MuiDataGrid-columnHeaders': { bgcolor: theme.palette.grey[50] },
              }}
            />
          )}
        </Box>
      </Card>

      {/* New Document Dialog */}
      <Dialog open={newDocDialog} onClose={() => setNewDocDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Article color="primary" />
          Create New Document
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Document Title"
              fullWidth required size="small"
              value={newDocForm.title}
              onChange={(e) => setNewDocForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., HPLC Method Validation Protocol"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={newDocForm.type}
                label="Document Type"
                onChange={(e) => setNewDocForm((p) => ({ ...p, type: e.target.value }))}
              >
                {['SOP', 'Method', 'Protocol', 'Procedure', 'Specification', 'Guideline', 'Policy', 'Form'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description (optional)"
              fullWidth multiline minRows={2} size="small"
              value={newDocForm.description}
              onChange={(e) => setNewDocForm((p) => ({ ...p, description: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setNewDocDialog(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            disabled={!newDocForm.title.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}
          >
            Create Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post-creation upload dialog */}
      <Dialog
        open={!!uploadTargetId && !newDocDialog}
        onClose={() => setUploadTargetId(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Upload color="primary" />
            <Typography fontWeight={700}>Upload Document Version</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setUploadTargetId(null)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DocumentUploader
            accept={['.docx', '.doc', '.pdf']}
            label="Drop your DOCX here or click to browse"
            subtitle="Supported: .docx, .doc, .pdf · Max 50 MB"
            onUpload={handleUpload}
            onAllDone={handleUploadDone}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
