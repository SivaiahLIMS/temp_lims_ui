import React from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack,
  CircularProgress, Alert, useTheme, alpha, LinearProgress,
} from '@mui/material';
import { Psychology, TrendingUp, Warning, Inventory } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

function AICard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card sx={{ border: `1px solid ${alpha(color, 0.25)}`, bgcolor: alpha(color, 0.02) }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AIPage() {
  const theme = useTheme();
  const { currentBranchId } = useUIStore();

  const { data: workloadData, isLoading: wlLoading, isError: wlError } = useQuery({
    queryKey: ['ai-workload', currentBranchId],
    queryFn: () => aiApi.getWorkload(currentBranchId),
    retry: false,
  });

  const { data: oosData, isLoading: oosLoading, isError: oosError } = useQuery({
    queryKey: ['ai-oos-risk', currentBranchId],
    queryFn: () => aiApi.getOosRisk(currentBranchId),
    retry: false,
  });

  const { data: forecastData, isLoading: fcLoading, isError: fcError } = useQuery({
    queryKey: ['ai-inventory-forecast', currentBranchId],
    queryFn: () => aiApi.getInventoryForecast(currentBranchId),
    retry: false,
  });

  const workload: any[] = Array.isArray((workloadData as any)?.data ?? workloadData) ? ((workloadData as any)?.data ?? workloadData) : [];
  const oosRisk: any[] = Array.isArray((oosData as any)?.data ?? oosData) ? ((oosData as any)?.data ?? oosData) : [];
  const forecast: any[] = Array.isArray((forecastData as any)?.data ?? forecastData) ? ((forecastData as any)?.data ?? forecastData) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Psychology sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>AI Insights</Typography>
          <Typography variant="body2" color="text.secondary">
            Machine learning predictions for workload, OOS risk, and inventory.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>
        {/* Workload */}
        <AICard icon={<TrendingUp />} title="Analyst Workload Forecast" color={theme.palette.primary.main}>
          {wlError && <Alert severity="warning" sx={{ mb: 1 }}>Could not load workload data.</Alert>}
          {wlLoading ? <CircularProgress size={24} /> : workload.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No workload data available.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {workload.map((w: any, i: number) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {w.analystName ?? w.username ?? `Analyst ${i + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {w.pendingTasks ?? w.workload ?? '?'} tasks
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((w.utilizationRate ?? w.workload ?? 0) * (w.utilizationRate != null ? 100 : 10), 100)}
                    color={w.utilizationRate > 0.8 ? 'error' : w.utilizationRate > 0.6 ? 'warning' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </AICard>

        {/* OOS Risk */}
        <AICard icon={<Warning />} title="OOS Risk Prediction" color={theme.palette.error.main}>
          {oosError && <Alert severity="warning" sx={{ mb: 1 }}>Could not load OOS risk data.</Alert>}
          {oosLoading ? <CircularProgress size={24} /> : oosRisk.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No OOS risk predictions available.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {oosRisk.map((r: any, i: number) => (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{
                    p: 1.5, borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.error.main, r.riskScore > 0.7 ? 0.06 : 0.02),
                    border: `1px solid ${alpha(theme.palette.error.main, r.riskScore > 0.7 ? 0.2 : 0.08)}`,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{r.productName ?? r.product ?? r.testName ?? `Test ${i + 1}`}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.reason ?? r.description ?? ''}</Typography>
                  </Box>
                  <Chip
                    label={r.riskScore != null ? `${(r.riskScore * 100).toFixed(0)}% risk` : r.riskLevel ?? 'Unknown'}
                    size="small"
                    color={r.riskScore > 0.7 || r.riskLevel === 'HIGH' ? 'error' : r.riskScore > 0.4 ? 'warning' : 'default'}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </AICard>

        {/* Inventory Forecast */}
        <AICard icon={<Inventory />} title="Inventory Replenishment Forecast" color={theme.palette.warning.main}>
          {fcError && <Alert severity="warning" sx={{ mb: 1 }}>Could not load inventory forecast.</Alert>}
          {fcLoading ? <CircularProgress size={24} /> : forecast.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No inventory forecast data available.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {forecast.map((f: any, i: number) => (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{
                    p: 1.5, borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.warning.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{f.chemicalName ?? f.itemName ?? `Item ${i + 1}`}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Current stock: {f.currentStock ?? f.quantity ?? '—'} {f.unit ?? ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={700} color="warning.main">
                      Reorder in {f.daysUntilDepletion ?? f.daysToReorder ?? '?'} days
                    </Typography>
                    {f.recommendedOrderQty != null && (
                      <Typography variant="caption" color="text.secondary">
                        Suggested order: {f.recommendedOrderQty} {f.unit ?? ''}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </AICard>
      </Stack>
    </Box>
  );
}
