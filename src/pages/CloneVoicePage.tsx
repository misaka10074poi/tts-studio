/**
 * 声音克隆工作台页面
 * 克隆配置 → 文本输入 → 生成队列
 */

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import CloneMethodSelector from '../components/clone/CloneMethodSelector';
import CloneConfigPanel from '../components/clone/CloneConfigPanel';
import TextInputPanel from '../components/builtin/TextInputPanel';
import GenerationPanel from '../components/builtin/GenerationPanel';
import { useCloneVoiceStore } from '../store/cloneVoiceStore';
import { useBuiltinVoiceStore } from '../store/builtinVoiceStore';
import { CloneMethod } from '../types';

const CloneVoicePage: React.FC = () => {
  const { config } = useCloneVoiceStore();
  const { inputText } = useBuiltinVoiceStore();

  const canGenerate = (): boolean => {
    if (!inputText.trim()) return false;
    if (config.method === CloneMethod.UPLOAD && !config.audioBase64) return false;
    if (config.method === CloneMethod.DESCRIBE && !config.voiceDescription?.trim()) return false;
    return true;
  };

  return (
    <Box className="max-w-7xl mx-auto">
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a1a2e' }}>
        🧬 声音克隆工作台
      </Typography>

      <CloneMethodSelector />
      <CloneConfigPanel />

      <Divider sx={{ my: 3 }} />

      <TextInputPanel mode="clone" />

      <Divider sx={{ my: 3 }} />

      <GenerationPanel isCloneMode canGenerate={canGenerate()} />
    </Box>
  );
};

export default CloneVoicePage;
