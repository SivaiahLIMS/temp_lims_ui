import React from 'react';
import {
  Box, Typography, Stack, Button, Divider, Chip, Link as MuiLink,
  alpha, useTheme, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Shield, ExpandMore, Article, Security, Person, Storage,
  Email, Phone, Language, CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NAV_BG = '#0A1A3F';
const TEAL = '#00C2A8';

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: NAV_BG }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function PrivacyPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const sections = [
    {
      title: '1. Information We Collect',
      body: 'Sivaya LIMS collects personal information you provide when registering an account, including your name, email address, organization, and role. We also collect usage data, log files, and device/browser information to maintain and improve service quality.',
    },
    {
      title: '2. How We Use Your Information',
      body: 'We use your information to provide and operate the LIMS platform, authenticate your identity, send service notifications, enforce our Terms of Service, and comply with regulatory and legal obligations (including 21 CFR Part 11 and EU GMP Annex 11).',
    },
    {
      title: '3. Data Retention',
      body: 'Laboratory data and audit logs are retained per your organization\'s data retention policy, subject to applicable regulatory requirements. Account data is retained for the duration of your subscription plus a 90-day grace period.',
    },
    {
      title: '4. Data Security',
      body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access is controlled by role-based permissions and multi-factor authentication. Our infrastructure is hosted on Google Cloud Platform with SOC 2 Type II certification.',
    },
    {
      title: '5. Data Sharing',
      body: 'We do not sell your data. We may share data with service providers (cloud infrastructure, analytics) under strict data processing agreements. We disclose data when required by law or to protect the safety and rights of our users.',
    },
    {
      title: '6. Your Rights',
      body: 'You may request access to, correction of, or deletion of your personal data by contacting privacy@sivaya.com. Users in the EU/EEA have rights under the GDPR including data portability and the right to lodge a complaint with a supervisory authority.',
    },
    {
      title: '7. Cookies',
      body: 'Sivaya LIMS uses session cookies for authentication and functional cookies to remember user preferences. We do not use third-party advertising cookies. You may disable cookies in your browser settings, but this may affect functionality.',
    },
    {
      title: '8. Contact',
      body: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@sivaya.com or at Sivaya Laboratories Pvt. Ltd., Hyderabad, Telangana, India.',
    },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(TEAL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield sx={{ color: TEAL, fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: NAV_BG }}>Privacy Policy</Typography>
          <Typography variant="body2" color="text.secondary">Effective Date: 1 January 2026 · Sivaya LIMS Platform</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box sx={{
        p: 2.5, mb: 4, borderRadius: 2,
        bgcolor: alpha(TEAL, 0.06),
        border: `1px solid ${alpha(TEAL, 0.2)}`,
      }}>
        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
          Sivaya Laboratories Pvt. Ltd. ("Sivaya", "we", "our") operates the Sivaya LIMS platform. This Privacy Policy explains
          how we collect, use, and protect your information. By using Sivaya LIMS, you agree to the practices described here.
        </Typography>
      </Box>

      {sections.map((s) => (
        <PolicySection key={s.title} title={s.title}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{s.body}</Typography>
        </PolicySection>
      ))}

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.disabled">Last updated: 1 January 2026</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
      </Stack>
    </Box>
  );
}

