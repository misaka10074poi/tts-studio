/**
 * 克隆配置面板组件
 * 根据克隆方式显示不同的配置界面
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { CloneMethod } from '../../types';
import AudioUploadPanel from './AudioUploadPanel';
import VoiceDesignPanel from './VoiceDesignPanel';

/** 克隆配置面板组件 */
const CloneConfigPanel: React.FC = () => {
  const { config } = useCloneVoiceStore();

  return (
    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e8eaf0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {config.method === CloneMethod.UPLOAD ? '音频上传' : '音色描述'}
      </Typography>

      {config.method === CloneMethod.UPLOAD ? (
        <AudioUploadPanel />
      ) : (
        <VoiceDesignPanel />
      )}

    </Box>
  );
};

export default CloneConfigPanel;
