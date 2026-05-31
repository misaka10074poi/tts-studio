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
    primary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    secondary: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
      'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif',
    ].join(','),
  },
  shape: { borderRadius: 12 },
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
