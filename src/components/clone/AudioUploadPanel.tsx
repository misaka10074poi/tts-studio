/**
 * 音频上传面板组件
 * 支持上传音频文件用于声音克隆
 */

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { readFileAsDataURL, readFileAsBase64, formatFileSize } from '../../services/fileHelper';
import { DEFAULTS } from '../../utils/constants';

/** 音频上传面板组件 */
const AudioUploadPanel: React.FC = () => {
  const { config, setAudioData } = useCloneVoiceStore();
  const [error, setError] = React.useState('');
  const [fileName, setFileName] = React.useState(config.audioFileName || '');
  const [fileSize, setFileSize] = React.useState(0);

  /** 处理文件选择 */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // 检查文件大小
    if (file.size > DEFAULTS.MAX_CLONE_AUDIO_SIZE) {
      setError(`文件过大，最大支持 ${formatFileSize(DEFAULTS.MAX_CLONE_AUDIO_SIZE)}`);
      return;
    }

    // 检查文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm)$/i)) {
      setError('请上传 MP3、WAV、OGG 或 WebM 格式的音频文件');
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      const base64 = await readFileAsBase64(file);
      const arrayBuffer = await file.arrayBuffer();

      setAudioData(base64, file.name, arrayBuffer);
      setFileName(file.name);
      setFileSize(file.size);
    } catch (err) {
      setError('文件读取失败，请重试');
    }

    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  /** 清除已上传文件 */
  const handleClear = (): void => {
    setAudioData('', '', new ArrayBuffer(0));
    setFileName('');
    setFileSize(0);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        上传 5-30 秒的音频样本，系统将克隆该音色
      </Typography>

      {!config.audioBase64 ? (
        <Box>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: 'none' }}
          >
            选择音频文件
            <input
              type="file"
              hidden
              accept="audio/*,.mp3,.wav,.ogg,.webm"
              onChange={handleFileSelect}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            支持 MP3、WAV、OGG、WebM，最大 10MB
          </Typography>
        </Box>
      ) : (
        <Box className="flex items-center gap-2">
          <Chip
            label={`${fileName} (${formatFileSize(fileSize)})`}
            color="primary"
            variant="outlined"
          />
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClear}
            sx={{ textTransform: 'none' }}
          >
            移除
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default AudioUploadPanel;
