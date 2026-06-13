import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, Stack, Chip, Tooltip, Paper,
  Collapse, alpha, useTheme, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, Divider, Button,
} from '@mui/material';
import {
  PlayArrow, Pause, Stop, Restore, Timer, ExpandMore,
  ExpandLess, FlagOutlined, Close, ContentCopy,
} from '@mui/icons-material';

interface Lap {
  index: number;
  lapTime: number;    // ms for this lap segment
  elapsed: number;    // total elapsed at the time of this lap
}

interface StopwatchProps {
  /** Label shown as the title of the widget */
  label?: string;
  /** If true, shows as a compact inline chip that opens a floating panel on click */
  compact?: boolean;
  /** Called with elapsed ms when the stopwatch is stopped (not reset) */
  onStop?: (elapsedMs: number, laps: Lap[]) => void;
  /** If provided, the stopwatch shows inside a Dialog */
  dialogMode?: boolean;
  dialogOpen?: boolean;
  onDialogClose?: () => void;
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function StopwatchCore({
  label,
  onStop,
}: {
  label?: string;
  onStop?: (elapsedMs: number, laps: Lap[]) => void;
}) {
  const theme = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [showLaps, setShowLaps] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const lastLapElapsedRef = useRef<number>(0);

  const tick = useCallback(() => {
    setElapsed(accumulatedRef.current + (Date.now() - startTimeRef.current));
  }, []);

  const handleStart = () => {
    if (running) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(tick, 10);
    setRunning(true);
  };

  const handlePause = () => {
    if (!running) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current += Date.now() - startTimeRef.current;
    setRunning(false);
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalElapsed = running
      ? accumulatedRef.current + (Date.now() - startTimeRef.current)
      : accumulatedRef.current;
    setRunning(false);
    onStop?.(finalElapsed, laps);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    setShowLaps(false);
    accumulatedRef.current = 0;
    lastLapElapsedRef.current = 0;
  };

  const handleLap = () => {
    if (!running) return;
    const currentElapsed = accumulatedRef.current + (Date.now() - startTimeRef.current);
    const lapTime = currentElapsed - lastLapElapsedRef.current;
    lastLapElapsedRef.current = currentElapsed;
    setLaps((prev) => [
      ...prev,
      { index: prev.length + 1, lapTime, elapsed: currentElapsed },
    ]);
    setShowLaps(true);
  };

  const handleCopy = () => {
    const text = [
      label ? `${label} — Stopwatch` : 'Stopwatch',
      `Total: ${formatMs(elapsed)}`,
      ...laps.map((l) => `Lap ${l.index}: ${formatMs(l.lapTime)}  (Elapsed: ${formatMs(l.elapsed)})`),
    ].join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Find fastest and slowest laps
  const lapTimes = laps.map((l) => l.lapTime);
  const minLap = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const maxLap = lapTimes.length > 1 ? Math.max(...lapTimes) : null;

  const btnSx = {
    width: 44, height: 44, transition: 'all 0.15s',
    '&:hover': { transform: 'scale(1.1)' },
  };

  return (
    <Box>
      {label && (
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, display: 'block', mb: 1 }}>
          {label}
        </Typography>
      )}

      {/* Display */}
      <Box
        sx={{
          textAlign: 'center',
          py: 2.5,
          px: 3,
          borderRadius: 2,
          bgcolor: running
            ? alpha(theme.palette.primary.main, 0.06)
            : elapsed > 0
              ? alpha(theme.palette.grey[500], 0.05)
              : alpha(theme.palette.grey[500], 0.04),
          border: `1px solid ${running ? alpha(theme.palette.primary.main, 0.2) : theme.palette.divider}`,
          transition: 'all 0.3s',
          mb: 2,
          position: 'relative',
        }}
      >
        {running && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: theme.palette.error.main,
              animation: 'pulse 1s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
        )}
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", "Courier New", monospace',
            fontSize: 36,
            fontWeight: 700,
            color: running ? theme.palette.primary.main : 'text.primary',
            letterSpacing: 2,
            lineHeight: 1,
            transition: 'color 0.3s',
          }}
        >
          {formatMs(elapsed)}
        </Typography>
        {laps.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Lap {laps.length} +{formatMs(elapsed - lastLapElapsedRef.current)}
          </Typography>
        )}
      </Box>

      {/* Controls */}
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: laps.length > 0 ? 1.5 : 0 }}>
        {/* Lap / Reset (left) */}
        {running ? (
          <Tooltip title="Record lap">
            <IconButton size="small" onClick={handleLap} sx={{ ...btnSx, color: theme.palette.secondary.main }}>
              <FlagOutlined />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Reset">
            <span>
              <IconButton
                size="small"
                onClick={handleReset}
                disabled={elapsed === 0}
                sx={{ ...btnSx, color: theme.palette.text.secondary }}
              >
                <Restore />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {/* Play / Pause (center, large) */}
        {running ? (
          <Tooltip title="Pause">
            <IconButton
              onClick={handlePause}
              sx={{
                width: 56, height: 56,
                bgcolor: theme.palette.warning.main,
                color: '#fff',
                '&:hover': { bgcolor: theme.palette.warning.dark, transform: 'scale(1.05)' },
                transition: 'all 0.15s',
              }}
            >
              <Pause />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Start">
            <IconButton
              onClick={handleStart}
              sx={{
                width: 56, height: 56,
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                '&:hover': { bgcolor: theme.palette.primary.dark, transform: 'scale(1.05)' },
                transition: 'all 0.15s',
              }}
            >
              <PlayArrow />
            </IconButton>
          </Tooltip>
        )}

        {/* Stop (right) */}
        <Tooltip title={elapsed > 0 ? 'Stop & record' : 'Stop'}>
          <span>
            <IconButton
              size="small"
              onClick={handleStop}
              disabled={elapsed === 0}
              sx={{
                ...btnSx,
                color: elapsed > 0 ? theme.palette.error.main : theme.palette.text.disabled,
              }}
            >
              <Stop />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Lap toggle + copy */}
      {laps.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Button
            size="small"
            variant="text"
            startIcon={showLaps ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            onClick={() => setShowLaps((v) => !v)}
            sx={{ fontSize: 12, color: 'text.secondary' }}
          >
            {laps.length} lap{laps.length > 1 ? 's' : ''}
          </Button>
          <Tooltip title="Copy to clipboard">
            <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.secondary' }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {/* Lap list */}
      <Collapse in={showLaps && laps.length > 0}>
        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: theme.palette.divider, borderRadius: 2 },
          }}
        >
          {[...laps].reverse().map((lap, i) => {
            const isFastest = lap.lapTime === minLap;
            const isSlowest = lap.lapTime === maxLap;
            return (
              <React.Fragment key={lap.index}>
                {i > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 0.75,
                    bgcolor: isFastest ? alpha(theme.palette.success.main, 0.05) :
                             isSlowest ? alpha(theme.palette.error.main, 0.05) : 'transparent',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                      Lap {lap.index}
                    </Typography>
                    {isFastest && <Chip label="Best" size="small" color="success" sx={{ height: 16, fontSize: 10 }} />}
                    {isSlowest && <Chip label="Slow" size="small" color="error" sx={{ height: 16, fontSize: 10 }} />}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: isFastest ? theme.palette.success.main :
                               isSlowest ? theme.palette.error.main : 'text.primary',
                      }}
                    >
                      {formatMs(lap.lapTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {formatMs(lap.elapsed)}
                    </Typography>
                  </Stack>
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Stopwatch — reusable digital stopwatch component.
 *
 * Usage modes:
 *   1. Inline embedded:    <Stopwatch label="Analysis Timer" onStop={handler} />
 *   2. Compact trigger:    <Stopwatch compact label="Timer" />
 *   3. Dialog mode:        <Stopwatch dialogMode dialogOpen={open} onDialogClose={onClose} />
 */
export default function Stopwatch({
  label = 'Stopwatch',
  compact = false,
  onStop,
  dialogMode = false,
  dialogOpen = false,
  onDialogClose,
}: StopwatchProps) {
  const theme = useTheme();
  const [floatingOpen, setFloatingOpen] = useState(false);

  // Dialog mode
  if (dialogMode) {
    return (
      <Dialog
        open={dialogOpen}
        onClose={onDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Timer color="primary" />
            <Typography fontWeight={700}>{label}</Typography>
          </Stack>
          <IconButton size="small" onClick={onDialogClose}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 3 }}>
          <StopwatchCore label={undefined} onStop={onStop} />
        </DialogContent>
      </Dialog>
    );
  }

  // Compact mode — shows a Chip trigger that opens a floating Paper
  if (compact) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Tooltip title="Open stopwatch">
          <Chip
            icon={<Timer fontSize="small" />}
            label={label}
            size="small"
            onClick={() => setFloatingOpen((v) => !v)}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              borderColor: floatingOpen ? theme.palette.primary.main : theme.palette.divider,
              color: floatingOpen ? theme.palette.primary.main : 'text.secondary',
              '&:hover': { borderColor: theme.palette.primary.main },
            }}
          />
        </Tooltip>
        <Collapse in={floatingOpen} unmountOnExit>
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 1300,
              p: 2.5,
              minWidth: 300,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Timer fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setFloatingOpen(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Stack>
            <StopwatchCore onStop={onStop} />
          </Paper>
        </Collapse>
      </Box>
    );
  }

  // Inline embedded mode
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
        <Timer fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
      </Stack>
      <StopwatchCore onStop={onStop} />
    </Paper>
  );
}
