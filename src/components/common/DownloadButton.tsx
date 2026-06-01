/**
 * 打开输出目录按钮
 * Electron 环境下始终可用：有任务目录则打开任务目录，无则打开基础 output 目录
 */

import React from 'react';
import { Button } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import * as outputService from '../../services/outputService';

interface DownloadButtonProps {
  taskDir?: string | null;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ taskDir }) => {
  const hasElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const handleOpen = (): void => {
    // 有具体任务目录就打开任务目录，否则打开基础 output 目录
    outputService.openOutputDir(taskDir || undefined);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<FolderOpenIcon />}
      onClick={handleOpen}
      disabled={!hasElectron}
      sx={{ textTransform: 'none' }}
      title={!hasElectron ? '浏览器环境下无法打开本地目录' : '打开输出文件夹'}
    >
      打开输出目录
    </Button>
  );
};

export default DownloadButton;
