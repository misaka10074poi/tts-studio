/**
 * 音频播放器 Hook
 * 管理音频的播放、暂停和进度控制
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioFormat } from '../types';

/** 音频播放器 Hook 返回值 */
interface AudioPlayerReturn {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 音频总时长（秒） */
  duration: number;
  /** 播放指定 Base64 音频 */
  play: (base64: string, format?: AudioFormat) => void;
  /** 暂停播放 */
  pause: () => void;
  /** 跳转到指定时间 */
  seek: (time: number) => void;
  /** 停止播放并释放资源 */
  stop: () => void;
}

/** 音频播放器 Hook */
export function useAudioPlayer(): AudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /** 清理音频资源 */
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
      audioRef.current.removeEventListener('ended', onEnded);
      audioRef.current.removeEventListener('error', onError);
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /** 事件处理器引用，用于移除 */
  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const onError = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /** 组件卸载时清理 */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * 播放 Base64 编码的音频
   * @param base64 - Base64 音频数据
   * @param format - 音频格式
   */
  const play = useCallback(
    (base64: string, format: AudioFormat = AudioFormat.MP3): void => {
      // 先停止当前播放
      cleanup();

      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        pcm16: 'audio/pcm',
      };

      const mimeType = mimeMap[format] || 'audio/mpeg';
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', onLoadedMetadata);

      audio.addEventListener('timeupdate', onTimeUpdate);

      audio.addEventListener('ended', onEnded);

      audio.addEventListener('error', onError);

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    },
    [cleanup]
  );

  /** 暂停播放 */
  const pause = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /** 跳转到指定时间 */
  const seek = useCallback(
    (time: number): void => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    []
  );

  /** 停止播放 */
  const stop = useCallback((): void => {
    cleanup();
    setCurrentTime(0);
    setDuration(0);
  }, [cleanup]);

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    stop,
  };
}
