/**
 * 项目抽屉组件
 * 显示历史任务列表，支持切换/恢复/删除
 * 点击项目可展开查看分段详情和打开输出目录
 */

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Tooltip,
  Divider,
  Button,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';
import { useTaskQueueStore } from '../../store/taskQueueStore';
import { TtsProject } from '../../types';

interface ProjectDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** 格式化时间 */
function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 状态图标 */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 20 }} />;
    case 'failed':
      return <ErrorIcon sx={{ color: '#ef4444', fontSize: 20 }} />;
    case 'generating':
      return <PendingIcon sx={{ color: '#6366F1', fontSize: 20 }} />;
    default:
      return <PendingIcon sx={{ color: '#9ca3af', fontSize: 20 }} />;
  }
}

/** 是否有 Electron API 可用 */
function hasElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProject, removeProject } = useProjectStore();
  const builtinStore = useBuiltinVoiceStore();
  const taskStore = useTaskQueueStore();

  // 记录展开的项目 ID 集合
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  // 记录展开全文的段 ID 集合
  const [expandedSegIds, setExpandedSegIds] = React.useState<Set<string>>(new Set());

  /** 切换项目展开 */
  const toggleProjectExpand = (id: string): void => {
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

  /** 切换段文本展开 */
  const toggleSegExpand = (segId: string): void => {
    setExpandedSegIds((prev) => {
      const next = new Set(prev);
      if (next.has(segId)) {
        next.delete(segId);
      } else {
        next.add(segId);
      }
      return next;
    });
  };

  /** 切换到某个项目 */
  const handleSwitch = (project: TtsProject): void => {
    setActiveProject(project.id);
    // 根据项目模式导航到对应路由
    navigate(project.voiceId === 'clone' || project.voiceId === 'voice-design' ? '/clone' : '/builtin');

    // 恢复音色
    const voice = builtinStore.voices.find((v) => v.id === project.voiceId);
    if (voice) builtinStore.selectVoice(voice);

    // 恢复文本和分段
    builtinStore.setInputText(project.sourceText);
    builtinStore.setSegments(project.segments);
    builtinStore.setOutputFormat(project.outputFormat);

    // 恢复任务队列
    taskStore.setTasks(project.taskItems);

    // 恢复上次输出目录
    if (project.taskDir) {
      builtinStore.setLastOutputDir(project.taskDir);
    }

    onClose();
  };

  /** 删除项目 */
  const handleDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation();
    if (window.confirm('确认删除这条历史任务吗？')) {
      removeProject(id);
    }
  };

  /** 打开输出目录 */
  const handleOpenDir = (e: React.MouseEvent, taskDir: string): void => {
    e.stopPropagation();
    if (hasElectron()) {
      window.electronAPI!.openPath(taskDir);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 2 }}>
        <Box className="flex items-center justify-between mb-2">
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            📂 历史任务
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {projects.length === 0 ? (
          <Box className="text-center py-8">
            <HistoryIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              暂无历史任务
            </Typography>
            <Typography variant="caption" color="text.secondary">
              生成语音后会自动保存
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {projects.map((project) => {
              const isExpanded = expandedIds.has(project.id);
              return (
                <Box key={project.id} sx={{ mb: 0.5 }}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Tooltip title="删除">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => handleDelete(e, project.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemButton
                      onClick={() => {
                        toggleProjectExpand(project.id);
                      }}
                      selected={project.id === activeProjectId}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <StatusIcon status={project.status} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box className="flex items-center gap-1">
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500, flex: 1 }}>
                              {project.title}
                            </Typography>
                            {isExpanded ? (
                              <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            ) : (
                              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(project.createdAt)}
                            </Typography>
                            <Chip
                              label={project.voiceName}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {project.totalChars}字/{project.segmentCount}段
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* 展开的分段详情 */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 5, pr: 2, pb: 1 }}>
                      {/* 打开输出目录按钮 */}
                      <Box className="flex items-center gap-1 mb-1 flex-wrap">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSwitch(project)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                          }}
                        >
                          恢复任务
                        </Button>
                        {project.taskDir && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FolderOpenIcon />}
                            onClick={(e) => handleOpenDir(e, project.taskDir!)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.7rem',
                            }}
                          >
                            打开目录
                          </Button>
                        )}
                      </Box>

                      {/* 分段列表 */}
                      {project.segments.length > 0 && (
                        <Box className="flex flex-col gap-1">
                          {project.segments.map((seg) => {
                            const segKey = `${project.id}_${seg.id}`;
                            const isSegExpanded = expandedSegIds.has(segKey);
                            return (
                              <Box
                                key={seg.id}
                                sx={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 1,
                                  p: 1,
                                  backgroundColor: '#fafafa',
                                }}
                              >
                                <Box className="flex items-start justify-between gap-1">
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: '#6366F1',
                                      mr: 0.5,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {seg.index + 1}.
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      flex: 1,
                                      ...(isSegExpanded
                                        ? { whiteSpace: 'pre-wrap', maxHeight: '8rem', overflowY: 'auto' }
                                        : {
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                          }),
                                    }}
                                  >
                                    {seg.text}
                                  </Typography>
                                </Box>
                                <Box className="flex items-center justify-between mt-0.5">
                                  <Typography variant="caption" color="text.secondary">
                                    {seg.charCount}字
                                  </Typography>
                                  {seg.charCount > 80 && (
                                    <Button
                                      size="small"
                                      onClick={() => toggleSegExpand(segKey)}
                                      sx={{
                                        fontSize: '0.6rem',
                                        minWidth: 'auto',
                                        px: 0.5,
                                        py: 0,
                                        textTransform: 'none',
                                      }}
                                    >
                                      {isSegExpanded ? '收起' : '展开全文'}
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      {project.segments.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          暂无分段信息
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default ProjectDrawer;
