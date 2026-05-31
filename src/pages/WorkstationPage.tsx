import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VoiceCardGrid from '../components/builtin/VoiceCardGrid';
import TextInputPanel from '../components/builtin/TextInputPanel';
import SegmentPreviewPanel from '../components/builtin/SegmentPreviewPanel';
import GenerationPanel from '../components/builtin/GenerationPanel';
import CloneMethodSelector from '../components/clone/CloneMethodSelector';
import CloneConfigPanel from '../components/clone/CloneConfigPanel';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useCloneVoiceStore } from '../store/cloneVoiceStore';
import { useBuiltinVoiceStore } from '../store/builtinVoiceStore';
import { CloneMethod } from '../types';

const stepLabels = ['选音色', '填文本', '检查分段', '生成导出'];

const WorkstationPage: React.FC = () => {
  const { mode } = useWorkspaceStore();
  const { config } = useCloneVoiceStore();
  const { selectedVoice, inputText, segments } = useBuiltinVoiceStore();

  const canGenerateClone =
    !!inputText.trim() &&
    ((config.method === CloneMethod.UPLOAD && !!config.audioBase64) ||
      (config.method === CloneMethod.DESCRIBE && !!config.voiceDescription?.trim()));

  const progress = [
    mode === 'clone' ? config.method === CloneMethod.UPLOAD ? !!config.audioBase64 : !!config.voiceDescription?.trim() : !!selectedVoice,
    !!inputText.trim(),
    segments.length > 0,
    mode === 'clone' ? canGenerateClone : !!selectedVoice && !!inputText.trim(),
  ];

  return (
    <Box className="max-w-[1560px] mx-auto">
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          p: 1.5,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {stepLabels.map((label, index) => (
            <Chip
              key={label}
              icon={
                progress[index] ? (
                  <CheckCircleIcon />
                ) : (
                  <RadioButtonUncheckedIcon />
                )
              }
              label={`${index + 1}. ${label}`}
              color={progress[index] ? 'primary' : 'default'}
              variant={progress[index] ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Paper>

      <Box className="workstation-grid">
        <Paper className="workstation-panel" elevation={0}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            {mode === 'clone' ? '克隆配置' : '音色配置'}
          </Typography>
          {mode === 'clone' ? (
            <Stack spacing={2}>
              <CloneMethodSelector />
              <CloneConfigPanel />
            </Stack>
          ) : (
            <VoiceCardGrid />
          )}
        </Paper>

        <Paper className="workstation-panel workstation-main" elevation={0}>
          <TextInputPanel />
          <SegmentPreviewPanel />
        </Paper>

        <Paper className="workstation-panel" elevation={0}>
          <GenerationPanel
            isCloneMode={mode === 'clone'}
            canGenerate={mode === 'clone' ? canGenerateClone : true}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default WorkstationPage;
