import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Science,
  Assignment,
  Inventory2,
  Build,
  Warning,
  People,
  TrendingUp,
  Notifications,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  BiotechOutlined,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, tasksApi, notificationsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  green: { bg: '#e8f5e9', color: '#2e7d32' },
  blue: { bg: '#e3f2fd', color: '#1565c0' },
  amber: { bg: '#fff8e1', color: '#e65100' },
  red: { bg: '#ffebee', color: '#c62828' },
  teal: { bg: '#e0f2f1', color: '#00695c' },
  indigo: { bg: '#e8eaf6', color: '#283593' },
  cyan: { bg: '#e0f7fa', color: '#00838f' },
};

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  palette: keyof typeof STATUS_COLORS;
  trend?: string;
  alert?: boolean;
}

function KpiCard({ title, value, icon, palette, alert }: KpiCardProps) {
  const theme = useTheme();
  const { bg, color } = STATUS_COLORS[palette];
  return (
    <Card
      sx={{
        height: '100%',
        border: alert ? `1.5px solid ${color}` : '1px solid',
        borderColor: alert ? color : 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 6px 20px ${alpha(color, 0.2)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.3, flex: 1, pr: 1 }}>
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: bg, color, width: 38, height: 38, flexShrink: 0 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color }}>
          {value}
        </Typography>
        {alert && (
          <Chip
            label="Needs Attention"
            size="small"
            sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: bg, color, fontWeight: 600 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#c62828',
  HIGH: '#c62828',
  medium: '#e65100',
  MEDIUM: '#e65100',
  low: '#2e7d32',
  LOW: '#2e7d32',
};

function normalizePriority(raw: string): 'high' | 'medium' | 'low' {
  const lower = (raw ?? '').toLowerCase();
  if (lower === 'high' || lower === 'urgent') return 'high';
  if (lower === 'medium' || lower === 'normal') return 'medium';
  return 'low';
}

export default function DashboardPage() {
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', currentBranchId],
    queryFn: () => dashboardApi.getSummary(currentBranchId),
    retry: false,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getMy(),
    retry: false,
  });

  const { data: notificationsData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationsApi.list(user?.userId),
    retry: false,
  });

  const s = (summary as Record<string, number> | undefined) ?? {};

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Samples Received Today',
      value: s.samplesReceivedToday ?? s.pendingSamples ?? 0,
      icon: <BiotechOutlined fontSize="small" />,
      palette: 'blue',
    },
    {
      title: 'OOS Investigations',
      value: s.oosInvestigations ?? s.openDeviations ?? 0,
      icon: <ErrorIcon fontSize="small" />,
      palette: 'red',
      alert: (s.oosInvestigations ?? s.openDeviations ?? 0) > 0,
    },
    {
      title: 'CAPA Open',
      value: s.openCapa ?? 0,
      icon: <Assignment fontSize="small" />,
      palette: 'amber',
      alert: (s.openCapa ?? 0) > 0,
    },
    {
      title: 'Calibration Due',
      value: s.calibrationDue ?? 0,
      icon: <Build fontSize="small" />,
      palette: 'amber',
      alert: (s.calibrationDue ?? 0) > 0,
    },
    {
      title: 'Training Expiring',
      value: s.trainingExpiring ?? s.dueTrainings ?? 0,
      icon: <People fontSize="small" />,
      palette: 'cyan',
      alert: (s.trainingExpiring ?? s.dueTrainings ?? 0) > 0,
    },
    {
      title: 'Low Stock Chemicals',
      value: s.lowStockChemicals ?? 0,
      icon: <Science fontSize="small" />,
      palette: 'red',
      alert: (s.lowStockChemicals ?? 0) > 0,
    },
    {
      title: 'Pending Approvals',
      value: s.pendingApprovals ?? 0,
      icon: <Schedule fontSize="small" />,
      palette: 'indigo',
    },
    {
      title: 'Active Worksheets',
      value: s.activeWorksheets ?? 0,
      icon: <Inventory2 fontSize="small" />,
      palette: 'green',
    },
  ];

  const activities = Array.isArray(notificationsData)
    ? (notificationsData as any[]).slice(0, 8).map((n: any) => ({
        id: String(n.id),
        title: n.message ?? n.title ?? n.body ?? 'System notification',
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          : '—',
      }))
    : [];

  const tasks = Array.isArray(tasksData)
    ? (tasksData as any[]).slice(0, 8).map((t: any) => ({
        id: String(t.id ?? t.taskId),
        title: t.taskTitle ?? t.title ?? t.description ?? 'Task',
        dueDate: t.dueDate
          ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : t.dueDateAt
            ? new Date(t.dueDateAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—',
        priority: normalizePriority(t.priority ?? 'medium'),
      }))
    : [];

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 0.5 }}>
          LIMS Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {today} &nbsp;·&nbsp; Welcome back, {user?.username}
        </Typography>
      </Box>

      {/* Pharma KPI Cards */}
      <Grid container spacing={2} sx={{ marginBottom: 4 }}>
        {kpiCards.map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.5 }} key={idx}>
            <KpiCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity and Upcoming Tasks */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ marginBottom: 2 }}>
                <Notifications fontSize="small" sx={{ color: '#1565c0' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Activity
                </Typography>
              </Stack>
              <Divider sx={{ marginBottom: 2 }} />
              {notifLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : activities.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {activities.map((activity) => (
                    <Box key={activity.id} sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: '#e3f2fd',
                          color: '#1565c0',
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                        }}
                      >
                        <TrendingUp fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{activity.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ marginBottom: 2 }}>
                <Assignment fontSize="small" sx={{ color: '#1565c0' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  My Tasks
                </Typography>
              </Stack>
              <Divider sx={{ marginBottom: 2 }} />
              {tasksLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : tasks.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No tasks assigned
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {tasks.map((task) => (
                    <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{task.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Due: {task.dueDate}
                        </Typography>
                      </Box>
                      <Chip
                        label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: PRIORITY_COLOR[task.priority] ?? '#757575',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
