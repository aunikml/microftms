import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // light mode colors
          primary: {
            main: '#4f46e5', // Indigo 600
            light: '#6366f1',
            dark: '#4338ca',
          },
          secondary: {
            main: '#06b6d4', // Cyan 500
            light: '#22d3ee',
            dark: '#0891b2',
          },
          background: {
            default: '#f8fafc', // Slate 50
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a', // Slate 900
            secondary: '#475569', // Slate 600
          },
        }
      : {
          // dark mode colors
          primary: {
            main: '#6366f1', // Indigo 500
            light: '#818cf8',
            dark: '#4f46e5',
          },
          secondary: {
            main: '#22d3ee', // Cyan 400
            light: '#67e8f9',
            dark: '#0891b2',
          },
          background: {
            default: '#0f172a', // Slate 900
            paper: '#1e293b', // Slate 800
          },
          text: {
            primary: '#f8fafc', // Slate 50
            secondary: '#94a3b8', // Slate 400
          },
        }),
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' 
            ? '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
        },
      },
    },
  },
});

export const themeConfig = (mode) => createTheme(getDesignTokens(mode));