export function TermsPage() {
  const navigate = useNavigate();

  const clauses = [
    { q: '1. Acceptance of Terms', a: 'By accessing or using Sivaya LIMS, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the platform.' },
    { q: '2. Permitted Use', a: 'Sivaya LIMS is licensed, not sold, for use by authorized personnel of subscribing organizations. You may not sub-license, resell, or use the platform to process data on behalf of third parties without written consent.' },
    { q: '3. User Accounts', a: 'You are responsible for maintaining the confidentiality of your credentials. All actions taken under your account are your responsibility. Notify support@sivaya.com immediately of any unauthorized access.' },
    { q: '4. Data Ownership', a: 'All laboratory data entered into Sivaya LIMS remains the property of the subscribing organization. Sivaya may access data only to provide support or as required by law.' },
    { q: '5. Regulatory Compliance', a: 'You are solely responsible for ensuring your use of Sivaya LIMS complies with applicable regulations (FDA 21 CFR Part 11, EU Annex 11, ISO/IEC 17025, etc.). Sivaya provides audit-trail and electronic-signature tools to assist compliance, but does not guarantee regulatory approval.' },
    { q: '6. Intellectual Property', a: 'All software, designs, algorithms, and documentation within Sivaya LIMS are the intellectual property of Sivaya Laboratories Pvt. Ltd. Unauthorized copying, modification, or reverse engineering is prohibited.' },
    { q: '7. Service Availability', a: 'Sivaya targets 99.5% monthly uptime. Planned maintenance windows are announced 48 hours in advance. We are not liable for downtime caused by force majeure, third-party infrastructure, or misuse.' },
    { q: '8. Limitation of Liability', a: 'To the maximum extent permitted by law, Sivaya\'s liability is limited to the fees paid by you in the 3 months preceding the claim. Sivaya is not liable for indirect, incidental, or consequential damages.' },
    { q: '9. Termination', a: 'Either party may terminate this agreement with 30 days written notice. Upon termination, you may export your data in a standard format. Sivaya will delete your data within 90 days of termination.' },
    { q: '10. Governing Law', a: 'These Terms are governed by the laws of Telangana, India. Disputes shall be resolved by arbitration in Hyderabad, India under the Arbitration and Conciliation Act, 1996.' },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha('#0A1A3F', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Article sx={{ color: NAV_BG, fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: NAV_BG }}>Terms of Service</Typography>
          <Typography variant="body2" color="text.secondary">Effective Date: 1 January 2026 · Sivaya LIMS Platform</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {clauses.map((c) => (
        <Accordion key={c.q} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="body2" fontWeight={700} sx={{ color: NAV_BG }}>{c.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{c.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.disabled">Last updated: 1 January 2026</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
      </Stack>
    </Box>
  );
}

export function SupportPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const topics = [
    { icon: <Person />, title: 'Account & Access', desc: 'Reset passwords, manage user roles, request new accounts, or unlock locked accounts.', tag: 'Identity & Auth' },
    { icon: <Security />, title: 'Permissions & Roles', desc: 'Troubleshoot access denied errors, assign or revoke permissions, configure role hierarchies.', tag: 'Admin' },
    { icon: <Storage />, title: 'Data & Integrations', desc: 'Import/export data, configure instrument integrations, set up ELN connectors.', tag: 'Data' },
    { icon: <Shield />, title: 'Compliance & Audit', desc: 'Audit trail queries, electronic signature setup, 21 CFR Part 11 & Annex 11 guidance.', tag: 'Regulatory' },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Email sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: NAV_BG }}>Support Center</Typography>
          <Typography variant="body2" color="text.secondary">Get help with Sivaya LIMS · Typical response within 4 business hours</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Contact cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        {[
          { icon: <Email sx={{ color: TEAL }} />, label: 'Email Support', value: 'support@sivaya.com', note: 'Mon – Sat, 9 AM – 7 PM IST' },
          { icon: <Phone sx={{ color: TEAL }} />, label: 'Phone / WhatsApp', value: '+91 40 6800 1234', note: 'Emergency: available 24 / 7' },
          { icon: <Language sx={{ color: TEAL }} />, label: 'Help Portal', value: 'help.sivaya.com', note: 'Knowledge base & tickets' },
        ].map((c) => (
          <Box key={c.label} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              {c.icon}
              <Typography variant="body2" fontWeight={700}>{c.label}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 600, color: NAV_BG }}>{c.value}</Typography>
            <Typography variant="caption" color="text.secondary">{c.note}</Typography>
          </Box>
        ))}
      </Box>

      {/* Topic areas */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: NAV_BG }}>Common Support Topics</Typography>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {topics.map((t) => (
          <Box key={t.title} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ color: TEAL, mt: 0.25, flexShrink: 0 }}>{t.icon}</Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                <Typography variant="body2" fontWeight={700}>{t.title}</Typography>
                <Chip label={t.tag} size="small" sx={{ height: 18, fontSize: 10, bgcolor: alpha(TEAL, 0.1), color: NAV_BG }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">{t.desc}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      {/* SLA */}
      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(NAV_BG, 0.04), border: `1px solid ${alpha(NAV_BG, 0.1)}` }}>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: NAV_BG }}>Service Level Agreement</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1.5 }}>
          {[
            { label: 'Critical (production down)', sla: '< 2 hours' },
            { label: 'High (major feature broken)', sla: '< 8 hours' },
            { label: 'Medium (workflow impact)', sla: '< 24 hours' },
            { label: 'Low (cosmetic / question)', sla: '< 72 hours' },
          ].map((s) => (
            <Stack key={s.label} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircle sx={{ fontSize: 16, color: TEAL, mt: 0.2 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="body2" fontWeight={700}>{s.sla}</Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.disabled">Sivaya Laboratories Pvt. Ltd., Hyderabad, India</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
      </Stack>
    </Box>
  );
}

export function ApiDocsPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const endpoints = [
    { method: 'POST', path: '/auth/login', desc: 'Authenticate user, returns access + refresh tokens.' },
    { method: 'POST', path: '/auth/refresh', desc: 'Exchange refresh token for new access token.' },
    { method: 'GET', path: '/products', desc: 'List all products for the current branch.' },
    { method: 'POST', path: '/products', desc: 'Create a new product specification.' },
    { method: 'GET', path: '/samples', desc: 'List samples with optional status and date filters.' },
    { method: 'POST', path: '/samples', desc: 'Register a new sample.' },
    { method: 'GET', path: '/worksheets', desc: 'List worksheets; filterable by status and assignee.' },
    { method: 'POST', path: '/worksheets', desc: 'Create a new worksheet.' },
    { method: 'PATCH', path: '/worksheets/:id/submit', desc: 'Submit a worksheet for review.' },
    { method: 'PATCH', path: '/worksheets/:id/approve', desc: 'Approve a submitted worksheet (reviewer role required).' },
    { method: 'GET', path: '/instruments', desc: 'List all instruments and their calibration status.' },
    { method: 'GET', path: '/chemicals', desc: 'List chemicals with stock levels and expiry dates.' },
    { method: 'GET', path: '/qa/deviations', desc: 'List deviations; filterable by severity and status.' },
    { method: 'GET', path: '/analytics/samples/inflow', desc: 'Sample registration vs. completion trend data.' },
    { method: 'GET', path: '/ai/workload', desc: 'AI-predicted analyst workload for the next 14 days.' },
    { method: 'GET', path: '/audit-logs', desc: 'Paginated audit trail; filterable by user, action, date.' },
  ];

  const methodColor: Record<string, string> = {
    GET: '#4CAF50',
    POST: '#0277BD',
    PATCH: '#FF9800',
    PUT: '#9C27B0',
    DELETE: '#F44336',
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha('#0277BD', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Language sx={{ color: '#0277BD', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: NAV_BG }}>API Documentation</Typography>
          <Typography variant="body2" color="text.secondary">Sivaya LIMS REST API v1 · Base URL: /api/v1</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Auth */}
      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha('#0277BD', 0.04), border: `1px solid ${alpha('#0277BD', 0.15)}`, mb: 4 }}>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5, color: NAV_BG }}>Authentication</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          All endpoints (except <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>/auth/login</code> and <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>/auth/refresh</code>) require a
          Bearer token in the <strong>Authorization</strong> header. Branch-scoped endpoints additionally require the
          <strong> X-Branch-Id</strong> header containing the integer branch ID.
        </Typography>
        <Box
          component="pre"
          sx={{
            mt: 1.5, p: 1.5, borderRadius: 1.5,
            bgcolor: NAV_BG, color: '#A8DADC',
            fontSize: 12, overflow: 'auto',
            fontFamily: 'monospace', lineHeight: 1.6,
          }}
        >
          {`Authorization: Bearer <access_token>\nX-Branch-Id: 1\nContent-Type: application/json`}
        </Box>
      </Box>

      {/* Endpoints table */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: NAV_BG }}>Endpoint Reference</Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {endpoints.map((ep, i) => (
          <Box
            key={ep.path + ep.method}
            sx={{
              display: 'grid',
              gridTemplateColumns: '80px 280px 1fr',
              alignItems: 'center',
              gap: 2,
              px: 2.5, py: 1.5,
              bgcolor: i % 2 === 0 ? 'background.paper' : alpha(NAV_BG, 0.02),
              borderTop: i > 0 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Chip
              label={ep.method}
              size="small"
              sx={{
                bgcolor: alpha(methodColor[ep.method] ?? '#888', 0.12),
                color: methodColor[ep.method] ?? '#888',
                fontWeight: 700, fontSize: 11, height: 22,
                width: 64, justifyContent: 'center',
              }}
            />
            <Typography sx={{ fontFamily: 'monospace', fontSize: 12.5, color: NAV_BG, fontWeight: 600 }}>
              {ep.path}
            </Typography>
            <Typography variant="body2" color="text.secondary">{ep.desc}</Typography>
          </Box>
        ))}
      </Box>

      {/* Rate limiting */}
      <Box sx={{ mt: 4, p: 2.5, borderRadius: 2, bgcolor: alpha('#FF9800', 0.04), border: `1px solid ${alpha('#FF9800', 0.2)}` }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: NAV_BG, mb: 0.5 }}>Rate Limiting</Typography>
        <Typography variant="body2" color="text.secondary">
          Default rate limit is <strong>300 requests / minute</strong> per user token. Bulk import endpoints are limited to <strong>10 requests / minute</strong>.
          Rate limit headers (<code style={{ background: '#f5f5f5', padding: '2px 5px', borderRadius: 3 }}>X-RateLimit-Remaining</code>, <code style={{ background: '#f5f5f5', padding: '2px 5px', borderRadius: 3 }}>X-RateLimit-Reset</code>) are included in every response.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.disabled">Sivaya LIMS API v1.0 · © 2026 Sivaya Laboratories Pvt. Ltd.</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
      </Stack>
    </Box>
  );
}
