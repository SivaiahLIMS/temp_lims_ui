import React from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack, Button,
  CircularProgress, Alert, IconButton, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, Warning, CheckCircle, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

export default function AnalyticsPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading: alertsLoading, isError: alertsError, refetch: refetchAlerts } = useQuery({
    queryKey: ['predictive-alerts', currentBranchId],
    queryFn: () => analyticsApi.getPredictiveAlerts(currentBranchId),
    retry: false,
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['task-metrics', currentBranchId],
    queryFn: () => analyticsApi.getTaskMetrics(currentBranchId),
    retry: false,
  });

  const alerts: any[] = Array.isArray((alertsData as any)?.data ?? alertsData) ? ((alertsData as any)?.data ?? alertsData) : [];
  const metrics: any = (metricsData as any)?.data ?? metricsData ?? {};

  const ackMutation = useMutation({
    mutationFn: (id: number) => analyticsApi.acknowledgeAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['predictive-alerts', currentBranchId] }),
  });

  const openAlerts = alerts.filter((a) => !a.acknowledged && !a.acknowledgedAt);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Predictive alerts, task performance metrics, and trend analysis.
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => refetchAlerts()} sx={{ color: 'text.secondary' }}>
          <Refresh />
        </IconButton>
      </Stack>

      {/* Metrics Summary */}
      {!metricsLoading && metrics && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {[
            { label: 'Total Tasks', value: metrics.totalTasks ?? metrics.total ?? '—', color: theme.palette.primary.main },
            { label: 'Completed', value: metrics.completed ?? metrics.completedTasks ?? '—', color: theme.palette.success.main },
            { label: 'In Progress', value: metrics.inProgress ?? metrics.activeTasks ?? '—', color: theme.palette.info.main },
            { label: 'Overdue', value: metrics.overdue ?? metrics.overdueTaskCount ?? '—', color: theme.palette.error.main },
          ].map((m) => (
            <Card key={m.label} sx={{ flex: '1 1 140px', minWidth: 120 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: m.color }}>{m.value}</Typography>
                <Typography variant="caption" color="text.secondary">{m.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Completion rate */}
      {!metricsLoading && metrics?.completionRate != null && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>Task Completion Rate</Typography>
              <Typography variant="body2" fontWeight={700} color="primary">
                {(metrics.completionRate * 100).toFixed(1)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(metrics.completionRate * 100, 100)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Predictive Alerts */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <TrendingUp sx={{ color: theme.palette.warning.main }} />
          <Typography variant="h6" fontWeight={700}>Predictive Alerts</Typography>
          {openAlerts.length > 0 && (
            <Chip label={`${openAlerts.length} open`} size="small" color="warning" />
          )}
        </Stack>

        {alertsError && <Alert severity="warning" sx={{ mb: 2 }}>Could not load predictive alerts.</Alert>}

        {alertsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : alerts.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">No predictive alerts at this time.</Typography>
          </Card>
        ) : (
          <TableContainer component={Box} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Alert Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert: any) => {
                  const acked = alert.acknowledged || alert.acknowledgedAt;
                  return (
                    <TableRow
                      key={alert.id}
                      sx={{ bgcolor: !acked ? alpha(theme.palette.warning.main, 0.02) : 'transparent' }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Warning fontSize="small" sx={{ color: !acked ? theme.palette.warning.main : theme.palette.divider }} />
                          <Typography variant="body2" fontWeight={600}>{alert.type ?? alert.alertType ?? 'Alert'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{alert.description ?? alert.message ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.severity ?? 'MEDIUM'}
                          size="small"
                          color={alert.severity === 'HIGH' ? 'error' : alert.severity === 'LOW' ? 'default' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={acked ? 'Acknowledged' : 'Open'} size="small" color={acked ? 'default' : 'warning'} />
                      </TableCell>
                      <TableCell align="center">
                        {!acked && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => ackMutation.mutate(alert.id)}
                            disabled={ackMutation.isPending}
                          >
                            Acknowledge
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
      </Box>
    </Box>
  );
}
