import React, { useState, createContext, useContext } from 'react';
import {
  Box, Typography, Stack, Tabs, Tab, Chip, Divider,
  FormControl, InputLabel, Select, MenuItem, ButtonGroup, Button,
  Grid, alpha, useTheme,
} from '@mui/material';
import {
  Science, Assignment, Build, Inventory2, Security,
  TrendingUp, SmartToy, People, Thermostat, BiotechOutlined,
  FilterList, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChartCard, MultiLineChart, MultiAreaChart, StackedBarChart,
  SimpleBarChart, DonutChart, UtilizationChart, HeatmapChart,
} from '../../components/charts/ChartComponents';
import { analyticsChartsApi, MOCK, type AnalyticsModule, type TimeRange } from '../../api/analyticsEndpoints';
import { useUIStore } from '../../store/uiStore';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const NAV_BG = '#0A1A3F';
const TEAL = '#00C2A8';
const GRAPH_H = 300; // renders inside ChartCard, card adds ~20px padding
const UTIL_H = 240;

// ─── STABLE MOCK DATA ─────────────────────────────────────────────────────────
const D = {
  sampleInflow: MOCK.sampleInflow(),
  tat: MOCK.tat(),
  passFail: MOCK.passFail(),
  oosFrequency: MOCK.oosFrequency(),
  analystWorkload: MOCK.analystWorkload(),
  worksheetStatusTrend: MOCK.worksheetStatusTrend(),
  worksheetExecutionTime: MOCK.worksheetExecutionTime(),
  worksheetRejectionRate: MOCK.worksheetRejectionRate(),
  instrumentUtilization: MOCK.instrumentUtilization(),
  instrumentUptime: MOCK.instrumentUptime(),
  calibrationStatus: MOCK.calibrationStatus(),
  instrumentUsageByProduct: MOCK.instrumentUsageByProduct(),
  chemicalConsumption: MOCK.chemicalConsumption(),
  chemicalExpiry: MOCK.chemicalExpiry(),
  issuanceVsDestruction: MOCK.issuanceVsDestruction(),
  costPerProduct: MOCK.costPerProduct(),
  deviationTrend: MOCK.deviationTrend(),
  deviationSeverity: MOCK.deviationSeverity(),
  capaClosureTime: MOCK.capaClosureTime(),
  rootCauses: MOCK.rootCauseDistribution(),
  tempTrend: MOCK.tempTrend(),
  humidityTrend: MOCK.humidityTrend(),
  cfuTrend: MOCK.cfuTrend(),
  excursionSeverity: MOCK.excursionSeverity(),
  userUtilization: MOCK.userUtilization(),
  analystLoadByModule: MOCK.analystLoadByModule(),
  reviewerActivity: MOCK.reviewerActivity(),
  oosRiskTrend: MOCK.oosRiskTrend(),
  consumptionForecast: MOCK.consumptionForecast(),
  instrumentFailurePrediction: MOCK.instrumentFailurePrediction(),
  stabilityTimepoints: MOCK.stabilityTimepoints(),
  stabilityDegradation: MOCK.stabilityDegradation(),
  stabilityImpurity: MOCK.stabilityImpurity(),
  stabilityPullCalendar: MOCK.stabilityPullCalendar(),
};

// ─── ANALYTICS CONTEXT ────────────────────────────────────────────────────────
const AnalyticsCtx = createContext<{ branchId: number; params: Record<string, unknown> }>({ branchId: 1, params: {} });
function useAnalyticsParams() { return useContext(AnalyticsCtx); }
function resolved<T>(apiData: unknown, mock: T): T {
  if (apiData == null) return mock;
  if (Array.isArray(apiData) && apiData.length > 0) return apiData as T;
  if (typeof apiData === 'object') {
    const obj = apiData as Record<string, unknown>;
    // Reject backend envelope wrappers — they have status/message but no chart fields
    const isEnvelope = ('message' in obj || 'status' in obj) && !('labels' in obj) && !('datasets' in obj) && !Array.isArray(obj);
    if (isEnvelope) return mock;
    // Accept if it has at least one chart-specific key
    const hasChartShape = 'labels' in obj || 'datasets' in obj || 'draft' in obj || 'minor' in obj
      || 'submitted' in obj || 'approved' in obj || 'data' in obj;
    if (hasChartShape) return apiData as T;
  }
  return mock;
}

// ─── MODULE CATALOG ───────────────────────────────────────────────────────────
interface ModuleDef {
  id: AnalyticsModule;
  label: string;
  icon: React.ReactNode;
  listPath?: string;
}

const MODULES: ModuleDef[] = [
  { id: 'samples',      label: 'Samples',          icon: <Science fontSize="small" />,       listPath: '/samples' },
  { id: 'worksheets',   label: 'Workstation',       icon: <Assignment fontSize="small" />,    listPath: '/worksheets' },
  { id: 'instruments',  label: 'Instruments',       icon: <Build fontSize="small" />,         listPath: '/instruments' },
  { id: 'inventory',    label: 'Inventory',         icon: <Inventory2 fontSize="small" />,    listPath: '/chemicals' },
  { id: 'qa',           label: 'QA/QC Insight',     icon: <Security fontSize="small" />,      listPath: '/qa/deviations' },
  { id: 'stability',    label: 'Stability',         icon: <BiotechOutlined fontSize="small" /> },
  { id: 'environmental',label: 'Environmental',     icon: <Thermostat fontSize="small" /> },
  { id: 'users',        label: 'User Utilization',  icon: <People fontSize="small" /> },
  { id: 'ai',           label: 'AI Insights',       icon: <SmartToy fontSize="small" />,      listPath: '/ai' },
];

// ─── KPI CARD (wireframe spec: h=120, value 32px/700, label 14px/500) ─────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: number;
}

