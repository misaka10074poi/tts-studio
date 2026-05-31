/**
 * 应用布局组件
 * 提供顶栏导航、项目历史和内容区域的整体布局
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import MicIcon from '@mui/icons-material/Mic';
import ApiConfigDialog from './ApiConfigDialog';
import ProjectDrawer from './ProjectDrawer';
import StatusBar from './StatusBar';
import { useWorkspaceStore, WorkspaceMode } from '../../store/workspaceStore';

/** 应用布局组件 */
const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode } = useWorkspaceStore();
  const [configOpen, setConfigOpen] = React.useState(false);
  const [projectOpen, setProjectOpen] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname.includes('clone')) {
      setMode('clone');
    } else if (location.pathname.includes('builtin')) {
      setMode('builtin');
    }
  }, [location.pathname, setMode]);

  const handleModeChange = (_: React.SyntheticEvent, value: WorkspaceMode): void => {
    setMode(value);
    navigate(value === 'clone' ? '/clone' : '/builtin');
  };

  return (
    <Box className="min-h-screen flex flex-col" sx={{ backgroundColor: '#f6f7fb' }}>
      {/* 顶栏 */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          color: '#111827',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Toolbar className="flex justify-between gap-4" sx={{ minHeight: 54 }}>
          <Box className="flex items-center gap-3 min-w-0">
            <MicIcon sx={{ color: '#4f46e5' }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              配音工作室
            </Typography>
          </Box>
          <Box className="flex items-center gap-1">
            <IconButton
              onClick={() => setProjectOpen(true)}
              title="历史任务"
            >
              <HistoryIcon />
            </IconButton>
            <IconButton
              onClick={() => setConfigOpen(true)}
              title="API 配置"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
        <Box sx={{ px: 2, borderTop: '1px solid #f3f4f6' }}>
          <Tabs
            value={mode}
            onChange={handleModeChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab value="builtin" label="内置音色" />
            <Tab value="clone" label="声音克隆" />
          </Tabs>
        </Box>
      </AppBar>

      {/* 内容区域 */}
      <Box className="flex-1 p-3 md:p-4">
        <Outlet />
      </Box>

      {/* 底部状态栏 */}
      <StatusBar />

      {/* API 配置弹窗 */}
      <ApiConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />

      {/* 项目历史抽屉 */}
      <ProjectDrawer
        open={projectOpen}
        onClose={() => setProjectOpen(false)}
      />
    </Box>
  );
};

export default AppLayout;
