import api, { withBranch } from './client';

// ─── ANALYTICS API ENDPOINTS ─────────────────────────────────────────────────
// These endpoints back the master analytics dashboard.
// All accept branchId + optional time-range/filter params.

export const analyticsChartsApi = {
  // Samples
  sampleInflow: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/samples/inflow', { ...withBranch(branchId), params }),
  sampleTat: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/samples/tat', { ...withBranch(branchId), params }),
  samplePassFail: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/samples/pass-fail', { ...withBranch(branchId), params }),
  sampleOosFrequency: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/samples/oos-frequency', { ...withBranch(branchId), params }),
  analystWorkload: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/users/analyst-workload', { ...withBranch(branchId), params }),

  // Worksheets
  worksheetStatusTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/worksheets/status-trend', { ...withBranch(branchId), params }),
  worksheetExecutionTime: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/worksheets/execution-time', { ...withBranch(branchId), params }),
  worksheetRejectionRate: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/worksheets/rejection-rate', { ...withBranch(branchId), params }),

  // Instruments
  instrumentUtilization: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/instruments/utilization', { ...withBranch(branchId), params }),
  instrumentUptime: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/instruments/uptime', { ...withBranch(branchId), params }),
  instrumentCalibrationStatus: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/instruments/calibration-status', { ...withBranch(branchId), params }),
  instrumentUsageByProduct: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/instruments/usage-by-product', { ...withBranch(branchId), params }),

  // Inventory
  chemicalConsumption: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/inventory/consumption', { ...withBranch(branchId), params }),
  chemicalExpiry: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/inventory/expiry', { ...withBranch(branchId), params }),
  issuanceVsDestruction: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/inventory/issuance-destruction', { ...withBranch(branchId), params }),
  costPerProduct: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/inventory/cost-per-product', { ...withBranch(branchId), params }),

  // QA/QC
  deviationTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/qa/deviation-trend', { ...withBranch(branchId), params }),
  deviationSeverity: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/qa/deviation-severity', { ...withBranch(branchId), params }),
  capaClosureTime: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/qa/capa-closure', { ...withBranch(branchId), params }),
  rootCauseDistribution: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/qa/root-cause', { ...withBranch(branchId), params }),

  // Environmental
  tempTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/environmental/temperature', { ...withBranch(branchId), params }),
  humidityTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/environmental/humidity', { ...withBranch(branchId), params }),
  cfuTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/environmental/cfu', { ...withBranch(branchId), params }),
  excursionSeverity: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/environmental/excursions', { ...withBranch(branchId), params }),

  // User utilization
  userUtilization: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/users/utilization', { ...withBranch(branchId), params }),
  reviewerActivity: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/users/reviewer-activity', { ...withBranch(branchId), params }),
  analystLoadByModule: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/users/load-by-module', { ...withBranch(branchId), params }),

  // AI
  oosRiskTrend: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/ai/oos-risk-trend', { ...withBranch(branchId), params }),
  consumptionForecast: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/ai/consumption-forecast', { ...withBranch(branchId), params }),
  instrumentFailurePrediction: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/analytics/ai/instrument-failure', { ...withBranch(branchId), params }),
};

// ─── MOCK DATA GENERATORS ────────────────────────────────────────────────────
// Used when API returns no data, so the dashboard always looks great.

function dateLabels(n: number, interval: 'day' | 'week' = 'day'): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (interval === 'week' ? 7 : 1));
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

function trend(base: number, n: number, noise = 0.2): number[] {
  return Array.from({ length: n }, (_, i) => {
    const drift = base + (i * base * 0.02);
    return Math.max(0, Math.round(drift + (Math.random() - 0.5) * drift * noise));
  });
}

