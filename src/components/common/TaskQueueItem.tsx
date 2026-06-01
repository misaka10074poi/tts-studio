/**
 * 任务队列单项组件
 * 显示单个任务的状态、文本摘要和播放控件
 */

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ReplayIcon from '@mui/icons-material/Replay';
import { TaskItem, TaskStatus } from '../../types';
import AudioPlayer from './AudioPlayer';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';

interface TaskQueueItemProps {
  /** 任务数据 */
  task: TaskItem;
  /** 任务序号 */
  index: number;
  onRetry?: (taskId: string) => void;
  retryDisabled?: boolean;
}

/** 任务状态图标映射 */
const STATUS_CONFIG: Record<
  TaskStatus,
  { icon: React.ReactElement; color: string; label: string }
> = {
  [TaskStatus.PENDING]: {
    icon: <HourglassEmptyIcon fontSize="small" />,
    color: '#9ca3af',
    label: '等待中',
  },
  [TaskStatus.GENERATING]: {
    icon: <AutorenewIcon fontSize="small" className="status-spinning" />,
    color: '#6366F1',
    label: '生成中',
  },
  [TaskStatus.COMPLETED]: {
    icon: <CheckCircleIcon fontSize="small" />,
    color: '#22c55e',
    label: '已完成',
  },
  [TaskStatus.FAILED]: {
    icon: <ErrorIcon fontSize="small" />,
    color: '#ef4444',
    label: '失败',
  },
};

/** 任务队列单项组件 */
const TaskQueueItem: React.FC<TaskQueueItemProps> = ({
  task,
  index,
  onRetry,
  retryDisabled = false,
}) => {
  const { segments, outputFormat } = useBuiltinVoiceStore();
  const segment = segments.find((s) => s.id === task.segmentId);
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <Box
      className="flex items-center gap-3 p-2 rounded-lg"
      sx={{
        backgroundColor:
          task.status === TaskStatus.COMPLETED
            ? '#f0fdf4'
            : task.status === TaskStatus.FAILED
            ? '#fef2f2'
            : '#f8f9fa',
        border: '1px solid',
        borderColor:
          task.status === TaskStatus.COMPLETED
            ? '#bbf7d0'
            : task.status === TaskStatus.FAILED
            ? '#fecaca'
            : '#e8eaf0',
      }}
    >
      {/* 状态图标 */}
      <Box sx={{ color: statusConfig.color, display: 'flex', alignItems: 'center' }}>
        <Tooltip title={statusConfig.label}>
          {statusConfig.icon}
        </Tooltip>
      </Box>

      {/* 序号和文本摘要 */}
      <Box className="flex-1 min-w-0">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          第 {index + 1} 段
          {segment && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {segment.text.substring(0, 40)}{segment.text.length > 40 ? '...' : ''}
            </Typography>
          )}
        </Typography>
        {task.errorMessage && (
          <Typography variant="caption" color="error">
            {task.errorMessage}
          </Typography>
        )}
      </Box>

      {/* 音频播放器（仅完成后显示） */}
      {task.status === TaskStatus.COMPLETED && task.audioBase64 && (
        <Box className="flex-1 max-w-xs">
          <AudioPlayer
            audioBase64={task.audioBase64}
            format={outputFormat}
            label={`#${index + 1}`}
          />
        </Box>
      )}

      {/* 重试按钮（仅失败时显示） */}
      {task.status === TaskStatus.FAILED && (
        <Tooltip title="重试">
          <IconButton
            size="small"
            disabled={retryDisabled || !onRetry}
            onClick={() => onRetry?.(task.id)}
            sx={{ color: '#6366F1' }}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default TaskQueueItem;
