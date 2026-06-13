import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    lab: {
      main: string;
      light: string;
      dark: string;
    };
  }
  interface PaletteOptions {
    lab?: {
      main: string;
      light: string;
      dark: string;
    };
  }
}

export const LIMS_THEME = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F4C75',
      light: '#1B6CA8',
      dark: '#0A3254',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2E7D32',
      light: '#43A047',
      dark: '#1B5E20',
    },
    warning: {
      main: '#E65100',
      light: '#F57C00',
      dark: '#BF360C',
    },
    error: {
      main: '#C62828',
      light: '#E53935',
      dark: '#B71C1C',
    },
    info: {
      main: '#0277BD',
      light: '#0288D1',
      dark: '#01579B',
    },
    lab: {
      main: '#00695C',
      light: '#00897B',
      dark: '#004D40',
    },
    background: {
      default: '#F4F6F9',
      paper: '#FFFFFF',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    text: {
      primary: '#1A2332',
      secondary: '#4A5568',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
    overline: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.05)',
    '0px 1px 4px rgba(0,0,0,0.08)',
    '0px 2px 8px rgba(0,0,0,0.10)',
    '0px 4px 12px rgba(0,0,0,0.10)',
    '0px 6px 16px rgba(0,0,0,0.10)',
    '0px 8px 20px rgba(0,0,0,0.10)',
    '0px 10px 24px rgba(0,0,0,0.10)',
    '0px 12px 28px rgba(0,0,0,0.10)',
    '0px 14px 32px rgba(0,0,0,0.12)',
    '0px 16px 36px rgba(0,0,0,0.12)',
    '0px 18px 40px rgba(0,0,0,0.12)',
    '0px 20px 44px rgba(0,0,0,0.12)',
    '0px 22px 48px rgba(0,0,0,0.14)',
    '0px 24px 52px rgba(0,0,0,0.14)',
    '0px 26px 56px rgba(0,0,0,0.14)',
    '0px 28px 60px rgba(0,0,0,0.14)',
    '0px 30px 64px rgba(0,0,0,0.16)',
    '0px 32px 68px rgba(0,0,0,0.16)',
    '0px 34px 72px rgba(0,0,0,0.16)',
    '0px 36px 76px rgba(0,0,0,0.18)',
    '0px 38px 80px rgba(0,0,0,0.18)',
    '0px 40px 84px rgba(0,0,0,0.18)',
    '0px 42px 88px rgba(0,0,0,0.20)',
    '0px 44px 92px rgba(0,0,0,0.20)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 transparent',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: 3,
            '&:hover': { background: '#A0AEC0' },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        sizeSmall: { padding: '5px 14px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '11px 28px', fontSize: '1rem' },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(15,76,117,0.3)',
          '&:hover': { boxShadow: '0 4px 12px rgba(15,76,117,0.4)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid rgba(226,232,240,0.8)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid rgba(226,232,240,0.8)' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#4A5568',
            backgroundColor: '#F8FAFC',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: alpha('#0F4C75', 0.04) },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem', borderRadius: 6 },
        sizeSmall: { height: 22, fontSize: '0.6875rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#0F4C75' },
            '&.Mui-focused fieldset': { borderColor: '#0F4C75', borderWidth: 2 },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem', paddingBottom: 8 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 8px',
          padding: '8px 12px',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: alpha('#0F4C75', 0.12),
            '&:hover': { backgroundColor: alpha('#0F4C75', 0.16) },
          },
          '&:hover': { backgroundColor: alpha('#0F4C75', 0.06) },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: '0.6875rem' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A2332',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '6px 10px',
        },
      },
    },
  },
});
