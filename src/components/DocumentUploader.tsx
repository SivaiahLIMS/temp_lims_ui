import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, LinearProgress, Chip, Stack, Paper,
  IconButton, Alert, Tooltip, alpha, useTheme, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, List,
  ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload, FolderOpen, Close, CheckCircle, Error as ErrorIcon,
  InsertDriveFile, Description, PictureAsPdf, Image,
  Delete, Upload, Refresh,
} from '@mui/icons-material';

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMsg?: string;
  result?: unknown;
}

export interface DocumentUploaderProps {
  /** Called for each file to upload. Must return a Promise. */
  onUpload: (file: File, onProgress?: (pct: number) => void) => Promise<unknown>;
  /** Accepted file types as MIME strings or extensions, e.g. ['.docx', '.pdf'] */
  accept?: string[];
  /** Max file size in bytes (default: 50 MB) */
  maxSizeMb?: number;
  /** Whether multiple files can be selected at once */
  multiple?: boolean;
  /** Label shown in the drop zone */
  label?: string;
  /** Subtitle text in the drop zone */
  subtitle?: string;
  /** If true, renders as a compact button that opens a dialog */
  compact?: boolean;
  /** Compact mode trigger button label */
  buttonLabel?: string;
  /** Called after all files have been uploaded successfully */
  onAllDone?: (results: unknown[]) => void;
}

const MIME_ICONS: Record<string, React.ReactNode> = {
  pdf: <PictureAsPdf fontSize="small" sx={{ color: '#e53935' }} />,
  docx: <Description fontSize="small" sx={{ color: '#1565C0' }} />,
  doc: <Description fontSize="small" sx={{ color: '#1565C0' }} />,
  png: <Image fontSize="small" sx={{ color: '#00897B' }} />,
  jpg: <Image fontSize="small" sx={{ color: '#00897B' }} />,
  jpeg: <Image fontSize="small" sx={{ color: '#00897B' }} />,
};

