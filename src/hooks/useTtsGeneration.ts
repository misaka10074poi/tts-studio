/**
 * TTS 生成 Hook
 * 管理任务队列的并发执行、中止、失败重试和状态更新
 */

import { useCallback, useRef, useState } from 'react';
import { useTaskQueueStore } from '../store/taskQueueStore';
import { useApiConfigStore } from '../store/apiConfigStore';
import { generate } from '../services/ttsApi';
import { TextSegment, TaskStatus, TtsModel, AudioFormat, TtsRequest } from '../types';
import { DEFAULTS } from '../utils/constants';

/** 生成参数 */
interface GenerationParams {
  /** 使用的模型 */
  model: TtsModel;
  /** 文本段列表 */
  segments: TextSegment[];
  /** 音色参数 */
  voice?: string;
  /** 音色描述 */
  voiceDescription?: string;
  /** 输出格式 */
  format: AudioFormat;
  /** 每段完成后回调 */
  onEachComplete?: (index: number, total: number, audioBase64: string) => void;
  /** 全部完成后回调（传入完成数量） */
  onAllComplete?: (completedCount: number) => void;
}

/** TTS 生成 Hook */
export function useTtsGeneration() {
  const { updateTask } = useTaskQueueStore();
  const { config } = useApiConfigStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const activeCountRef = useRef(0);
  const completedCountRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const finishedRef = useRef(false);

  /**
   * 带重试的生成单段
   * 最多重试 3 次，使用指数退避
   * 支持 AbortSignal 中止
   */
  const generateWithRetry = useCallback(
    async (
      taskId: string,
      segment: TextSegment,
      params: GenerationParams,
      abortSignal: AbortSignal,
      retryCount = 0
    ): Promise<void> => {
      // 检查是否已中止
      if (abortSignal.aborted) {
        updateTask(taskId, {
          status: TaskStatus.FAILED,
          errorMessage: '用户中止',
        });
        return;
      }

      updateTask(taskId, {
        status: TaskStatus.GENERATING,
        retryCount,
      });

      const request: TtsRequest = {
        model: params.model,
        text: segment.text,
        format: params.format,
        voice: params.voice,
        voiceDescription: params.voiceDescription,
      };

      try {
        const response = await generate(request, abortSignal);

        if (response.success && response.audioBase64) {
          updateTask(taskId, {
            status: TaskStatus.COMPLETED,
            audioBase64: response.audioBase64,
          });
          completedCountRef.current++;
          params.onEachComplete?.(
            segment.index,
            params.segments.length,
            response.audioBase64
          );
        } else {
          throw new Error(response.error || '生成失败');
        }
      } catch (err) {
        // 用户主动中止
        if (err instanceof DOMException && err.name === 'AbortError') {
          updateTask(taskId, {
            status: TaskStatus.FAILED,
            errorMessage: '用户中止',
          });
          return;
        }

        const errorMsg = err instanceof Error ? err.message : '未知错误';

        if (retryCount < DEFAULTS.MAX_RETRIES && !abortSignal.aborted) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          await generateWithRetry(taskId, segment, params, abortSignal, retryCount + 1);
        } else {
          updateTask(taskId, {
            status: TaskStatus.FAILED,
            errorMessage: errorMsg,
            retryCount,
          });
        }
      }
    },
    [updateTask]
  );

  /**
   * 中止所有正在进行的生成
   */
  const abortGeneration = useCallback((): void => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // 将所有 PENDING / GENERATING 标记为失败
    const { tasks } = useTaskQueueStore.getState();
    for (const task of tasks) {
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.GENERATING) {
        updateTask(task.id, {
          status: TaskStatus.FAILED,
          errorMessage: '用户中止',
        });
      }
    }
    setIsGenerating(false);
  }, [updateTask]);

  /**
   * 开始生成任务
   * 使用信号量模式控制并发
   */
  const startGeneration = useCallback(
    async (params: GenerationParams): Promise<void> => {
      const { tasks } = useTaskQueueStore.getState();
      const pendingTasks = tasks.filter((t) => t.status === TaskStatus.PENDING);
      const maxConcurrency = config.maxConcurrency || DEFAULTS.MAX_CONCURRENCY;

      if (pendingTasks.length === 0) {
        params.onAllComplete?.(0);
        return;
      }

      // 创建新的 AbortController
      const abortController = new AbortController();
      abortRef.current = abortController;

      setIsGenerating(true);
      activeCountRef.current = 0;
      completedCountRef.current = 0;
      finishedRef.current = false;

      const segmentMap = new Map(params.segments.map((s) => [s.id, s]));

      const finishGeneration = (): void => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        setIsGenerating(false);
        abortRef.current = null;
        if (!abortController.signal.aborted) {
          params.onAllComplete?.(completedCountRef.current);
        }
      };

      /** 处理下一个待处理任务 */
      const processNext = async (): Promise<void> => {
        if (abortController.signal.aborted) {
          activeCountRef.current--;
          if (activeCountRef.current <= 0) {
            finishGeneration();
          }
          return;
        }

        const currentTasks = useTaskQueueStore.getState().tasks;
        const pending = currentTasks.find((t) => t.status === TaskStatus.PENDING);

        if (!pending) {
          activeCountRef.current--;
          if (activeCountRef.current <= 0) {
            finishGeneration();
          }
          return;
        }

        const segment = segmentMap.get(pending.segmentId);
        if (!segment) {
          updateTask(pending.id, {
            status: TaskStatus.FAILED,
            errorMessage: '找不到对应的文本段',
          });
          await processNext();
          return;
        }

        await generateWithRetry(pending.id, segment, params, abortController.signal);
        await processNext();
      };

      const initialBatch = Math.min(maxConcurrency, pendingTasks.length);
      activeCountRef.current = initialBatch;

      const promises: Promise<void>[] = [];
      for (let i = 0; i < initialBatch; i++) {
        promises.push(processNext());
      }

      await Promise.all(promises);
      finishGeneration();
    },
    [config.maxConcurrency, generateWithRetry, updateTask]
  );

  return {
    startGeneration,
    abortGeneration,
    isGenerating,
  };
}
