/**
 * 应用入口组件
 * 配置路由和全局 Provider
 */

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import WorkstationPage from './pages/WorkstationPage';

/** 应用主题配置 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"PingFang SC"',
      '"Microsoft YaHei"',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
});

/** App 根组件 */
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<WorkstationPage />} />
            <Route path="builtin" element={<WorkstationPage />} />
            <Route path="clone" element={<WorkstationPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
