/**
 * 内置音色工作台页面
 * 上：音色选择 + 文本输入并排
 * 中：分段预览（跨整行）
 * 下：生成面板
 */

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import VoiceCardGrid from '../components/builtin/VoiceCardGrid';
import TextInputPanel from '../components/builtin/TextInputPanel';
import SegmentPreviewPanel from '../components/builtin/SegmentPreviewPanel';
import GenerationPanel from '../components/builtin/GenerationPanel';

const BuiltinVoicePage: React.FC = () => {
  return (
    <Box className="max-w-7xl mx-auto">
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
        🎤 内置音色工作台
      </Typography>

      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <VoiceCardGrid />
        <TextInputPanel />
      </Box>

      <SegmentPreviewPanel />

      <Divider sx={{ my: 3 }} />

      <GenerationPanel />
    </Box>
  );
};

export default BuiltinVoicePage;
