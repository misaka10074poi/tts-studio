/**
 * 底部状态栏组件
 * 显示当前音色、字数、段数和输出目录信息
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import NotesIcon from '@mui/icons-material/Notes';
import ViewListIcon from '@mui/icons-material/ViewList';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { CloneMethod } from '../../types';

const StatusBar: React.FC<{ mode?: 'builtin' | 'clone' }> = ({ mode = 'builtin' }) => {
  const { selectedVoice, inputText, segments } = useBuiltinVoiceStore();
  const { config } = useApiConfigStore();
  const { config: cloneConfig } = useCloneVoiceStore();

  const modeLabel = mode === 'clone' ? '声音克隆' : '内置音色';
  const voiceName =
    mode === 'clone'
      ? cloneConfig.method === CloneMethod.UPLOAD
        ? cloneConfig.audioFileName || '未上传样本'
        : cloneConfig.voiceDescription?.trim()
          ? '文字描述已填写'
          : '未填写描述'
      : selectedVoice?.nameZh || '未选择音色';
  const chars = inputText.length;
  const segmentCount = segments.length;
  const outputDir = config.outputDir || '未设置';
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  return (
    <Box
      className="flex items-center gap-4 px-4 h-8 flex-shrink-0 overflow-hidden"
      sx={{ backgroundColor: '#ffffff', borderTop: '1px solid #e8eaf0', fontSize: '0.75rem', color: '#6b7280' }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <GraphicEqIcon sx={{ fontSize: 14 }} /> {modeLabel}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }} className="truncate">
        {voiceName}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <NotesIcon sx={{ fontSize: 14 }} /> {chars}字
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <ViewListIcon sx={{ fontSize: 14 }} /> {segmentCount}段
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }} className="truncate">
        <FolderOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} /> {outputDir}
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Typography variant="caption" sx={{ 
        color: isElectron ? '#16a34a' : '#dc2626', 
        fontWeight: 700, 
        fontSize: '0.7rem',
        flexShrink: 0,
      }}>
        {isElectron ? '● ELECTRON' : '● BROWSER'}
      </Typography>
    </Box>
  );
};

export default StatusBar;
