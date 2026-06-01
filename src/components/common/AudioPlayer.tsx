/**
 * 音频播放器组件
 * 支持播放 Base64 编码的音频数据
 */

import React from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { AudioFormat } from '../../types';

interface AudioPlayerProps {
  /** Base64 编码的音频数据 */
  audioBase64?: string;
  /** 音频格式 */
  format?: AudioFormat;
  /** 段落标签 */
  label?: string;
}

/** 音频播放器组件 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  format = AudioFormat.MP3,
  label,
}) => {
  const { isPlaying, currentTime, duration, play, pause, seek } = useAudioPlayer();

  /** 播放/暂停切换 */
  const handleToggle = (): void => {
    if (!audioBase64) return;
    if (isPlaying) {
      pause();
    } else {
      play(audioBase64, format);
    }
  };

  /** 进度跳转 */
  const handleSeek = (_: Event, value: number | number[]): void => {
    seek(value as number);
  };

  /** 格式化时间 */
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box className="flex items-center gap-2">
      <IconButton
        size="small"
        onClick={handleToggle}
        disabled={!audioBase64}
        sx={{
          backgroundColor: audioBase64 ? '#6366F1' : '#e8eaf0',
          color: audioBase64 ? 'white' : '#9ca3af',
          '&:hover': {
            backgroundColor: audioBase64 ? '#4F46E5' : '#e8eaf0',
          },
        }}
      >
        {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
      </IconButton>

      <Box className="flex-1 flex items-center gap-2">
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            {label}
          </Typography>
        )}
        <Slider
          size="small"
          value={currentTime}
          min={0}
          max={duration || 1}
          onChange={handleSeek}
          disabled={!audioBase64}
          sx={{ flex: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

export default AudioPlayer;
