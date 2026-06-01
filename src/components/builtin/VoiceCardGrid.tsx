/**
 * 音色卡片网格组件
 * 展示所有内置音色的卡片列表，支持选择
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import VoiceCard from './VoiceCard';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';

/** 音色卡片网格组件 */
const VoiceCardGrid: React.FC = () => {
  const { voices, selectedVoice, selectVoice } = useBuiltinVoiceStore();

  const chineseVoices = voices.filter((v) => v.category === 'chinese');
  const englishVoices = voices.filter((v) => v.category === 'english');

  return (
    <Box>
      <Typography variant="subtitle2" sx={(theme) => ({ fontWeight: 700, mb: 1.5, color: theme.palette.text.primary })}>
        选择音色
      </Typography>

      {/* 中文音色 */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        中文音色
      </Typography>
      <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 mb-4">
        {chineseVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            selected={selectedVoice?.id === voice.id}
            onSelect={selectVoice}
          />
        ))}
      </Box>

      {/* 英文音色 */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        英文音色
      </Typography>
      <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2">
        {englishVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            selected={selectedVoice?.id === voice.id}
            onSelect={selectVoice}
          />
        ))}
      </Box>
    </Box>
  );
};

export default VoiceCardGrid;
