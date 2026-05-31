/**
 * 克隆方式选择器组件
 * 切换上传音频 / 文字描述两种克隆方式
 */

import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { CloneMethod } from '../../types';

/** 克隆方式选择器组件 */
const CloneMethodSelector: React.FC = () => {
  const { config, setMethod } = useCloneVoiceStore();

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        选择克隆方式
      </Typography>
      <ToggleButtonGroup
        value={config.method}
        exclusive
        onChange={(_, value) => {
          if (value !== null) {
            setMethod(value as CloneMethod);
          }
        }}
        sx={{ gap: 1 }}
      >
        <ToggleButton
          value={CloneMethod.UPLOAD}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            '&.Mui-selected': {
              backgroundColor: '#6366F1',
              color: 'white',
              '&:hover': { backgroundColor: '#4F46E5' },
            },
          }}
        >
          <UploadFileIcon sx={{ mr: 1 }} />
          上传音频
        </ToggleButton>
        <ToggleButton
          value={CloneMethod.DESCRIBE}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            '&.Mui-selected': {
              backgroundColor: '#8B5CF6',
              color: 'white',
              '&:hover': { backgroundColor: '#7C3AED' },
            },
          }}
        >
          <TextFieldsIcon sx={{ mr: 1 }} />
          文字描述
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default CloneMethodSelector;
