import React, { useState } from 'react';
import {
  Box, Card, Typography, Chip, Stack, TextField,
  CircularProgress, Alert, IconButton, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { HistoryEdu, Refresh } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api/endpoints';

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  APPROVE: 'success',
  REJECT: 'error',
  SUBMIT: 'warning',
  LOGIN: 'default',
};

export default function AuditPage() {
  const theme = useTheme();
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => auditApi.getAll(),
    retry: false,
  });

  const allEntries: any[] = Array.isArray((data as any)?.data ?? data) ? ((data as any)?.data ?? data) : [];

  const entityTypes = Array.from(new Set(allEntries.map((e) => e.entityType ?? e.entity).filter(Boolean)));

  const filtered = allEntries.filter((e) => {
    if (entityTypeFilter && (e.entityType ?? e.entity) !== entityTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (e.action ?? '').toLowerCase().includes(q) ||
        (e.entityType ?? e.entity ?? '').toLowerCase().includes(q) ||
        (e.username ?? e.performedBy ?? '').toLowerCase().includes(q) ||
        String(e.entityId ?? '').includes(q)
      );
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Audit Trail</Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable record of all system actions for compliance and traceability.
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
          <Refresh />
        </IconButton>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search actions, users, entities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        {entityTypes.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select value={entityTypeFilter} label="Entity Type" onChange={(e) => setEntityTypeFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {entityTypes.map((et) => (
                <MenuItem key={et} value={et}>{et}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {isError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load audit records from server.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <HistoryEdu sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No audit records found</Typography>
        </Card>
      ) : (
        <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entity Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entity ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(0, 200).map((entry: any, i: number) => (
                <TableRow key={entry.id ?? i} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {entry.timestamp ?? entry.createdAt
                        ? new Date(entry.timestamp ?? entry.createdAt).toLocaleString()
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.username ?? entry.performedBy ?? entry.user?.username ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.action ?? 'ACTION'}
                      size="small"
                      color={ACTION_COLORS[entry.action] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{entry.entityType ?? entry.entity ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{entry.entityId ?? '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {entry.details ?? entry.description ?? entry.changes ?? '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {filtered.length > 200 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
          Showing 200 of {filtered.length} records. Use filters to narrow results.
        </Typography>
      )}
    </Box>
  );
}
