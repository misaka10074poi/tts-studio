/**
 * 打开输出目录按钮组件
 * 在 Electron 环境中打开文件管理器，浏览器环境降级为提示
 */

import React from 'react';
import { Button, Box } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import * as outputService from '../../services/outputService';

interface DownloadButtonProps {
  /** 输出任务目录路径 */
  taskDir?: string | null;
}

/** 打开输出目录按钮 */
const DownloadButton: React.FC<DownloadButtonProps> = ({ taskDir }) => {
  const hasElectron = typeof window !== 'undefined' && !!window.electronAPI;

  /** 打开输出目录 */
  const handleOpen = (): void => {
    if (taskDir) {
      outputService.openOutputDir(taskDir);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<FolderOpenIcon />}
        onClick={handleOpen}
        disabled={!taskDir}
        sx={{ textTransform: 'none' }}
        title={!hasElectron ? '浏览器环境下无法打开本地目录' : undefined}
      >
        打开输出目录
      </Button>
    </Box>
  );
};

export default DownloadButton;
