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
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#fff' },
    secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', contrastText: '#fff' },
    background: { default: '#f8f9fb', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7280' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    divider: '#e8eaf0',
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
      'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif',
    ].join(','),
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e8eaf0',
          borderRadius: 12,
          boxShadow: 'none',
          '&:hover': { borderColor: '#d1d5db' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 1px 3px rgba(99,102,241,0.3)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } },
      },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: { '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(99,102,241,0.12)' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
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