function KpiCard({ label, value, sub, color = TEAL, trend }: KpiProps) {
  const isUp = trend !== undefined && trend >= 0;
  const isDown = trend !== undefined && trend < 0;
  return (
    <Box
      sx={{
        flex: '1 1 160px',
        minWidth: 140,
        minHeight: 120,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
      }}
    >
      <Box
        sx={{
          position: 'absolute', top: 0, left: 0,
          width: 4, height: '100%',
          bgcolor: color, borderRadius: '4px 0 0 4px',
        }}
      />
      <Typography
        sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', mb: 0.75, pl: 0.5 }}
      >
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ pl: 0.5 }}>
        <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            {isUp ? <ArrowUpward sx={{ fontSize: 13, color: '#4CAF50' }} /> : <ArrowDownward sx={{ fontSize: 13, color: '#FF5252' }} />}
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: isDown ? '#FF5252' : '#4CAF50' }}>
              {Math.abs(trend)}%
            </Typography>
          </Stack>
        )}
      </Stack>
      {sub && (
        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, pl: 0.5 }}>{sub}</Typography>
      )}
    </Box>
  );
}

// ─── TOP MODULE NAV ───────────────────────────────────────────────────────────
interface TopNavProps { active: AnalyticsModule; onChange: (m: AnalyticsModule) => void; }

function TopModuleNav({ active, onChange }: TopNavProps) {
  return (
    <Box sx={{ bgcolor: NAV_BG, borderRadius: '12px 12px 0 0', mb: 0 }}>
      <Tabs
        value={active}
        onChange={(_, v) => onChange(v as AnalyticsModule)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 52,
          px: 1,
          '& .MuiTabs-indicator': { bgcolor: TEAL, height: 3, borderRadius: '3px 3px 0 0' },
          '& .MuiTab-root': {
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 600,
            fontSize: 13,
            minHeight: 52,
            textTransform: 'none',
            transition: 'color 0.15s',
            '&.Mui-selected': { color: '#fff' },
            '&:hover': { color: 'rgba(255,255,255,0.9)' },
          },
          '& .MuiTabScrollButton-root': { color: 'rgba(255,255,255,0.5)' },
        }}
      >
        {MODULES.map((m) => (
          <Tab key={m.id} value={m.id} icon={m.icon} iconPosition="start" label={m.label} />
        ))}
      </Tabs>
    </Box>
  );
}

// ─── SUB NAV BAR ─────────────────────────────────────────────────────────────
interface SubNavProps { module: ModuleDef; subTab: string; onSubTab: (v: string) => void; }

const SUB_NAV_ITEMS = ['Dashboard', 'List', 'Actions', 'Reports', 'Settings'];

function SubNavBar({ module, subTab, onSubTab }: SubNavProps) {
  const navigate = useNavigate();
  return (
    <Box sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
      <Stack direction="row" alignItems="center" spacing={0}>
        {SUB_NAV_ITEMS.map((item) => (
          <Button
            key={item}
            variant="text"
            size="small"
            onClick={() => {
              onSubTab(item);
              if (item === 'List' && module.listPath) navigate(module.listPath);
            }}
            sx={{
              fontSize: 13,
              fontWeight: subTab === item ? 700 : 500,
              color: subTab === item ? NAV_BG : 'text.secondary',
              borderRadius: 0,
              borderBottom: subTab === item ? `2px solid ${TEAL}` : '2px solid transparent',
              px: 2,
              py: 1.25,
              minWidth: 0,
              textTransform: 'none',
              '&:hover': { bgcolor: 'transparent', color: NAV_BG },
            }}
          >
            {item}
          </Button>
        ))}
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.75 }}>
          <Chip
            icon={module.icon as React.ReactElement}
            label={module.label}
            size="small"
            sx={{ bgcolor: alpha(TEAL, 0.1), color: NAV_BG, fontWeight: 700, fontSize: 11, height: 22 }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── GLOBAL FILTER BAR ────────────────────────────────────────────────────────
interface FilterBarProps {
  timeRange: TimeRange; onTimeRange: (v: TimeRange) => void;
  product: string; onProduct: (v: string) => void;
  instrument: string; onInstrument: (v: string) => void;
  analyst: string; onAnalyst: (v: string) => void;
  branch: string; onBranch: (v: string) => void;
}

function FilterBar({ timeRange, onTimeRange, product, onProduct, instrument, onInstrument, analyst, onAnalyst, branch, onBranch }: FilterBarProps) {
  const hasFilters = product || analyst || instrument;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mr: 0.5 }}>
        <FilterList sx={{ fontSize: 16, color: 'text.disabled' }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Filters
        </Typography>
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />

      {/* Time range quick buttons */}
      <ButtonGroup size="small" variant="outlined" sx={{ height: 32 }}>
        {(['7d', '30d', '90d'] as TimeRange[]).map((t) => (
          <Button
            key={t}
            onClick={() => onTimeRange(t)}
            variant={timeRange === t ? 'contained' : 'outlined'}
            sx={{
              minWidth: 52, fontSize: 12, fontWeight: 600, px: 1.5,
              ...(timeRange === t ? { bgcolor: NAV_BG, borderColor: NAV_BG, '&:hover': { bgcolor: '#0d2257' } } : {}),
            }}
          >
            {t === '7d' ? '7D' : t === '30d' ? '30D' : '90D'}
          </Button>
        ))}
      </ButtonGroup>

      <FormControl size="small" sx={{ minWidth: 140, height: 32, '& .MuiOutlinedInput-root': { height: 32 } }}>
        <InputLabel sx={{ fontSize: 13 }}>Product</InputLabel>
        <Select value={product} label="Product" onChange={(e) => onProduct(e.target.value)} sx={{ fontSize: 13 }}>
          <MenuItem value="">All Products</MenuItem>
          {MOCK.products.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140, height: 32, '& .MuiOutlinedInput-root': { height: 32 } }}>
        <InputLabel sx={{ fontSize: 13 }}>Instrument</InputLabel>
        <Select value={instrument} label="Instrument" onChange={(e) => onInstrument(e.target.value)} sx={{ fontSize: 13 }}>
          <MenuItem value="">All Instruments</MenuItem>
          {MOCK.instruments.map((i) => <MenuItem key={i} value={i} sx={{ fontSize: 13 }}>{i}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 130, height: 32, '& .MuiOutlinedInput-root': { height: 32 } }}>
        <InputLabel sx={{ fontSize: 13 }}>Analyst</InputLabel>
        <Select value={analyst} label="Analyst" onChange={(e) => onAnalyst(e.target.value)} sx={{ fontSize: 13 }}>
          <MenuItem value="">All Analysts</MenuItem>
          {MOCK.analysts.map((a) => <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 130, height: 32, '& .MuiOutlinedInput-root': { height: 32 } }}>
        <InputLabel sx={{ fontSize: 13 }}>Branch</InputLabel>
        <Select value={branch} label="Branch" onChange={(e) => onBranch(e.target.value)} sx={{ fontSize: 13 }}>
          <MenuItem value="nj">Edison, NJ</MenuItem>
          <MenuItem value="ca">San Diego, CA</MenuItem>
          <MenuItem value="tx">Houston, TX</MenuItem>
        </Select>
      </FormControl>

      {hasFilters && (
        <Button
          size="small"
          variant="text"
          color="error"
          sx={{ fontSize: 12, height: 32, ml: 'auto' }}
          onClick={() => { onProduct(''); onAnalyst(''); onInstrument(''); }}
        >
          Clear filters
        </Button>
      )}
    </Box>
  );
}

