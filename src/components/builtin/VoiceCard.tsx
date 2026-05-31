/**
 * 单个音色卡片组件
 * 展示音色信息，支持选中高亮和试听
 */

import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { VoiceProfile } from '../../types';

/** 全局当前播放的 Audio，确保同一时间只有一个音色在播放 */
let globalPlayingAudio: HTMLAudioElement | null = null;
let globalPlayingSetter: ((v: boolean) => void) | null = null;

/** 停止全局正在播放的音频 */
function stopGlobalAudio(): void {
  if (globalPlayingAudio) {
    globalPlayingAudio.pause();
    globalPlayingAudio.currentTime = 0;
    globalPlayingAudio = null;
  }
  if (globalPlayingSetter) {
    globalPlayingSetter(false);
    globalPlayingSetter = null;
  }
}

interface VoiceCardProps {
  voice: VoiceProfile;
  selected: boolean;
  onSelect: (voice: VoiceProfile) => void;
}

/** 音色卡片组件 */
const VoiceCard: React.FC<VoiceCardProps> = ({ voice, selected, onSelect }) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  // 组件卸载时清理 Audio 资源
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
      setPlaying(false);
    };
  }, []);

  const handlePlay = (e: React.MouseEvent): void => {
    e.stopPropagation();

    if (playing) {
      // 停止当前
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopGlobalAudio();
      setPlaying(false);
      return;
    }

    // 先停止其他正在播放的音色
    stopGlobalAudio();

    // 创建新的 Audio 并播放
    const audio = new Audio(voice.sampleUrl);
    audioRef.current = audio;
    globalPlayingAudio = audio;
    globalPlayingSetter = setPlaying;

    audio.onended = () => {
      setPlaying(false);
      globalPlayingAudio = null;
      globalPlayingSetter = null;
    };
    audio.onerror = () => {
      setPlaying(false);
      globalPlayingAudio = null;
      globalPlayingSetter = null;
    };

    audio.play().catch(() => {
      setPlaying(false);
      globalPlayingAudio = null;
      globalPlayingSetter = null;
    });
    setPlaying(true);
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        selected ? 'voice-card-selected' : ''
      }`}
      onClick={() => onSelect(voice)}
      sx={{
        borderRadius: 2,
        border: selected ? '1px solid #4f46e5' : '1px solid #e5e7eb',
        boxShadow: 'none',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          borderColor: '#4f46e5',
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box className="flex items-start justify-between">
          <Box className="flex-1 min-w-0">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {voice.nameZh}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {voice.description}
            </Typography>
          </Box>
          {selected && (
            <CheckCircleIcon sx={{ color: '#6366F1', fontSize: 20, flexShrink: 0 }} />
          )}
        </Box>
        <Box className="flex items-center justify-between mt-1">
          <Typography
            variant="caption"
            sx={{
              backgroundColor: voice.category === 'chinese' ? '#EEF2FF' : '#ECFDF5',
              color: voice.category === 'chinese' ? '#4F46E5' : '#047857',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.7rem',
            }}
          >
            {voice.category === 'chinese' ? '中文' : 'English'}
          </Typography>
          <IconButton
            size="small"
            onClick={handlePlay}
            sx={{
              backgroundColor: playing ? '#ef4444' : '#6366F1',
              color: '#fff',
              width: 28,
              height: 28,
              '&:hover': {
                backgroundColor: playing ? '#dc2626' : '#4F46E5',
              },
            }}
          >
            {playing ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VoiceCard;