function getFileIcon(filename: string): React.ReactNode {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_ICONS[ext] ?? <InsertDriveFile fontSize="small" sx={{ color: '#757575' }} />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function DropZone({
  accept,
  multiple,
  label,
  subtitle,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  disabled,
}: {
  accept?: string[];
  multiple?: boolean;
  label?: string;
  subtitle?: string;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowse: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={disabled ? undefined : onBrowse}
      sx={{
        p: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragOver
          ? theme.palette.primary.main
          : disabled
            ? theme.palette.divider
            : theme.palette.grey[300],
        bgcolor: isDragOver
          ? alpha(theme.palette.primary.main, 0.05)
          : disabled
            ? alpha(theme.palette.grey[500], 0.04)
            : 'background.paper',
        transition: 'all 0.2s ease',
        '&:hover': disabled ? {} : {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        },
      }}
    >
      <Box
        sx={{
          width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: isDragOver
            ? alpha(theme.palette.primary.main, 0.12)
            : alpha(theme.palette.grey[500], 0.08),
          transition: 'all 0.2s',
        }}
      >
        <CloudUpload
          sx={{
            fontSize: 28,
            color: isDragOver ? theme.palette.primary.main : theme.palette.grey[400],
            transition: 'color 0.2s',
          }}
        />
      </Box>
      <Typography fontWeight={600} sx={{ color: disabled ? 'text.disabled' : 'text.primary', mb: 0.5 }}>
        {label ?? 'Drop files here or click to browse'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle ?? (accept ? `Supported: ${accept.join(', ')}` : 'Any file type accepted')}
        {' · '}
        {multiple ? 'Multiple files' : 'Single file'}
      </Typography>
    </Paper>
  );
}

function FileList({
  files,
  onRemove,
  onRetry,
}: {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const theme = useTheme();
  if (files.length === 0) return null;
  return (
    <List dense disablePadding sx={{ mt: 1.5 }}>
      {files.map((f) => (
        <ListItem
          key={f.id}
          sx={{
            px: 1.5, py: 1,
            borderRadius: 1.5,
            mb: 0.5,
            border: `1px solid ${
              f.status === 'done' ? alpha(theme.palette.success.main, 0.25) :
              f.status === 'error' ? alpha(theme.palette.error.main, 0.25) :
              theme.palette.divider
            }`,
            bgcolor:
              f.status === 'done' ? alpha(theme.palette.success.main, 0.03) :
              f.status === 'error' ? alpha(theme.palette.error.main, 0.03) :
              'background.paper',
          }}
          disableGutters
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {f.status === 'done' ? (
              <CheckCircle fontSize="small" sx={{ color: theme.palette.success.main }} />
            ) : f.status === 'error' ? (
              <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
            ) : f.status === 'uploading' ? (
              <CircularProgress size={18} thickness={5} />
            ) : (
              getFileIcon(f.file.name)
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 240 }}>
                {f.file.name}
              </Typography>
            }
            secondary={
              f.status === 'error' ? (
                <Typography variant="caption" color="error.main">{f.errorMsg ?? 'Upload failed'}</Typography>
              ) : f.status === 'uploading' ? (
                <Box sx={{ mt: 0.5 }}>
                  <LinearProgress variant="determinate" value={f.progress} sx={{ height: 4, borderRadius: 2 }} />
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(f.file.size)}
                  {f.status === 'done' && ' · Uploaded'}
                </Typography>
              )
            }
          />
          <ListItemSecondaryAction>
            {f.status === 'error' && (
              <Tooltip title="Retry">
                <IconButton size="small" onClick={() => onRetry(f.id)} sx={{ mr: 0.5 }}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {f.status !== 'uploading' && (
              <Tooltip title="Remove">
                <IconButton size="small" onClick={() => onRemove(f.id)} sx={{ color: 'text.secondary' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}

function UploaderBody({
  files,
  isDragOver,
  accept,
  multiple,
  label,
  subtitle,
  maxSizeMb,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onRemove,
  onRetry,
  onUploadAll,
  allDone,
  anyUploading,
}: {
  files: UploadFile[];
  isDragOver: boolean;
  accept?: string[];
  multiple?: boolean;
  label?: string;
  subtitle?: string;
  maxSizeMb?: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowse: () => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onUploadAll: () => void;
  allDone: boolean;
  anyUploading: boolean;
}) {
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept?.join(',')}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) onDrop({ dataTransfer: { files: e.target.files } } as any);
          e.target.value = '';
        }}
      />

      {files.length === 0 || !allDone ? (
        <DropZone
          accept={accept}
          multiple={multiple}
          label={label}
          subtitle={subtitle}
          isDragOver={isDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onBrowse={onBrowse}
          disabled={anyUploading}
        />
      ) : (
        <Box
          sx={{
            p: 3, textAlign: 'center', borderRadius: 2,
            border: '2px dashed',
            borderColor: 'success.main',
            bgcolor: alpha('#2E7D32', 0.04),
          }}
        >
          <CheckCircle sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
          <Typography fontWeight={600} color="success.main">
            {doneCount} file{doneCount > 1 ? 's' : ''} uploaded successfully
          </Typography>
        </Box>
      )}

      <FileList files={files} onRemove={onRemove} onRetry={onRetry} />

      {files.length > 0 && !allDone && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={1}>
            {pendingCount > 0 && <Chip label={`${pendingCount} pending`} size="small" variant="outlined" />}
            {errorCount > 0 && <Chip label={`${errorCount} error`} size="small" color="error" variant="outlined" />}
            {doneCount > 0 && <Chip label={`${doneCount} done`} size="small" color="success" variant="outlined" />}
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={anyUploading ? <CircularProgress size={14} color="inherit" /> : <Upload />}
            onClick={onUploadAll}
            disabled={anyUploading || pendingCount === 0}
          >
            {anyUploading ? 'Uploading…' : `Upload ${pendingCount > 1 ? `${pendingCount} files` : 'file'}`}
          </Button>
        </Stack>
      )}

      {errorCount > 0 && (
        <Alert severity="error" sx={{ mt: 1.5 }} icon={<ErrorIcon fontSize="small" />}>
          {errorCount} file{errorCount > 1 ? 's' : ''} failed to upload. Check errors above and retry.
        </Alert>
      )}
    </Box>
  );
}

/**
 * DocumentUploader — reusable drag-and-drop file uploader component.
 *
 * Usage modes:
 *   1. Inline embedded:
 *      <DocumentUploader onUpload={fn} accept={['.docx', '.pdf']} label="Upload documents" />
 *
 *   2. Compact button (opens dialog):
 *      <DocumentUploader compact buttonLabel="Upload Version" onUpload={fn} accept={['.docx']} />
 */
export default function DocumentUploader({
  onUpload,
  accept = ['.docx', '.doc', '.pdf'],
  maxSizeMb = 50,
  multiple = false,
  label,
  subtitle,
  compact = false,
  buttonLabel = 'Upload File',
  onAllDone,
}: DocumentUploaderProps) {
  const theme = useTheme();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const maxBytes = maxSizeMb * 1_048_576;
    const newEntries: UploadFile[] = arr.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: file.size > maxBytes ? 'error' : 'pending',
      progress: 0,
      errorMsg: file.size > maxBytes ? `File exceeds ${maxSizeMb} MB limit` : undefined,
    }));
    setFiles((prev) => (multiple ? [...prev, ...newEntries] : newEntries));
  }, [maxSizeMb, multiple]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleBrowse = () => fileInputRef.current?.click();

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const runUpload = useCallback(async (fileEntry: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) => f.id === fileEntry.id ? { ...f, status: 'uploading', progress: 5 } : f)
    );
    try {
      const result = await onUpload(fileEntry.file, (pct) => {
        setFiles((prev) =>
          prev.map((f) => f.id === fileEntry.id ? { ...f, progress: pct } : f)
        );
      });
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, status: 'done', progress: 100, result } : f
        )
      );
      return result;
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id
            ? { ...f, status: 'error', progress: 0, errorMsg: err?.message ?? 'Upload failed' }
            : f
        )
      );
      return null;
    }
  }, [onUpload]);

  const handleUploadAll = useCallback(async () => {
    const pending = files.filter((f) => f.status === 'pending');
    const results = await Promise.all(pending.map(runUpload));
    const successful = results.filter((r) => r !== null);
    if (successful.length === pending.length && onAllDone) {
      onAllDone(successful);
    }
  }, [files, runUpload, onAllDone]);

  const handleRetry = useCallback((id: string) => {
    const entry = files.find((f) => f.id === id);
    if (!entry) return;
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'pending', progress: 0, errorMsg: undefined } : f));
    runUpload({ ...entry, status: 'pending', progress: 0 });
  }, [files, runUpload]);

  const anyUploading = files.some((f) => f.status === 'uploading');
  const allDone = files.length > 0 && files.every((f) => f.status === 'done');

  const body = (
    <UploaderBody
      files={files}
      isDragOver={isDragOver}
      accept={accept}
      multiple={multiple}
      label={label}
      subtitle={subtitle}
      maxSizeMb={maxSizeMb}
      fileInputRef={fileInputRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onBrowse={handleBrowse}
      onRemove={handleRemove}
      onRetry={handleRetry}
      onUploadAll={handleUploadAll}
      allDone={allDone}
      anyUploading={anyUploading}
    />
  );

  if (compact) {
    return (
      <>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Upload />}
          onClick={() => setDialogOpen(true)}
        >
          {buttonLabel}
        </Button>

        <Dialog
          open={dialogOpen}
          onClose={() => !anyUploading && setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <CloudUpload color="primary" />
              <Typography fontWeight={700}>{buttonLabel}</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={anyUploading}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {body}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => { setDialogOpen(false); setFiles([]); }}
              variant="outlined"
              disabled={anyUploading}
            >
              {allDone ? 'Close' : 'Cancel'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return body;
}