// ─── USER UTILIZATION PANEL (always visible at bottom) ────────────────────────
function UserUtilizationPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: utilApi } = useQuery({ queryKey: ['an-user-util', branchId, params], queryFn: () => analyticsChartsApi.userUtilization(branchId, params), retry: false });
  const { data: loadApi } = useQuery({ queryKey: ['an-user-load', branchId, params], queryFn: () => analyticsChartsApi.analystLoadByModule(branchId, params), retry: false });
  const userUtilization = resolved(utilApi, D.userUtilization);
  const analystLoadByModule = resolved(loadApi, D.analystLoadByModule);
  const theme = useTheme();
  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <People sx={{ color: TEAL, fontSize: 18 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: NAV_BG }}>User Utilization</Typography>
        <Chip label="Cross-module" size="small" sx={{ bgcolor: alpha(TEAL, 0.12), color: NAV_BG, fontWeight: 600, fontSize: 11, height: 20 }} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <ChartCard
            title="Utilization Overview"
            subtitle={`% utilization — target ${userUtilization.target}%`}
            height={UTIL_H}
          >
            <UtilizationChart
              labels={userUtilization.labels}
              data={userUtilization.data}
              target={userUtilization.target}
              height={UTIL_H}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard
            title="Analyst Load by Module"
            subtitle="Samples / Worksheets / Instruments / QA handled per analyst"
            height={UTIL_H}
          >
            <StackedBarChart
              labels={analystLoadByModule.labels}
              datasets={[
                { name: 'Samples',     data: analystLoadByModule.samples },
                { name: 'Worksheets',  data: analystLoadByModule.worksheets },
                { name: 'Instruments', data: analystLoadByModule.instruments },
                { name: 'QA',          data: analystLoadByModule.qa },
              ]}
              height={UTIL_H}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function DashboardFooter() {
  const navigate = useNavigate();
  const FOOTER_LINKS = [
    { label: 'Privacy', path: '/legal/privacy' },
    { label: 'Terms', path: '/legal/terms' },
    { label: 'Support', path: '/legal/support' },
    { label: 'API Docs', path: '/legal/api-docs' },
  ];
  return (
    <Box
      sx={{
        mt: 4,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
        © 2026 Sivaya LIMS Platform. All rights reserved.
      </Typography>
      <Stack direction="row" spacing={2}>
        {FOOTER_LINKS.map((link) => (
          <Typography
            key={link.label}
            onClick={() => navigate(link.path)}
            sx={{ fontSize: 12, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: NAV_BG, textDecoration: 'underline' } }}
          >
            {link.label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

// ─── MODULE PANELS ─────────────────────────────────────────────────────────────
function SamplesPanel() {
  const { branchId, params } = useAnalyticsParams();
  const t = useTheme();
  const { data: inflowApi } = useQuery({ queryKey: ['an-inflow', branchId, params], queryFn: () => analyticsChartsApi.sampleInflow(branchId, params), retry: false });
  const { data: tatApi } = useQuery({ queryKey: ['an-tat', branchId, params], queryFn: () => analyticsChartsApi.sampleTat(branchId, params), retry: false });
  const { data: passFailApi } = useQuery({ queryKey: ['an-pass-fail', branchId, params], queryFn: () => analyticsChartsApi.samplePassFail(branchId, params), retry: false });
  const { data: oosFreqApi } = useQuery({ queryKey: ['an-oos-freq', branchId, params], queryFn: () => analyticsChartsApi.sampleOosFrequency(branchId, params), retry: false });
  const { data: workloadApi } = useQuery({ queryKey: ['an-analyst-workload', branchId, params], queryFn: () => analyticsChartsApi.analystWorkload(branchId, params), retry: false });
  const sampleInflow = resolved(inflowApi, D.sampleInflow);
  const tat = resolved(tatApi, D.tat);
  const passFail = resolved(passFailApi, D.passFail);
  const oosFrequency = resolved(oosFreqApi, D.oosFrequency);
  const analystWorkload = resolved(workloadApi, D.analystWorkload);
  const inflowDs0 = Array.isArray(sampleInflow.datasets?.[0]?.data) ? sampleInflow.datasets[0].data : [];
  const inflowDs1 = Array.isArray(sampleInflow.datasets?.[1]?.data) ? sampleInflow.datasets[1].data : [];
  const tatData = Array.isArray(tat.data) ? tat.data : [];
  const oosArr = Array.isArray(oosFrequency.oos) ? oosFrequency.oos : [];
  const ootArr = Array.isArray(oosFrequency.oot) ? oosFrequency.oot : [];
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Samples Registered" value={inflowDs0.reduce((a: number, b: number) => a + b, 0)} sub="Last 30 days" color={NAV_BG} trend={8} />
        <KpiCard label="Samples Completed" value={inflowDs1.reduce((a: number, b: number) => a + b, 0)} sub="Last 30 days" color={TEAL} trend={5} />
        <KpiCard label="Pending Tests" value={47} sub="Awaiting assignment" color="#FFB74D" trend={-3} />
        <KpiCard label="Avg TAT" value={`${tatData[tatData.length - 1] ?? 0}h`} sub={`Target ${tat.spec ?? 5}h`} color="#0277BD" trend={-6} />
        <KpiCard label="OOS / OOT Count" value={oosArr.reduce((a: number, b: number) => a + b, 0) + ootArr.reduce((a: number, b: number) => a + b, 0)} sub="Current period" color="#FF5252" trend={12} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Sample Inflow Trend" subtitle="Registered vs completed samples — 30 days" height={GRAPH_H}>
            <MultiAreaChart labels={sampleInflow.labels ?? []} datasets={Array.isArray(sampleInflow.datasets) ? sampleInflow.datasets : []} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Pass / Fail / OOS Distribution" subtitle="By product" height={GRAPH_H}>
            <StackedBarChart labels={passFail.labels ?? []} datasets={[{ name: 'Pass', data: passFail.pass ?? [] }, { name: 'Fail', data: passFail.fail ?? [] }, { name: 'OOS', data: passFail.oos ?? [] }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="OOS / OOT Frequency" subtitle="By product" height={GRAPH_H}>
            <StackedBarChart labels={oosFrequency.labels ?? []} datasets={[{ name: 'OOS', data: oosArr }, { name: 'OOT', data: ootArr }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Analyst Workload" subtitle="Samples per analyst" height={GRAPH_H}>
            <SimpleBarChart labels={analystWorkload.labels ?? []} data={analystWorkload.samples ?? []} horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function WorksheetsPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: wsTrendApi } = useQuery({ queryKey: ['an-ws-trend', branchId, params], queryFn: () => analyticsChartsApi.worksheetStatusTrend(branchId, params), retry: false });
  const { data: wsTimeApi } = useQuery({ queryKey: ['an-ws-time', branchId, params], queryFn: () => analyticsChartsApi.worksheetExecutionTime(branchId, params), retry: false });
  const { data: wsRejApi } = useQuery({ queryKey: ['an-ws-rej', branchId, params], queryFn: () => analyticsChartsApi.worksheetRejectionRate(branchId, params), retry: false });
  const { data: workloadApi } = useQuery({ queryKey: ['an-analyst-workload', branchId, params], queryFn: () => analyticsChartsApi.analystWorkload(branchId, params), retry: false });
  const worksheetStatusTrend = resolved(wsTrendApi, D.worksheetStatusTrend);
  const worksheetExecutionTime = resolved(wsTimeApi, D.worksheetExecutionTime);
  const worksheetRejectionRate = resolved(wsRejApi, D.worksheetRejectionRate);
  const analystWorkload = resolved(workloadApi, D.analystWorkload);
  const wsDraft = Array.isArray(worksheetStatusTrend.draft) ? worksheetStatusTrend.draft : [];
  const wsSubmitted = Array.isArray(worksheetStatusTrend.submitted) ? worksheetStatusTrend.submitted : [];
  const wsApproved = Array.isArray(worksheetStatusTrend.approved) ? worksheetStatusTrend.approved : [];
  const wsRejected = Array.isArray(worksheetStatusTrend.rejected) ? worksheetStatusTrend.rejected : [];
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="In Draft" value={wsDraft[wsDraft.length - 1] ?? 0} color="#9E9E9E" />
        <KpiCard label="Submitted" value={wsSubmitted.reduce((a: number, b: number) => a + b, 0)} sub="Last 14 days" color="#0277BD" />
        <KpiCard label="Approved" value={wsApproved.reduce((a: number, b: number) => a + b, 0)} color={TEAL} trend={4} />
        <KpiCard label="Rejected" value={wsRejected.reduce((a: number, b: number) => a + b, 0)} color="#FF5252" trend={-2} />
        <KpiCard label="Avg Execution Time" value="3.8h" sub="Per worksheet" color="#FFB74D" />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Worksheet Status Trend" subtitle="Draft / Submitted / Approved / Rejected — 14 days" height={GRAPH_H}>
            <StackedBarChart labels={worksheetStatusTrend.labels ?? []} datasets={[{ name: 'Approved', data: wsApproved }, { name: 'Submitted', data: wsSubmitted }, { name: 'Draft', data: wsDraft }, { name: 'Rejected', data: wsRejected }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Reviewer Rejection Rate" subtitle="% rejections per reviewer (>5% threshold)" height={GRAPH_H}>
            <SimpleBarChart labels={worksheetRejectionRate.labels} data={worksheetRejectionRate.rate} unit="%" refLine={5} horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Execution Time Distribution" subtitle="Worksheet duration buckets" height={GRAPH_H}>
            <SimpleBarChart labels={worksheetExecutionTime.labels} data={worksheetExecutionTime.data} color="#0277BD" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Worksheet Load per Analyst" subtitle="Tests executed per analyst" height={GRAPH_H}>
            <SimpleBarChart labels={analystWorkload.labels} data={analystWorkload.tests} color={TEAL} horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function InstrumentsPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: utilApi } = useQuery({ queryKey: ['an-inst-util', branchId, params], queryFn: () => analyticsChartsApi.instrumentUtilization(branchId, params), retry: false });
  const { data: uptimeApi } = useQuery({ queryKey: ['an-inst-uptime', branchId, params], queryFn: () => analyticsChartsApi.instrumentUptime(branchId, params), retry: false });
  const { data: calApi } = useQuery({ queryKey: ['an-inst-cal', branchId, params], queryFn: () => analyticsChartsApi.instrumentCalibrationStatus(branchId, params), retry: false });
  const { data: workloadApi } = useQuery({ queryKey: ['an-analyst-workload', branchId, params], queryFn: () => analyticsChartsApi.analystWorkload(branchId, params), retry: false });
  const instrumentUtilization = resolved(utilApi, D.instrumentUtilization);
  const instrumentUptime = resolved(uptimeApi, D.instrumentUptime);
  const calibrationStatus = resolved(calApi, D.calibrationStatus);
  const analystWorkload = resolved(workloadApi, D.analystWorkload);
  const overdueCount = calibrationStatus.overdue.filter(Boolean).length;
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Active Instruments" value={instrumentUptime.labels.length} color={NAV_BG} />
        <KpiCard label="Avg Uptime" value={`${Math.round(instrumentUptime.uptime.reduce((a: number, b: number) => a + b, 0) / instrumentUptime.uptime.length)}%`} color={TEAL} trend={2} />
        <KpiCard label="Calibrations Due" value={calibrationStatus.due.filter(Boolean).length} color="#FFB74D" />
        <KpiCard label="Overdue Calibrations" value={overdueCount} color={overdueCount > 0 ? '#FF5252' : TEAL} />
        <KpiCard label="Avg Utilization" value="62%" sub="Hours used / available" color="#0277BD" trend={7} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Instrument Utilization Trend" subtitle="Daily usage hours — top 3 instruments" height={GRAPH_H}>
            <MultiLineChart labels={instrumentUtilization.labels} datasets={instrumentUtilization.datasets} unit="h" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Uptime vs Downtime vs Maintenance" subtitle="% split per instrument" height={GRAPH_H}>
            <StackedBarChart labels={instrumentUptime.labels} datasets={[{ name: 'Uptime %', data: instrumentUptime.uptime }, { name: 'Downtime %', data: instrumentUptime.downtime }, { name: 'Maintenance %', data: instrumentUptime.maintenance }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Calibration Due Heatmap" subtitle="Status per instrument (OK / Due / Overdue)" height={GRAPH_H}>
            <HeatmapChart rows={calibrationStatus.labels} cols={['OK', 'Due', 'Overdue']} data={calibrationStatus.labels.map((_: string, i: number) => [calibrationStatus.ok[i], calibrationStatus.due[i], calibrationStatus.overdue[i]])} colorHigh="#FF5252" />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Usage per Analyst" subtitle="Estimated instrument hours" height={GRAPH_H}>
            <SimpleBarChart labels={analystWorkload.labels} data={[6.2, 4.8, 9.1, 3.5, 7.4, 5.6]} unit="h" color="#4CAF50" horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function InventoryPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: consumeApi } = useQuery({ queryKey: ['an-inv-consume', branchId, params], queryFn: () => analyticsChartsApi.chemicalConsumption(branchId, params), retry: false });
  const { data: expiryApi } = useQuery({ queryKey: ['an-inv-expiry', branchId, params], queryFn: () => analyticsChartsApi.chemicalExpiry(branchId, params), retry: false });
  const { data: issuanceApi } = useQuery({ queryKey: ['an-inv-issuance', branchId, params], queryFn: () => analyticsChartsApi.issuanceVsDestruction(branchId, params), retry: false });
  const { data: costApi } = useQuery({ queryKey: ['an-inv-cost', branchId, params], queryFn: () => analyticsChartsApi.costPerProduct(branchId, params), retry: false });
  const chemicalConsumption = resolved(consumeApi, D.chemicalConsumption);
  const chemicalExpiry = resolved(expiryApi, D.chemicalExpiry);
  const issuanceVsDestruction = resolved(issuanceApi, D.issuanceVsDestruction);
  const costPerProduct = resolved(costApi, D.costPerProduct);
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Chemicals in Stock" value={48} color={NAV_BG} />
        <KpiCard label="Expiring < 30 Days" value={5} color="#FF5252" trend={2} />
        <KpiCard label="Issuance Today" value={12} sub="Units issued" color="#0277BD" />
        <KpiCard label="Destruction Events" value={3} sub="This week" color="#FFB74D" />
        <KpiCard label="Inventory Value" value="$24.8K" color={TEAL} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Chemical Consumption Trend" subtitle="Weekly quantity used — top chemicals" height={GRAPH_H}>
            <MultiAreaChart labels={chemicalConsumption.labels} datasets={chemicalConsumption.datasets} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Expiry Risk Heatmap" subtitle="Chemicals × months to expiry" height={GRAPH_H}>
            <HeatmapChart rows={chemicalExpiry.chemicals} cols={chemicalExpiry.months} data={chemicalExpiry.risk} colorHigh="#FF5252" />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Issuance vs Destruction" subtitle="Weekly comparison" height={GRAPH_H}>
            <StackedBarChart labels={issuanceVsDestruction.labels} datasets={[{ name: 'Issued', data: issuanceVsDestruction.issued }, { name: 'Returned', data: issuanceVsDestruction.returned }, { name: 'Destroyed', data: issuanceVsDestruction.destroyed }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Cost per Product" subtitle="Chemical + instrument cost allocation ($)" height={GRAPH_H}>
            <StackedBarChart labels={costPerProduct.labels} datasets={[{ name: 'Chemical Cost', data: costPerProduct.chemical }, { name: 'Instrument Cost', data: costPerProduct.instrument }]} unit="$" height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function QAPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: devTrendApi } = useQuery({ queryKey: ['an-qa-dev-trend', branchId, params], queryFn: () => analyticsChartsApi.deviationTrend(branchId, params), retry: false });
  const { data: devSevApi } = useQuery({ queryKey: ['an-qa-dev-sev', branchId, params], queryFn: () => analyticsChartsApi.deviationSeverity(branchId, params), retry: false });
  const { data: capaApi } = useQuery({ queryKey: ['an-qa-capa', branchId, params], queryFn: () => analyticsChartsApi.capaClosureTime(branchId, params), retry: false });
  const { data: rootApi } = useQuery({ queryKey: ['an-qa-root', branchId, params], queryFn: () => analyticsChartsApi.rootCauseDistribution(branchId, params), retry: false });
  const deviationTrend = resolved(devTrendApi, D.deviationTrend);
  const deviationSeverity = resolved(devSevApi, D.deviationSeverity);
  const capaClosureTime = resolved(capaApi, D.capaClosureTime);
  const rootCauses = resolved(rootApi, D.rootCauses);
  const capaAvgDays = Array.isArray(capaClosureTime.avgDays) ? capaClosureTime.avgDays : [];
  const devMinor = Array.isArray(deviationTrend.minor) ? deviationTrend.minor : [];
  const devMajor = Array.isArray(deviationTrend.major) ? deviationTrend.major : [];
  const devCritical = Array.isArray(deviationTrend.critical) ? deviationTrend.critical : [];
  const devSeverityArr = Array.isArray(deviationSeverity) ? deviationSeverity : D.deviationSeverity;
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Open Deviations" value={14} color="#FF5252" trend={3} />
        <KpiCard label="OOS Cases" value={8} color="#FFB74D" />
        <KpiCard label="CAPA Pending" value={6} color="#0277BD" />
        <KpiCard label="Avg Closure Time" value={`${capaAvgDays[capaAvgDays.length - 1] ?? 0}d`} sub={`Target ${capaClosureTime.target ?? 21}d`} color={NAV_BG} trend={-8} />
        <KpiCard label="Critical Events" value={devSeverityArr.find((s: any) => s.name === 'Critical')?.value ?? 0} color="#FF5252" />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Deviation Trend" subtitle="Minor / Major / Critical — 12 weeks" height={GRAPH_H}>
            <StackedBarChart labels={deviationTrend.labels ?? []} datasets={[{ name: 'Minor', data: devMinor }, { name: 'Major', data: devMajor }, { name: 'Critical', data: devCritical }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Severity Distribution" subtitle="Deviation breakdown by severity" height={GRAPH_H}>
            <DonutChart data={devSeverityArr} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="CAPA Closure Time" subtitle={`Avg days to close — target ${capaClosureTime.target ?? 21}d`} height={GRAPH_H}>
            <SimpleBarChart labels={capaClosureTime.labels ?? []} data={capaAvgDays} refLine={capaClosureTime.target ?? 21} unit="d" color="#0277BD" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Root Cause Distribution" subtitle="Deviation root cause categories" height={GRAPH_H}>
            <SimpleBarChart labels={rootCauses.labels ?? []} data={rootCauses.counts ?? []} horizontal color="#FFB74D" height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function StabilityPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: stTpApi } = useQuery({ queryKey: ['an-stab-tp', branchId, params], queryFn: () => analyticsChartsApi.sampleInflow(branchId, params), retry: false });
  const st = D.stabilityTimepoints;
  const totalStudies = D.stabilityPullCalendar.rows.length;
  const completedPulls = D.stabilityPullCalendar.completed.flat().filter(Boolean).length;
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Active Studies" value={totalStudies} color={NAV_BG} />
        <KpiCard label="Timepoints Due" value={st.planned[3] - st.completed[3]} sub="T=9M pending" color="#FFB74D" />
        <KpiCard label="Pulls Completed" value={completedPulls} sub="This period" color={TEAL} trend={10} />
        <KpiCard label="OOT Events" value={2} color="#FF5252" />
        <KpiCard label="Studies On Track" value={`${Math.round((completedPulls / st.planned.reduce((a, b) => a + b, 0)) * 100)}%`} color="#4CAF50" />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Timepoint Completion" subtitle="Planned vs completed pulls per timepoint" height={GRAPH_H}>
            <StackedBarChart labels={st.labels} datasets={[{ name: 'Completed', data: st.completed }, { name: 'Planned', data: st.planned.map((p, i) => p - st.completed[i]) }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Assay Degradation Curve" subtitle={`% assay vs timepoint — spec ≥${D.stabilityDegradation.spec}%`} height={GRAPH_H}>
            <MultiLineChart labels={D.stabilityDegradation.labels} datasets={D.stabilityDegradation.datasets} unit="%" refLine={D.stabilityDegradation.spec} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Impurity Growth Curve" subtitle={`% impurity vs timepoint — limit ${D.stabilityImpurity.limit}%`} height={GRAPH_H}>
            <MultiLineChart labels={D.stabilityImpurity.labels} datasets={D.stabilityImpurity.datasets} unit="%" refLine={D.stabilityImpurity.limit} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Pull Schedule Calendar" subtitle="Planned vs completed pulls by study × month" height={GRAPH_H}>
            <HeatmapChart rows={D.stabilityPullCalendar.rows} cols={D.stabilityPullCalendar.cols} data={D.stabilityPullCalendar.planned} colorHigh={TEAL} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function EnvironmentalPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: tempApi } = useQuery({ queryKey: ['an-env-temp', branchId, params], queryFn: () => analyticsChartsApi.tempTrend(branchId, params), retry: false });
  const { data: humApi } = useQuery({ queryKey: ['an-env-hum', branchId, params], queryFn: () => analyticsChartsApi.humidityTrend(branchId, params), retry: false });
  const { data: cfuApi } = useQuery({ queryKey: ['an-env-cfu', branchId, params], queryFn: () => analyticsChartsApi.cfuTrend(branchId, params), retry: false });
  const tempTrend = resolved(tempApi, D.tempTrend);
  const humidityTrend = resolved(humApi, D.humidityTrend);
  const cfuTrend = resolved(cfuApi, D.cfuTrend);
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Active Chambers" value={3} color={NAV_BG} />
        <KpiCard label="Total Excursions" value={11} sub="Last 30 days" color="#FF5252" trend={-15} />
        <KpiCard label="Open Excursions" value={3} color="#FFB74D" />
        <KpiCard label="Avg CFU" value="14" sub="CFU/m³" color="#0277BD" />
        <KpiCard label="Alert Rate" value="2.1%" sub="vs 5% threshold" color={TEAL} trend={-8} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Temperature Trend" subtitle="Per chamber (°C) — last 14 days" height={GRAPH_H}>
            <MultiLineChart labels={tempTrend.labels} datasets={tempTrend.datasets} unit="°C" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Humidity Trend" subtitle="Per zone (% RH) — last 14 days" height={GRAPH_H}>
            <MultiLineChart labels={humidityTrend.labels} datasets={humidityTrend.datasets} unit="%" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Excursion Heatmap" subtitle="Zone × week — intensity = event count" height={GRAPH_H}>
            <HeatmapChart rows={['Chamber A', 'Chamber B', 'Stability Room', 'Lab Zone A']} cols={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']} data={[[1, 0, 2, 0], [0, 1, 0, 1], [0, 0, 1, 0], [2, 1, 0, 2]]} colorHigh="#FF5252" />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="CFU Trend" subtitle={`Microbial count — limit ${cfuTrend.limit} CFU/m³`} height={GRAPH_H}>
            <MultiLineChart labels={cfuTrend.labels} datasets={cfuTrend.datasets} refLine={cfuTrend.limit} height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function UsersPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: utilApi } = useQuery({ queryKey: ['an-user-util', branchId, params], queryFn: () => analyticsChartsApi.userUtilization(branchId, params), retry: false });
  const { data: loadApi } = useQuery({ queryKey: ['an-user-load', branchId, params], queryFn: () => analyticsChartsApi.analystLoadByModule(branchId, params), retry: false });
  const { data: reviewApi } = useQuery({ queryKey: ['an-reviewer-act', branchId, params], queryFn: () => analyticsChartsApi.reviewerActivity(branchId, params), retry: false });
  const { data: workloadApi } = useQuery({ queryKey: ['an-analyst-workload', branchId, params], queryFn: () => analyticsChartsApi.analystWorkload(branchId, params), retry: false });
  const userUtilization = resolved(utilApi, D.userUtilization);
  const analystLoadByModule = resolved(loadApi, D.analystLoadByModule);
  const reviewerActivity = resolved(reviewApi, D.reviewerActivity);
  const analystWorkload = resolved(workloadApi, D.analystWorkload);
  const avgUtil = Math.round(userUtilization.data.reduce((a: number, b: number) => a + b, 0) / userUtilization.data.length);
  const under = userUtilization.data.filter((v: number) => v < userUtilization.target).length;
  const topIdx = userUtilization.data.indexOf(Math.max(...userUtilization.data));
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="Total Active Users" value={userUtilization.labels.length} color={NAV_BG} />
        <KpiCard label="Avg Utilization" value={`${avgUtil}%`} sub={`Target ${userUtilization.target}%`} color={avgUtil >= userUtilization.target ? TEAL : '#FFB74D'} />
        <KpiCard label="Top Performer" value={userUtilization.labels[topIdx]} sub={`${Math.max(...userUtilization.data)}% utilization`} color="#4CAF50" />
        <KpiCard label="Under-Utilized" value={under} sub={`Below ${userUtilization.target}% threshold`} color={under > 0 ? '#FFB74D' : TEAL} />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <ChartCard title="Utilization Overview" subtitle={`% utilization — target ${userUtilization.target}%`} height={GRAPH_H}>
            <UtilizationChart labels={userUtilization.labels} data={userUtilization.data} target={userUtilization.target} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title="Analyst Load by Module" subtitle="Samples / Worksheets / Instruments / QA" height={GRAPH_H}>
            <StackedBarChart labels={analystLoadByModule.labels} datasets={[{ name: 'Samples', data: analystLoadByModule.samples }, { name: 'Worksheets', data: analystLoadByModule.worksheets }, { name: 'Instruments', data: analystLoadByModule.instruments }, { name: 'QA', data: analystLoadByModule.qa }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Reviewer Activity" subtitle="Reviews / approvals / rejections per day" height={GRAPH_H}>
            <MultiAreaChart labels={reviewerActivity.labels} datasets={[{ name: 'Reviews', data: reviewerActivity.reviews }, { name: 'Approvals', data: reviewerActivity.approvals }, { name: 'Rejections', data: reviewerActivity.rejections }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Chemical Consumption per Analyst" subtitle="Estimated reagent usage allocation (mL)" height={GRAPH_H}>
            <SimpleBarChart labels={analystWorkload.labels} data={[420, 310, 580, 255, 395, 340]} unit=" mL" horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

function AIPanel() {
  const { branchId, params } = useAnalyticsParams();
  const { data: oosRiskApi } = useQuery({ queryKey: ['an-ai-oos-risk', branchId, params], queryFn: () => analyticsChartsApi.oosRiskTrend(branchId, params), retry: false });
  const { data: forecastApi } = useQuery({ queryKey: ['an-ai-forecast', branchId, params], queryFn: () => analyticsChartsApi.consumptionForecast(branchId, params), retry: false });
  const { data: failApi } = useQuery({ queryKey: ['an-ai-failure', branchId, params], queryFn: () => analyticsChartsApi.instrumentFailurePrediction(branchId, params), retry: false });
  const { data: workloadApi } = useQuery({ queryKey: ['an-analyst-workload', branchId, params], queryFn: () => analyticsChartsApi.analystWorkload(branchId, params), retry: false });
  const oosRiskTrend = resolved(oosRiskApi, D.oosRiskTrend);
  const consumptionForecast = resolved(forecastApi, D.consumptionForecast);
  const instrumentFailurePrediction = resolved(failApi, D.instrumentFailurePrediction);
  const analystWorkload = resolved(workloadApi, D.analystWorkload);
  const highRiskInstr = instrumentFailurePrediction.risk.filter((v: number) => v >= 70).length;
  const highRiskProd = oosRiskTrend.risk.filter((v: number) => v >= oosRiskTrend.threshold).length;
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <KpiCard label="High OOS-Risk Products" value={highRiskProd} color="#FF5252" />
        <KpiCard label="Instrument Failure Risk" value={highRiskInstr} sub="Above 70% threshold" color="#FFB74D" />
        <KpiCard label="Model Confidence" value="94.2%" sub="Forecast accuracy" color={TEAL} />
        <KpiCard label="Reorder Alerts" value={3} sub="Low inventory predicted" color="#0277BD" />
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="OOS Risk Score by Product" subtitle={`Risk % — threshold ${oosRiskTrend.threshold}%`} height={GRAPH_H}>
            <SimpleBarChart labels={oosRiskTrend.labels} data={oosRiskTrend.risk} refLine={oosRiskTrend.threshold} unit="%" color="#FFB74D" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Consumption Forecast" subtitle="Actual vs AI forecast (Acetonitrile, mL/week)" height={GRAPH_H}>
            <MultiAreaChart labels={consumptionForecast.labels} datasets={[{ name: 'Actual', data: consumptionForecast.actual as number[] }, { name: 'Forecast', data: consumptionForecast.forecast as number[] }]} height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Instrument Failure Prediction" subtitle="Risk score % — threshold 70%" height={GRAPH_H}>
            <SimpleBarChart labels={instrumentFailurePrediction.labels} data={instrumentFailurePrediction.risk} refLine={instrumentFailurePrediction.threshold} unit="%" color="#FF5252" height={GRAPH_H} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Workload Forecast — Next 2 Weeks" subtitle="Predicted samples per analyst" height={GRAPH_H}>
            <SimpleBarChart labels={analystWorkload.labels} data={analystWorkload.samples.map((v: number) => Math.round(v * 1.12))} color={NAV_BG} horizontal height={GRAPH_H} />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}

// ─── PANEL MAP ────────────────────────────────────────────────────────────────
type PanelFC = React.ComponentType;
const PANELS: Record<AnalyticsModule, PanelFC> = {
  samples:       SamplesPanel,
  worksheets:    WorksheetsPanel,
  instruments:   InstrumentsPanel,
  inventory:     InventoryPanel,
  qa:            QAPanel,
  stability:     StabilityPanel,
  environmental: EnvironmentalPanel,
  users:         UsersPanel,
  ai:            AIPanel,
};

// ─── MASTER DASHBOARD ────────────────────────────────────────────────────────
export default function AnalyticsDashboardPage() {
  const { currentBranchId } = useUIStore();
  const [module, setModule] = useState<AnalyticsModule>('samples');
  const [subTab, setSubTab] = useState('Dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [product, setProduct] = useState('');
  const [instrument, setInstrument] = useState('');
  const [analyst, setAnalyst] = useState('');
  const [branch, setBranch] = useState('nj');

  const ActivePanel = PANELS[module];
  const activeMod = MODULES.find((m) => m.id === module)!;

  const handleModuleChange = (m: AnalyticsModule) => {
    const mod = MODULES.find((x) => x.id === m);
    // AI Insights always navigates to its standalone page
    if (m === 'ai' && mod?.listPath) {
      window.location.href = mod.listPath;
      return;
    }
    setModule(m);
    setSubTab('Dashboard');
  };

  const ctxValue = { branchId: currentBranchId, params: { timeRange, product, instrument, analyst } };

  return (
    <AnalyticsCtx.Provider value={ctxValue}>
    <Box sx={{ mx: -3, mt: -3 }}>
      {/* ── Top Module Nav ── */}
      <TopModuleNav active={module} onChange={handleModuleChange} />

      {/* ── Sub Nav ── */}
      <SubNavBar module={activeMod} subTab={subTab} onSubTab={setSubTab} />

      {/* ── Filter Bar ── */}
      <FilterBar
        timeRange={timeRange} onTimeRange={setTimeRange}
        product={product} onProduct={setProduct}
        instrument={instrument} onInstrument={setInstrument}
        analyst={analyst} onAnalyst={setAnalyst}
        branch={branch} onBranch={setBranch}
      />

      {/* ── Main Content ── */}
      <Box sx={{ p: 3 }}>
        {subTab === 'Dashboard' ? (
          <>
            <ActivePanel />
            <UserUtilizationPanel />
          </>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">{subTab} for {activeMod.label}</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Navigate to the module page using the sidebar, or select <strong>Dashboard</strong> to view analytics.
            </Typography>
          </Box>
        )}
        <DashboardFooter />
      </Box>
    </Box>
    </AnalyticsCtx.Provider>
  );
}
