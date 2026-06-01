/**
 * 分段预览面板组件
 * 显示拆分后的文本段，支持试听、编辑、删除、调序
 * 由 isSplitExpanded 控制展开/折叠
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';
import { useTaskQueueStore } from '../../store/taskQueueStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { TaskStatus } from '../../types';

/** 分段预览面板组件 */
const SegmentPreviewPanel: React.FC = () => {
  const { segments, setSegments, isSplitExpanded, toggleSplitExpanded, outputFormat } =
    useBuiltinVoiceStore();
  const { tasks } = useTaskQueueStore();
  const { isPlaying, play, pause } = useAudioPlayer();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  // 记录哪些段展开了全文
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  if (segments.length === 0) return null;

  /** 获取某段对应的任务 */
  const getSegmentTask = (segmentId: string) =>
    tasks.find((t) => t.segmentId === segmentId);

  /** 获取某段的状态 */
  const getSegmentStatus = (segmentId: string): TaskStatus | null => {
    const task = getSegmentTask(segmentId);
    return task?.status ?? null;
  };

  /** 状态配置 */
  const statusConfig: Record<string, { color: string; label: string }> = {
    [TaskStatus.PENDING]: { color: '#d1d5db', label: '等待' },
    [TaskStatus.GENERATING]: { color: '#6366F1', label: '生成中' },
    [TaskStatus.COMPLETED]: { color: '#22c55e', label: '完成' },
    [TaskStatus.FAILED]: { color: '#ef4444', label: '失败' },
  };

  /** 开始编辑 */
  const startEdit = (id: string, text: string): void => {
    setEditingId(id);
    setEditText(text);
  };

  /** 保存编辑 */
  const saveEdit = (): void => {
    if (editingId && editText.trim()) {
      const newSegments = segments.map((s) =>
        s.id === editingId
          ? { ...s, text: editText.trim(), charCount: editText.trim().length }
          : s
      );
      setSegments(newSegments);
    }
    setEditingId(null);
  };

  /** 删除某段 */
  const removeSegment = (id: string): void => {
    setSegments(segments.filter((s) => s.id !== id));
  };

  /** 上移 */
  const moveUp = (index: number): void => {
    if (index <= 0) return;
    const newSegments = [...segments];
    [newSegments[index - 1], newSegments[index]] = [
      newSegments[index],
      newSegments[index - 1],
    ];
    setSegments(newSegments.map((s, i) => ({ ...s, index: i })));
  };

  /** 下移 */
  const moveDown = (index: number): void => {
    if (index >= segments.length - 1) return;
    const newSegments = [...segments];
    [newSegments[index], newSegments[index + 1]] = [
      newSegments[index + 1],
      newSegments[index],
    ];
    setSegments(newSegments.map((s, i) => ({ ...s, index: i })));
  };

  /** 播放/暂停 */
  const handlePlay = (segmentId: string): void => {
    const task = getSegmentTask(segmentId);
    if (!task?.audioBase64) return;

    if (playingId === segmentId && isPlaying) {
      pause();
      setPlayingId(null);
    } else {
      play(task.audioBase64, outputFormat);
      setPlayingId(segmentId);
    }
  };

  /** 切换单段文本展开 */
  const toggleTextExpand = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Box
      className="mb-4"
      sx={{
        border: '1px solid #e8eaf0',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* 折叠头 */}
      <Box
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        sx={{ backgroundColor: '#f8f9fa', '&:hover': { backgroundColor: '#f1f3f5' } }}
        onClick={toggleSplitExpanded}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          📝 段落列表 ({segments.length}段)
        </Typography>
        {isSplitExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      <Collapse in={isSplitExpanded}>
        <Box className="flex flex-col divide-y divide-gray-100">
          {segments.map((seg, index) => {
            const status = getSegmentStatus(seg.id);
            const sc = status ? statusConfig[status] : null;
            const task = getSegmentTask(seg.id);
            const hasAudio = task?.audioBase64 != null;
            const isExpanded = expandedIds.has(seg.id);

            return (
              <Box
                key={seg.id}
                className="flex items-start gap-3 p-3"
                sx={{
                  backgroundColor:
                    status === TaskStatus.COMPLETED ? '#f0fdf4' : 'transparent',
                }}
              >
                {/* 左侧序号圆标 + 状态点 */}
                <Box className="flex flex-col items-center min-w-[32px] pt-0.5">
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#6366F1',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  {sc && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: sc.color,
                        mt: 0.5,
                      }}
                      title={sc.label}
                    />
                  )}
                </Box>

                {/* 中间文本内容 */}
                <Box className="flex-1 min-w-0">
                  {editingId === seg.id ? (
                    <Box className="flex flex-col gap-1">
                      <TextField
                        multiline
                        size="small"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        fullWidth
                        autoFocus
                      />
                      <Box className="flex gap-1">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={saveEdit}
                          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                        >
                          保存
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setEditingId(null)}
                          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                        >
                          取消
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography
                        variant="body2"
                        onClick={() => toggleTextExpand(seg.id)}
                        sx={{
                          cursor: 'pointer',
                          ...(isExpanded
                            ? {
                                whiteSpace: 'pre-wrap',
                                maxHeight: '10rem',
                                overflowY: 'auto',
                              }
                            : {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }),
                          '&:hover': { color: '#6366F1' },
                        }}
                      >
                        {seg.text}
                      </Typography>
                      <Box className="flex items-center gap-2 mt-1">
                        <Typography variant="caption" color="text.secondary">
                          {seg.charCount} 字
                        </Typography>
                        {isExpanded && seg.charCount > 80 && (
                          <Button
                            size="small"
                            onClick={() => toggleTextExpand(seg.id)}
                            sx={{
                              fontSize: '0.65rem',
                              minWidth: 'auto',
                              px: 1,
                              py: 0,
                              textTransform: 'none',
                            }}
                          >
                            收起
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* 右侧操作按钮 */}
                {!editingId && status !== TaskStatus.GENERATING && (
                  <Box className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    {/* 播放按钮 */}
                    {hasAudio && (
                      <Tooltip title={playingId === seg.id && isPlaying ? '暂停' : '试听'}>
                        <IconButton
                          size="small"
                          onClick={() => handlePlay(seg.id)}
                          sx={{
                            backgroundColor: '#6366F1',
                            color: '#fff',
                            width: 28,
                            height: 28,
                            '&:hover': { backgroundColor: '#4F46E5' },
                          }}
                        >
                          <PlayArrowIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="编辑">
                      <IconButton size="small" onClick={() => startEdit(seg.id, seg.text)}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="上移">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => moveUp(index)}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="下移">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === segments.length - 1}
                          onClick={() => moveDown(index)}
                        >
                          <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeSegment(seg.id)}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SegmentPreviewPanel;
