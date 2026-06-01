/**
 * 生成面板组件
 * 包含生成按钮/中止按钮、任务队列列表和本地输出保存功能
 * 支持内置音色模式和克隆模式
 */

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Stack,
  LinearProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ReplayIcon from '@mui/icons-material/Replay';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { useTaskQueueStore } from '../../store/taskQueueStore';
import { useTtsGeneration } from '../../hooks/useTtsGeneration';
import TaskQueueList from '../common/TaskQueueList';
import DownloadButton from '../common/DownloadButton';
import { splitText } from '../../services/textSplitter';
import { mergeAndEncodeMp3, mergeAndEncodeWav } from '../../services/audioProcessor';
import * as outputService from '../../services/outputService';
import {
  CloneMethod,
  TaskStatus,
  TtsModel,
  SplitRuleType,
  OutputTaskMeta,
  AudioFormat,
  TextSegment,
} from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { DEFAULTS } from '../../utils/constants';
import { v4 as uuidv4 } from 'uuid';

interface GenerationPanelProps {
  isCloneMode?: boolean;
  canGenerate?: boolean;
}

const GenerationPanel: React.FC<GenerationPanelProps> = ({
  isCloneMode = false,
  canGenerate = true,
}) => {
  const builtinStore = useBuiltinVoiceStore();
  const cloneStore = useCloneVoiceStore();
  const taskStore = useTaskQueueStore();
  const { startGeneration, abortGeneration, isGenerating } = useTtsGeneration();

  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [lastTaskDir, setLastTaskDir] = React.useState<string | null>(null);

  /** 记录保存失败的段索引 */
  const failedSaveSegIndices = React.useRef<Set<number>>(new Set());

  const completedCount = taskStore.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const failedCount = taskStore.tasks.filter((t) => t.status === TaskStatus.FAILED).length;
  const generatingCount = taskStore.tasks.filter((t) => t.status === TaskStatus.GENERATING).length;
  const progressValue =
    taskStore.tasks.length > 0 ? Math.round((completedCount / taskStore.tasks.length) * 100) : 0;

  /** 构建并保存完成后的所有输出 */
  const saveAllToDisk = React.useCallback(
    async (segs: { id: string; index: number; text: string; charCount: number }[]): Promise<string | null> => {
      try {
        const taskName = outputService.generateTaskName(builtinStore.inputText);
        const taskDir = await outputService.createTaskDir(taskName);

        // 将 taskDir 保存到 store 中
        builtinStore.setLastOutputDir(taskDir);

        return taskDir;
      } catch (err) {
        console.error('创建输出目录失败:', err);
        setSnackbar({
          open: true,
          message: '创建输出目录失败，请检查磁盘权限',
          severity: 'error',
        });
        return null;
      }
    },
    [builtinStore]
  );

  /** 保存当前生成任务为项目 */
  const saveProject = (
    segs: { id: string; index: number; text: string; charCount: number }[],
    taskDir: string
  ): void => {
    const projectStore = useProjectStore.getState();
    const firstLine = builtinStore.inputText.trim().split('\n')[0].substring(0, 50);
    const title = firstLine || `未命名任务 ${new Date().toLocaleDateString()}`;

    projectStore.addProject({
      id: uuidv4(),
      title,
      sourceText: builtinStore.inputText,
      segments: segs,
      voiceId: isCloneMode ? 'clone' : builtinStore.selectedVoice?.id || '',
      voiceName: isCloneMode ? '克隆音色' : builtinStore.selectedVoice?.nameZh || '',
      outputFormat: isCloneMode ? cloneStore.outputFormat : builtinStore.outputFormat,
      taskItems: [],
      status: 'generating',
      createdAt: Date.now(),
      totalChars: builtinStore.inputText.length,
      segmentCount: segs.length,
      taskDir,
    });
  };

  const saveCompletedOutput = async (
    taskDir: string,
    segs: TextSegment[],
    format: AudioFormat,
    voiceName: string,
    voiceId: string
  ): Promise<void> => {
    const currentTasks = useTaskQueueStore.getState().tasks;
    const completed = currentTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.audioBase64
    );

    if (completed.length > 0) {
      const combinedBase64List = completed
        .filter((t) => t.audioBase64)
        .map((t) => t.audioBase64!);

      if (combinedBase64List.length === 1) {
        await outputService.saveMergedAudio(
          taskDir,
          new Uint8Array(
            Array.from(atob(combinedBase64List[0]), (c) => c.charCodeAt(0))
          ).buffer,
          format
        );
      } else if (combinedBase64List.length > 1) {
        const mergedData =
          format === AudioFormat.MP3
            ? await mergeAndEncodeMp3(combinedBase64List)
            : await mergeAndEncodeWav(combinedBase64List);
        await outputService.saveMergedAudio(taskDir, mergedData, format);
      }
    }

    const meta: OutputTaskMeta = {
      taskId: outputService.generateTaskName(builtinStore.inputText),
      createdAt: new Date().toISOString(),
      voiceName,
      voiceId,
      totalSegments: segs.length,
      totalChars: builtinStore.inputText.length,
      splitRule: {
        type: SplitRuleType.CHARS,
        value: DEFAULTS.SPLIT_THRESHOLD,
      },
      segments: segs.map((s) => ({
        index: s.index,
        charCount: s.charCount,
        textPreview: s.text.substring(0, 100),
      })),
    };
    await outputService.saveMetadata(taskDir, meta);
    await outputService.updateHistoryIndex({
      taskId: meta.taskId,
      dirName: taskDir,
      createdAt: meta.createdAt,
      voiceName: meta.voiceName,
      totalSegments: meta.totalSegments,
    });

    const ps = useProjectStore.getState();
    if (ps.activeProjectId) {
      ps.updateProject(ps.activeProjectId, {
        status: failedCount > 0 ? 'failed' : 'completed',
        completedAt: Date.now(),
        taskItems: useTaskQueueStore.getState().tasks,
      });
    }
  };

  const startPendingGeneration = (
    params: {
      model: TtsModel;
      segs: TextSegment[];
      taskDir: string;
      format: AudioFormat;
      voice?: string;
      voiceDescription?: string;
      voiceName: string;
      voiceId: string;
    }
  ): void => {
    startGeneration({
      model: params.model,
      segments: params.segs,
      voice: params.voice,
      voiceDescription: params.voiceDescription,
      format: params.format,
      onEachComplete: (index, _total, audioBase64) => {
        outputService.saveSegment(params.taskDir, index, audioBase64, params.format).catch((err) => {
          console.error('保存分段失败:', err);
          failedSaveSegIndices.current.add(index);
        });
      },
      onAllComplete: async (doneCount: number) => {
        try {
          await saveCompletedOutput(
            params.taskDir,
            params.segs,
            params.format,
            params.voiceName,
            params.voiceId
          );
          const failedCount = failedSaveSegIndices.current.size;
          if (failedCount > 0) {
            const indices = Array.from(failedSaveSegIndices.current)
              .sort((a, b) => a - b)
              .slice(0, 5);
            const suffix = failedCount > 5 ? '...' : '';
            setSnackbar({
              open: true,
              message: `已生成 ${doneCount}/${params.segs.length} 段，但 ${failedCount} 个分段保存失败 (${indices.map((i) => i + 1).join(', ')}${suffix})`,
              severity: 'warning',
            });
          } else {
            setSnackbar({
              open: true,
              message: `已生成 ${doneCount}/${params.segs.length} 段，保存至本地`,
              severity: 'success',
            });
          }
        } catch (err) {
          console.error('保存输出失败:', err);
          setSnackbar({
            open: true,
            message: '保存输出文件失败，请重试',
            severity: 'error',
          });
        }
      },
    });
  };

  /** 执行生成 */
  const handleGenerate = (): void => {
    if (isCloneMode) {
      handleCloneGenerate();
    } else {
      handleBuiltinGenerate();
    }
  };

  /** 内置音色生成 */
  const handleBuiltinGenerate = async (): Promise<void> => {
    const { selectedVoice, inputText, segments, outputFormat } = builtinStore;

    if (!selectedVoice) {
      setSnackbar({ open: true, message: '请先选择音色', severity: 'error' });
      return;
    }
    if (!inputText.trim()) {
      setSnackbar({ open: true, message: '请输入文本', severity: 'error' });
      return;
    }

    const segs = segments.length > 0 ? segments : splitText(inputText);
    if (segs.length === 0) {
      setSnackbar({ open: true, message: '文本拆分结果为空', severity: 'error' });
      return;
    }

    if (segments.length === 0) {
      builtinStore.setSegments(segs);
    }

    // 创建输出目录
    const taskDir = await saveAllToDisk(segs);
    if (!taskDir) return;
    setLastTaskDir(taskDir);

    // 保存项目
    saveProject(segs, taskDir);

    const tasks = segs.map((seg) => ({
      id: uuidv4(),
      segmentId: seg.id,
      status: TaskStatus.PENDING,
      retryCount: 0,
    }));
    taskStore.setTasks(tasks);

    startPendingGeneration({
      model: TtsModel.STANDARD,
      segs,
      taskDir,
      voice: selectedVoice.voiceParam,
      format: outputFormat,
      voiceName: selectedVoice.nameZh,
      voiceId: selectedVoice.id,
    });

    setSnackbar({ open: true, message: `开始生成 ${segs.length} 段...`, severity: 'info' });
  };

  /** 克隆模式生成 */
  const handleCloneGenerate = async (): Promise<void> => {
    const { config, outputFormat } = cloneStore;
    const inputText = builtinStore.inputText;

    if (!inputText.trim()) {
      setSnackbar({ open: true, message: '请输入文本', severity: 'error' });
      return;
    }
    if (!canGenerate) {
      setSnackbar({
        open: true,
        message: config.method === CloneMethod.UPLOAD ? '请先上传音频' : '请输入音色描述',
        severity: 'error',
      });
      return;
    }

    const segs = splitText(inputText);
    if (segs.length === 0) {
      setSnackbar({ open: true, message: '文本拆分结果为空', severity: 'error' });
      return;
    }

    // 创建输出目录
    const taskDir = await saveAllToDisk(segs);
    if (!taskDir) return;
    setLastTaskDir(taskDir);

    saveProject(segs, taskDir);

    const tasks = segs.map((seg) => ({
      id: uuidv4(),
      segmentId: seg.id,
      status: TaskStatus.PENDING,
      retryCount: 0,
    }));
    taskStore.setTasks(tasks);

    if (config.method === CloneMethod.UPLOAD) {
      startPendingGeneration({
        model: TtsModel.VOICE_CLONE,
        segs,
        taskDir,
        voice: `data:audio/mp3;base64,${config.audioBase64}`,
        format: outputFormat,
        voiceName: '克隆音色',
        voiceId: 'clone',
      });
    } else {
      startPendingGeneration({
        model: TtsModel.VOICE_DESIGN,
        segs,
        taskDir,
        voiceDescription: config.voiceDescription,
        format: outputFormat,
        voiceName: '文字设计音色',
        voiceId: 'voice-design',
      });
    }

    setSnackbar({ open: true, message: `开始生成 ${segs.length} 段...`, severity: 'info' });
  };

  /** 中止生成 */
  const handleAbort = (): void => {
    abortGeneration();
    const ps = useProjectStore.getState();
    if (ps.activeProjectId) {
      ps.updateProject(ps.activeProjectId, {
        status: 'failed',
        taskItems: useTaskQueueStore.getState().tasks,
      });
    }
    setSnackbar({ open: true, message: '已中止生成', severity: 'warning' });
  };

  /** 打开输出目录 */
  const handleOpenOutputDir = (): void => {
    if (lastTaskDir) {
      outputService.openOutputDir(lastTaskDir);
    }
  };

  const retryTaskIds = (ids: string[]): void => {
    if (!lastTaskDir) {
      setSnackbar({ open: true, message: '没有可复用的输出目录', severity: 'warning' });
      return;
    }

    const segs = builtinStore.segments.length > 0
      ? builtinStore.segments
      : splitText(builtinStore.inputText);
    if (segs.length === 0) return;

    taskStore.retryTasks(ids);

    if (isCloneMode) {
      const { config, outputFormat } = cloneStore;
      if (config.method === CloneMethod.UPLOAD) {
        startPendingGeneration({
          model: TtsModel.VOICE_CLONE,
          segs,
          taskDir: lastTaskDir,
          voice: `data:audio/mp3;base64,${config.audioBase64}`,
          format: outputFormat,
          voiceName: '克隆音色',
          voiceId: 'clone',
        });
      } else {
        startPendingGeneration({
          model: TtsModel.VOICE_DESIGN,
          segs,
          taskDir: lastTaskDir,
          voiceDescription: config.voiceDescription,
          format: outputFormat,
          voiceName: '文字设计音色',
          voiceId: 'voice-design',
        });
      }
    } else if (builtinStore.selectedVoice) {
      startPendingGeneration({
        model: TtsModel.STANDARD,
        segs,
        taskDir: lastTaskDir,
        voice: builtinStore.selectedVoice.voiceParam,
        format: builtinStore.outputFormat,
        voiceName: builtinStore.selectedVoice.nameZh,
        voiceId: builtinStore.selectedVoice.id,
      });
    }
  };

  const handleRetryTask = (taskId: string): void => retryTaskIds([taskId]);

  const handleRetryFailed = (): void => {
    const failedIds = taskStore.tasks
      .filter((task) => task.status === TaskStatus.FAILED)
      .map((task) => task.id);
    if (failedIds.length > 0) {
      retryTaskIds(failedIds);
    }
  };

  const canStart = (): boolean => {
    if (isGenerating) return false;
    if (isCloneMode) return canGenerate && builtinStore.inputText.trim() !== '';
    return !!builtinStore.selectedVoice && builtinStore.inputText.trim() !== '';
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
        生成与下载
      </Typography>

      {taskStore.tasks.length > 0 && (
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <Box className="flex items-center justify-between">
            <Typography variant="caption" color="text.secondary">
              {completedCount}/{taskStore.tasks.length} 完成
              {generatingCount > 0 && ` · ${generatingCount} 生成中`}
              {failedCount > 0 && ` · ${failedCount} 失败`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progressValue}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: 6, borderRadius: 999 }}
          />
        </Stack>
      )}

      {/* 操作按钮 — 滚动时固定顶部 */}
      <Box className="flex items-center gap-3 mb-4 flex-wrap" sx={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#f8f9fb', py: 1 }}>
        {isGenerating ? (
          <Button
            variant="contained"
            size="large"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleAbort}
            sx={{ textTransform: 'none', px: 4, py: 1.5, fontSize: '1rem' }}
          >
            中止生成
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleGenerate}
            disabled={!canStart()}
            sx={{ textTransform: 'none', px: 4, py: 1.5, fontSize: '1rem' }}
          >
            生成到本地
          </Button>
        )}

        {failedCount > 0 && !isGenerating && (
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={handleRetryFailed}
            sx={{ textTransform: 'none' }}
          >
            重试失败项
          </Button>
        )}

        <DownloadButton taskDir={lastTaskDir} />
      </Box>

      {/* 输出目录快捷入口 */}
      {lastTaskDir && !isGenerating && (
        <Box
          className="flex items-center gap-2 mb-3 px-3 py-2 rounded"
          sx={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <Typography variant="body2" color="text.secondary" className="truncate">
            {lastTaskDir}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenOutputDir}
            sx={{ textTransform: 'none', flexShrink: 0 }}
          >
            打开目录
          </Button>
        </Box>
      )}

      {/* 任务队列 */}
      {taskStore.tasks.length > 0 && (
        <TaskQueueList
          isGenerating={isGenerating}
          onRetryTask={handleRetryTask}
          onRetryFailed={handleRetryFailed}
        />
      )}

      {/* 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenerationPanel;
