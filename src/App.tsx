/**
 * 应用入口组件
 * 配置路由和全局 Provider
 */

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import BuiltinVoicePage from './pages/BuiltinVoicePage';
import CloneVoicePage from './pages/CloneVoicePage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6d28d9', light: '#8b5cf6', dark: '#5b21b6', contrastText: '#fff' },
    secondary: { main: '#db2777', light: '#ec4899', dark: '#be185d', contrastText: '#fff' },
    background: { default: '#fafafa', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    warning: { main: '#ea580c' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: [
      '"Inter"', '-apple-system', 'BlinkMacSystemFont',
      '"Segoe UI"', 'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif',
    ].join(','),
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.05)',
          '&:hover': {
            borderColor: '#c4b5fd',
            boxShadow: '0 10px 25px -5px rgba(109,40,217,0.15), 0 4px 10px -6px rgba(109,40,217,0.08)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 10,
          letterSpacing: '0.01em',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(109,40,217,0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(109,40,217,0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="builtin" element={<BuiltinVoicePage />} />
            <Route path="clone" element={<CloneVoicePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
