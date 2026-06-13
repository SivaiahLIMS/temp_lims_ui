import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, alpha, useTheme, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Add, TaskAlt, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
};

const PRIORITY_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'error',
};

export default function TasksPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tasks', currentBranchId, statusFilter],
    queryFn: () => tasksApi.list(currentBranchId, statusFilter || undefined),
    retry: false,
  });

  const tasks: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const createMutation = useMutation({
    mutationFn: () => tasksApi.create({
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    }, currentBranchId),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      queryClient.invalidateQueries({ queryKey: ['tasks', currentBranchId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => tasksApi.complete(id, { notes: 'Completed via dashboard' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', currentBranchId] }),
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Tasks</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage lab tasks, assignments, and action items.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Task
          </Button>
        </Stack>
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load tasks from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : tasks.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <TaskAlt sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No tasks found</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
            New Task
          </Button>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task: any) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary">
                        {task.description.substring(0, 60)}{task.description.length > 60 ? '…' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority ?? 'MEDIUM'}
                      size="small"
                      color={PRIORITY_COLORS[task.priority] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status ?? 'PENDING'}
                      size="small"
                      color={STATUS_COLORS[task.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {task.assignedTo?.username ?? task.assignedToName ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'error' : 'text.secondary'}
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {task.status !== 'COMPLETED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        startIcon={<TaskAlt fontSize="small" />}
                      >
                        Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>New Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} label="Priority" onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
