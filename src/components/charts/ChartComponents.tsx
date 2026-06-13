import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Tooltip, useTheme, alpha } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';

// ─── SHARED CHART COLOURS ────────────────────────────────────────────────────
// Design-spec palette: navy, teal, purple(accent), orange, green, red, blue, cyan
export const CHART_COLORS = [
  '#0A1A3F', '#00C2A8', '#6C63FF', '#FFB74D', '#4CAF50',
  '#FF5252', '#1B6CA8', '#26C6DA', '#FFA726', '#66BB6A',
];

export const PASTEL = [
  'rgba(10,26,63,0.82)', 'rgba(0,194,168,0.8)', 'rgba(108,99,255,0.78)',
  'rgba(255,183,77,0.82)', 'rgba(76,175,80,0.8)',
];

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: number;
}

export function KpiCard({ label, value, sub, color, trend }: KpiCardProps) {
  const theme = useTheme();
  const c = color ?? theme.palette.primary.main;
  return (
    <Card sx={{ flex: '1 1 160px', minWidth: 140, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
          bgcolor: c, borderRadius: '4px 0 0 4px',
        }}
      />
      <CardContent sx={{ pl: 2.5, pt: 1.75, pb: '14px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          {label}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.25 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: c, lineHeight: 1 }}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Typography variant="caption" sx={{ color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main, fontWeight: 700 }}>
              {trend >= 0 ? '+' : ''}{trend}%
            </Typography>
          )}
        </Stack>
        {sub && (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CHART CARD WRAPPER ───────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, height = 260, children }: ChartCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '8px !important' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: subtitle ? 0 : 1 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{subtitle}</Typography>
        )}
        <Box sx={{ height }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── MULTI-LINE CHART ─────────────────────────────────────────────────────────
interface MultiLineProps {
  labels: string[];
  datasets: { name: string; data: (number | null)[] }[];
  unit?: string;
  refLine?: number;
  height?: number;
}

export function MultiLineChart({ labels, datasets, unit, refLine, height = 240 }: MultiLineProps) {
  const data = labels.map((label, i) => {
    const point: Record<string, string | number | null> = { label };
    datasets.forEach((ds) => { point[ds.name] = ds.data[i] ?? null; });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit={unit} />
        <RTooltip
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {datasets.map((ds, i) => (
          <Line
            key={ds.name}
            type="monotone"
            dataKey={ds.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
        {refLine !== undefined && (
          <Line dataKey={() => refLine} stroke="#C62828" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Target" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── AREA CHART ───────────────────────────────────────────────────────────────
interface AreaChartProps {
  labels: string[];
  datasets: { name: string; data: (number | null)[] }[];
  height?: number;
}

export function MultiAreaChart({ labels, datasets, height = 240 }: AreaChartProps) {
  const data = labels.map((label, i) => {
    const point: Record<string, string | number | null> = { label };
    datasets.forEach((ds) => { point[ds.name] = ds.data[i] ?? null; });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          {datasets.map((ds, i) => (
            <linearGradient key={ds.name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {datasets.map((ds, i) => (
          <Area
            key={ds.name}
            type="monotone"
            dataKey={ds.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            fill={`url(#grad-${i})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── STACKED BAR ──────────────────────────────────────────────────────────────
interface StackedBarProps {
  labels: string[];
  datasets: { name: string; data: number[] }[];
  unit?: string;
  height?: number;
  horizontal?: boolean;
}

export function StackedBarChart({ labels, datasets, unit, height = 240, horizontal }: StackedBarProps) {
  const data = labels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    datasets.forEach((ds) => { point[ds.name] = ds.data[i]; });
    return point;
  });

  const Chart = horizontal ? BarChart : BarChart;
  const layout = horizontal ? 'vertical' : 'horizontal';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 5, right: 10, left: horizontal ? 60 : -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit={unit} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit={unit} />
          </>
        )}
        <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {datasets.map((ds, i) => (
          <Bar key={ds.name} dataKey={ds.name} stackId="s" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={i === datasets.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── SIMPLE BAR ───────────────────────────────────────────────────────────────
interface SimpleBarProps {
  labels: string[];
  data: number[];
  color?: string;
  unit?: string;
  refLine?: number;
  height?: number;
  horizontal?: boolean;
}

export function SimpleBarChart({ labels, data, color, unit, refLine, height = 240, horizontal }: SimpleBarProps) {
  const theme = useTheme();
  const c = color ?? theme.palette.primary.main;
  const chartData = labels.map((label, i) => ({ label, value: data[i], ref: refLine }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 10, left: horizontal ? 70 : -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit={unit} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit={unit} />
          </>
        )}
        <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
        <Bar dataKey="value" fill={c} radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={refLine !== undefined && entry.value > refLine
                ? '#C62828'
                : alpha(c, 0.85 - i * 0.05 > 0.5 ? 0.85 - i * 0.02 : 0.65)}
            />
          ))}
        </Bar>
        {refLine !== undefined && (
          <Line dataKey="ref" stroke="#C62828" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── DONUT / PIE ──────────────────────────────────────────────────────────────
interface DonutProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function DonutChart({ data, height = 240 }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius="50%" outerRadius="75%" paddingAngle={3} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <RTooltip
          formatter={(val: number, name: string) => [`${val} (${((val / total) * 100).toFixed(1)}%)`, name]}
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── UTILIZATION RADIAL ───────────────────────────────────────────────────────
interface RadialProps {
  labels: string[];
  data: number[];
  target?: number;
  height?: number;
}

export function UtilizationChart({ labels, data, target = 75, height = 260 }: RadialProps) {
  const theme = useTheme();
  const chartData = labels.map((name, i) => ({
    name,
    value: data[i],
    fill: data[i] >= target ? theme.palette.success.main : data[i] >= target * 0.8 ? theme.palette.warning.main : theme.palette.error.main,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        cx="50%"
        cy="55%"
        innerRadius="15%"
        outerRadius="90%"
        data={chartData}
        startAngle={180}
        endAngle={0}
        barSize={14}
      >
        <RadialBar dataKey="value" background={{ fill: 'rgba(0,0,0,0.04)' }} label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 600 }} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <RTooltip
          formatter={(val: number, name: string) => [`${val}%`, name]}
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// ─── HEATMAP GRID ─────────────────────────────────────────────────────────────
interface HeatmapProps {
  rows: string[];
  cols: string[];
  data: number[][];
  maxVal?: number;
  colorHigh?: string;
}

export function HeatmapChart({ rows, cols, data, maxVal, colorHigh = '#C62828' }: HeatmapProps) {
  const theme = useTheme();
  const max = maxVal ?? Math.max(...data.flat(), 1);

  function hexAlpha(hex: string, a: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `100px repeat(${cols.length}, 1fr)`, gap: '2px', minWidth: 320 }}>
        <Box />
        {cols.map((col) => (
          <Typography key={col} variant="caption" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 0.5 }}>
            {col}
          </Typography>
        ))}
        {rows.map((row, ri) => (
          <React.Fragment key={row}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', pr: 1 }} noWrap>
              {row}
            </Typography>
            {cols.map((_, ci) => {
              const val = data[ri]?.[ci] ?? 0;
              const intensity = val / max;
              return (
                <Tooltip key={ci} title={`${row} × ${cols[ci]}: ${val}`} arrow>
                  <Box
                    sx={{
                      height: 32,
                      borderRadius: 1,
                      bgcolor: val === 0 ? alpha(theme.palette.divider, 0.5) : hexAlpha(colorHigh, 0.15 + intensity * 0.75),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'default',
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  >
                    {val > 0 && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: intensity > 0.5 ? '#fff' : colorHigh, fontSize: 11 }}>
                        {val}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}
