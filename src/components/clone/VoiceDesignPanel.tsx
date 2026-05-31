/**
 * 音色设计面板组件
 * 通过文字描述来设计音色
 */

import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';

/** 音色设计面板组件 */
const VoiceDesignPanel: React.FC = () => {
  const { config, setVoiceDescription } = useCloneVoiceStore();

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        用文字描述你想要的音色特征
      </Typography>
      <TextField
        multiline
        rows={3}
        value={config.voiceDescription || ''}
        onChange={(e) => setVoiceDescription(e.target.value)}
        placeholder="例如：温柔的女声，略带沙哑，语速较慢，适合讲故事"
        fullWidth
        variant="outlined"
        helperText="描述越详细，生成的音色越接近预期"
      />
    </Box>
  );
};

export default VoiceDesignPanel;
