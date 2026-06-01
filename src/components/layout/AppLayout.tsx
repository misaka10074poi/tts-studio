/**
 * 应用布局组件
 * 提供顶栏导航、项目历史和内容区域的整体布局
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Tabs, Tab, Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import MicIcon from '@mui/icons-material/Mic';
import ApiConfigDialog from './ApiConfigDialog';
import ProjectDrawer from './ProjectDrawer';
import StatusBar from './StatusBar';
import { useApiConfigStore } from '../../store/apiConfigStore';

/** 诊断横幅：显示 Electron 状态、输出路径、API 配置 */
const DiagBanner: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  const { config } = useApiConfigStore();
  const [appPath, setAppPath] = useState('检测中...');

  useEffect(() => {
    if (isElectron) {
      (window as any).electronAPI.getAppPath().then(setAppPath).catch(() => setAppPath('获取失败'));
    } else {
      setAppPath('浏览器模式（文件输出不可用）');
    }
  }, [isElectron]);

  const hasKey = !!(config.apiKey && config.apiKey.trim());
  const outputDir = config.outputDir || './output';

  return (
    <Alert
      severity={isElectron && hasKey ? 'success' : 'warning'}
      sx={{ borderRadius: 0, '& .MuiAlert-message': { flex: 1 } }}
    >
      <Box sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
        <strong>{isElectron ? '🟢 ELECTRON 模式' : '🔴 浏览器模式'}</strong>
        {' | '}输出根目录: <code>{appPath}</code>
        {' | '}子目录: <code>{outputDir}</code>
        {' | '}API Key: <strong>{hasKey ? '✅ 已配置' : '❌ 未配置（请点右上角⚙️设置）'}</strong>
        {!isElectron && ' | ⚠️ 文件输出不可用'}
      </Box>
    </Alert>
  );
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [configOpen, setConfigOpen] = React.useState(false);
  const [projectOpen, setProjectOpen] = React.useState(false);

  const currentMode: 'builtin' | 'clone' =
    location.pathname.includes('clone') ? 'clone' : 'builtin';

  const handleTabChange = (_: React.SyntheticEvent, value: string): void => {
    navigate(value === 'clone' ? '/clone' : '/builtin');
  };

  return (
    <Box className="min-h-screen flex flex-col" sx={{ backgroundColor: '#f8f9fb' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={(theme) => ({ backgroundColor: '#ffffff', color: theme.palette.text.primary, borderBottom: '1px solid #e8eaf0' })}
      >
        <Toolbar className="flex justify-between gap-4" sx={{ minHeight: 54 }}>
          <Box className="flex items-center gap-3 min-w-0">
            <MicIcon sx={{ color: '#4f46e5' }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              配音工作室
            </Typography>
          </Box>
          <Box className="flex items-center gap-1">
            <IconButton onClick={() => setProjectOpen(true)} title="历史任务">
              <HistoryIcon />
            </IconButton>
            <IconButton onClick={() => setConfigOpen(true)} title="API 配置">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
        <Box sx={{ px: 2, borderTop: '1px solid #f3f4f6' }}>
          <Tabs
            value={currentMode}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab value="builtin" label="内置音色" />
            <Tab value="clone" label="声音克隆" />
          </Tabs>
        </Box>
      </AppBar>

      <DiagBanner />
      <Box className="flex-1 p-3 md:p-4">
        <Outlet />
      </Box>

      <StatusBar mode={currentMode} />

      <ApiConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />

      <ProjectDrawer open={projectOpen} onClose={() => setProjectOpen(false)} />
    </Box>
  );
};

export default AppLayout;
