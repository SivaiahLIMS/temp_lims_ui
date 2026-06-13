import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Switch, Divider,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Button, Alert, CircularProgress, alpha, useTheme, Grid, Chip,
} from '@mui/material';
import {
  Notifications, Language, Palette, Security, Save,
  NotificationsActive, Email, Sms,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

interface NotifSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  worksheetAlerts: boolean;
  sampleAlerts: boolean;
  calibrationAlerts: boolean;
  deviationAlerts: boolean;
  digestFrequency: string;
}

const DEFAULT_NOTIF: NotifSettings = {
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  worksheetAlerts: true,
  sampleAlerts: true,
  calibrationAlerts: true,
  deviationAlerts: true,
  digestFrequency: 'DAILY',
};

export default function SettingsPage() {
  const theme = useTheme();
  const { user } = useAuthStore();

  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_NOTIF);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [saved, setSaved] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['notif-settings'],
    queryFn: notificationsApi.getSettings,
    retry: false,
    select: (data: any) => {
      if (data && typeof data === 'object') {
        setNotif((prev) => ({ ...prev, ...data }));
      }
      return data;
    },
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggle = (key: keyof NotifSettings) =>
    setNotif((p) => ({ ...p, [key]: !p[key] }));

  const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ color: 'primary.main', mt: 0.25 }}>{icon}</Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="h5" fontWeight={700}>Settings</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Save fontSize="small" />}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your notification preferences, display settings, and account options.
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully.</Alert>
      )}

      <Stack spacing={3}>
        {/* Notification Settings */}
        <SectionCard
          icon={<Notifications />}
          title="Notification Preferences"
          subtitle="Control how and when you receive alerts"
        >
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              Channels
            </Typography>
            <Stack spacing={0.5}>
              {[
                { key: 'inAppEnabled' as const, label: 'In-App Notifications', icon: <NotificationsActive fontSize="small" />, desc: 'Show alerts inside the LIMS application' },
                { key: 'emailEnabled' as const, label: 'Email Notifications', icon: <Email fontSize="small" />, desc: 'Send alerts to your registered email address' },
                { key: 'smsEnabled' as const, label: 'SMS Notifications', icon: <Sms fontSize="small" />, desc: 'Text message alerts (requires phone number)' },
              ].map(({ key, label, icon, desc }) => (
                <Stack key={key} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ px: 2, py: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ color: notif[key] ? 'primary.main' : 'text.disabled' }}>{icon}</Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{desc}</Typography>
                    </Box>
                  </Stack>
                  <Switch checked={notif[key] as boolean} onChange={() => toggle(key)} size="small" />
                </Stack>
              ))}
            </Stack>

            <Divider />

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              Alert Types
            </Typography>
            <Grid container spacing={1}>
              {[
                { key: 'worksheetAlerts' as const, label: 'Worksheets' },
                { key: 'sampleAlerts' as const, label: 'Samples' },
                { key: 'calibrationAlerts' as const, label: 'Calibrations' },
                { key: 'deviationAlerts' as const, label: 'Deviations / CAPA' },
              ].map(({ key, label }) => (
                <Grid item xs={12} sm={6} key={key}>
                  <FormControlLabel
                    control={<Switch checked={notif[key] as boolean} onChange={() => toggle(key)} size="small" />}
                    label={<Typography variant="body2">{label}</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Grid>
              ))}
            </Grid>

            <FormControl size="small" sx={{ maxWidth: 240 }}>
              <InputLabel>Digest Frequency</InputLabel>
              <Select
                value={notif.digestFrequency}
                label="Digest Frequency"
                onChange={(e) => setNotif((p) => ({ ...p, digestFrequency: e.target.value }))}
              >
                <MenuItem value="REALTIME">Real-time</MenuItem>
                <MenuItem value="HOURLY">Hourly digest</MenuItem>
                <MenuItem value="DAILY">Daily digest</MenuItem>
                <MenuItem value="WEEKLY">Weekly digest</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SectionCard>

        {/* Display Settings */}
        <SectionCard
          icon={<Language />}
          title="Language & Regional"
          subtitle="Configure locale, timezone, and date format"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Language</InputLabel>
                <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                  <MenuItem value="en">English (US)</MenuItem>
                  <MenuItem value="en-gb">English (UK)</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select value={timezone} label="Timezone" onChange={(e) => setTimezone(e.target.value)}>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                  <MenuItem value="Europe/London">London (GMT)</MenuItem>
                  <MenuItem value="Asia/Kolkata">India (IST)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Japan (JST)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select value={dateFormat} label="Date Format" onChange={(e) => setDateFormat(e.target.value)}>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Security */}
        <SectionCard
          icon={<Security />}
          title="Security"
          subtitle="Session and security preferences"
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, py: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Session Timeout</Typography>
                <Typography variant="caption" color="text.secondary">Automatically sign out after inactivity</Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select defaultValue="30">
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="60">1 hour</MenuItem>
                  <MenuItem value="240">4 hours</MenuItem>
                  <MenuItem value="0">Never</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, py: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Two-Factor Authentication</Typography>
                <Typography variant="caption" color="text.secondary">Add an extra layer of security to your account</Typography>
              </Box>
              <Chip label="Not configured" size="small" variant="outlined" color="warning" />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, py: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Active Sessions</Typography>
                <Typography variant="caption" color="text.secondary">Manage devices where you are signed in</Typography>
              </Box>
              <Chip label="1 active" size="small" color="success" />
            </Stack>
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
}