export const MOCK = {
  days: dateLabels(30),
  weeks: dateLabels(12, 'week'),
  analysts: ['J. Smith', 'R. Patel', 'M. Chen', 'A. Kumar', 'S. Lee', 'T. Brown'],
  instruments: ['HPLC-01', 'HPLC-02', 'pH Meter-01', 'KF Titrator', 'UV-Vis-01', 'GC-01'],
  products: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A', 'Injection-B'],
  severities: ['Minor', 'Major', 'Critical'],
  rootCauses: ['Human Error', 'Equipment Failure', 'Process Deviation', 'Environmental', 'Supplier Quality'],

  sampleInflow: () => ({
    labels: dateLabels(30),
    datasets: [{ name: 'Registered', data: trend(18, 30, 0.3) }, { name: 'Completed', data: trend(14, 30, 0.25) }],
  }),

  tat: () => ({
    labels: dateLabels(14),
    data: trend(4.2, 14, 0.15).map(v => +(v / 10 + 3).toFixed(1)),
    spec: 5.0,
  }),

  passFail: () => ({
    labels: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A', 'Injection-B'],
    pass: [42, 37, 55, 28, 19],
    fail: [3, 2, 1, 4, 2],
    oos: [1, 1, 0, 2, 1],
  }),

  oosFrequency: () => ({
    labels: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A', 'Injection-B'],
    oos: [4, 3, 1, 6, 3],
    oot: [2, 1, 2, 3, 1],
  }),

  analystWorkload: () => ({
    labels: ['J. Smith', 'R. Patel', 'M. Chen', 'A. Kumar', 'S. Lee', 'T. Brown'],
    samples: [24, 18, 31, 15, 22, 19],
    tests: [48, 36, 62, 30, 44, 38],
  }),

  worksheetStatusTrend: () => ({
    labels: dateLabels(14),
    draft: trend(5, 14, 0.3),
    submitted: trend(8, 14, 0.25),
    approved: trend(7, 14, 0.2),
    rejected: trend(1, 14, 0.5),
  }),

  worksheetExecutionTime: () => ({
    labels: ['<1h', '1-2h', '2-4h', '4-8h', '8-16h', '>16h'],
    data: [12, 28, 45, 31, 18, 6],
  }),

  worksheetRejectionRate: () => ({
    labels: ['J. Smith', 'R. Patel', 'M. Chen', 'A. Kumar', 'S. Lee'],
    rate: [4.2, 2.1, 6.8, 1.5, 3.3],
  }),

  instrumentUtilization: () => ({
    labels: dateLabels(14),
    datasets: [
      { name: 'HPLC-01', data: trend(6, 14, 0.3) },
      { name: 'HPLC-02', data: trend(5, 14, 0.4) },
      { name: 'UV-Vis-01', data: trend(4, 14, 0.35) },
    ],
  }),

  instrumentUptime: () => ({
    labels: ['HPLC-01', 'HPLC-02', 'pH Meter-01', 'KF Titrator', 'UV-Vis-01', 'GC-01'],
    uptime: [92, 88, 97, 85, 94, 79],
    downtime: [8, 12, 3, 15, 6, 21],
    maintenance: [4, 6, 2, 8, 3, 10],
  }),

  calibrationStatus: () => ({
    labels: ['HPLC-01', 'HPLC-02', 'pH Meter-01', 'KF Titrator', 'UV-Vis-01', 'GC-01'],
    ok: [1, 1, 1, 0, 1, 1],
    due: [0, 0, 0, 1, 0, 0],
    overdue: [0, 0, 0, 0, 0, 1],
  }),

  instrumentUsageByProduct: () => ({
    labels: ['HPLC-01', 'HPLC-02', 'UV-Vis-01', 'GC-01', 'pH Meter-01'],
    products: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A'],
    matrix: [[22, 8, 15, 4], [18, 12, 6, 9], [5, 3, 18, 7], [2, 1, 4, 11], [8, 5, 9, 3]],
  }),

  chemicalConsumption: () => ({
    labels: dateLabels(12, 'week'),
    datasets: [
      { name: 'Acetonitrile', data: trend(28, 12, 0.2) },
      { name: 'Methanol', data: trend(22, 12, 0.25) },
      { name: 'HCl 1N', data: trend(12, 12, 0.3) },
    ],
  }),

  chemicalExpiry: () => ({
    chemicals: ['Acetonitrile', 'Methanol', 'HCl 1N', 'NaOH 1N', 'KCl'],
    months: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    risk: [
      [3, 0, 0, 0, 0],
      [0, 2, 1, 0, 0],
      [0, 0, 0, 4, 0],
      [0, 0, 2, 0, 1],
      [1, 0, 0, 0, 3],
    ],
  }),

  issuanceVsDestruction: () => ({
    labels: dateLabels(8, 'week'),
    issued: trend(85, 8, 0.15),
    destroyed: trend(12, 8, 0.4),
    returned: trend(8, 8, 0.3),
  }),

  costPerProduct: () => ({
    labels: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A', 'Injection-B'],
    chemical: [4200, 3100, 1800, 5600, 2900],
    instrument: [2800, 2200, 900, 3400, 1700],
  }),

  deviationTrend: () => ({
    labels: dateLabels(12, 'week'),
    minor: trend(3, 12, 0.4),
    major: trend(1.5, 12, 0.5),
    critical: trend(0.3, 12, 0.8),
  }),

  deviationSeverity: () => [
    { name: 'Minor', value: 38 },
    { name: 'Major', value: 22 },
    { name: 'Critical', value: 6 },
  ],

  capaClosureTime: () => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    avgDays: [18, 22, 15, 28, 20, 16],
    target: 21,
  }),

  rootCauseDistribution: () => ({
    labels: ['Human Error', 'Equipment Failure', 'Process Deviation', 'Environmental', 'Supplier Quality'],
    counts: [18, 12, 9, 6, 4],
  }),

  tempTrend: () => ({
    labels: dateLabels(14),
    datasets: [
      { name: 'Chamber A', data: Array.from({ length: 14 }, () => +(2 + Math.random() * 1.5).toFixed(1)) },
      { name: 'Chamber B', data: Array.from({ length: 14 }, () => +(-18 + Math.random() * 2).toFixed(1)) },
      { name: 'Stability Room', data: Array.from({ length: 14 }, () => +(25 + Math.random() * 1).toFixed(1)) },
    ],
    limits: [{ name: 'Chamber A', min: 2, max: 8 }, { name: 'Chamber B', min: -25, max: -15 }, { name: 'Stability Room', min: 23, max: 27 }],
  }),

  humidityTrend: () => ({
    labels: dateLabels(14),
    datasets: [
      { name: 'Stability Room', data: Array.from({ length: 14 }, () => +(60 + Math.random() * 5).toFixed(1)) },
      { name: 'Lab Zone A', data: Array.from({ length: 14 }, () => +(45 + Math.random() * 8).toFixed(1)) },
    ],
  }),

  cfuTrend: () => ({
    labels: dateLabels(10),
    datasets: [
      { name: 'Room 101', data: trend(8, 10, 0.4) },
      { name: 'Room 102', data: trend(12, 10, 0.35) },
      { name: 'Clean Zone', data: trend(2, 10, 0.6) },
    ],
    limit: 100,
  }),

  excursionSeverity: () => [
    { name: 'Low', value: 12 },
    { name: 'Moderate', value: 8 },
    { name: 'High', value: 3 },
  ],

  userUtilization: () => ({
    labels: ['J. Smith', 'R. Patel', 'M. Chen', 'A. Kumar', 'S. Lee', 'T. Brown'],
    data: [78, 92, 65, 88, 71, 54],
    target: 75,
  }),

  analystLoadByModule: () => ({
    labels: ['J. Smith', 'R. Patel', 'M. Chen', 'A. Kumar', 'S. Lee'],
    samples: [24, 18, 31, 15, 22],
    worksheets: [12, 15, 8, 20, 11],
    instruments: [6, 4, 9, 3, 7],
    qa: [2, 5, 1, 4, 3],
  }),

  reviewerActivity: () => ({
    labels: dateLabels(14),
    reviews: trend(6, 14, 0.35),
    approvals: trend(5, 14, 0.3),
    rejections: trend(1, 14, 0.6),
  }),

  oosRiskTrend: () => ({
    labels: ['API-Alpha', 'API-Beta', 'Excipient-X', 'Tablet-A', 'Injection-B'],
    risk: [68, 42, 15, 78, 35],
    threshold: 60,
  }),

  consumptionForecast: () => ({
    labels: [...dateLabels(8), 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
    actual: [...trend(28, 8, 0.2), null, null, null, null],
    forecast: [null, null, null, null, null, null, null, null, 30, 33, 29, 35],
    lower: [null, null, null, null, null, null, null, null, 25, 27, 24, 29],
    upper: [null, null, null, null, null, null, null, null, 35, 39, 34, 41],
  }),

  instrumentFailurePrediction: () => ({
    labels: ['HPLC-01', 'HPLC-02', 'KF Titrator', 'GC-01', 'UV-Vis-01'],
    risk: [72, 45, 88, 31, 19],
    threshold: 70,
  }),

  stabilityTimepoints: () => ({
    labels: ['T=0', 'T=3M', 'T=6M', 'T=9M', 'T=12M', 'T=18M', 'T=24M'],
    planned: [6, 6, 6, 6, 6, 6, 6],
    completed: [6, 6, 5, 4, 2, 0, 0],
  }),

  stabilityDegradation: () => ({
    labels: ['T=0', 'T=3M', 'T=6M', 'T=9M', 'T=12M'],
    datasets: [
      { name: '25°C/60%RH', data: [100, 99.2, 98.1, 97.4, 96.8] },
      { name: '40°C/75%RH', data: [100, 98.5, 96.2, 94.1, 91.8] },
    ],
    spec: 90,
  }),

  stabilityImpurity: () => ({
    labels: ['T=0', 'T=3M', 'T=6M', 'T=9M', 'T=12M'],
    datasets: [
      { name: 'Impurity A', data: [0.05, 0.12, 0.18, 0.24, 0.31] },
      { name: 'Impurity B', data: [0.03, 0.08, 0.14, 0.19, 0.25] },
    ],
    limit: 0.5,
  }),

  stabilityPullCalendar: () => ({
    rows: ['Study A', 'Study B', 'Study C'],
    cols: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    planned: [[1, 1, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1], [1, 0, 1, 1, 0, 0]],
    completed: [[1, 1, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0]],
  }),
};

export type TimeRange = '7d' | '30d' | '90d' | 'custom';
export type AnalyticsModule =
  | 'samples'
  | 'worksheets'
  | 'instruments'
  | 'inventory'
  | 'qa'
  | 'stability'
  | 'environmental'
  | 'users'
  | 'ai';

export interface GlobalFilters {
  timeRange: TimeRange;
  productId?: string;
  instrumentId?: string;
  analystId?: string;
}
