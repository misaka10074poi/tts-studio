/**
 * 任务队列 Store
 * 管理 TTS 生成任务的添加、更新和清空
 */

import { create } from 'zustand';
import { TaskItem, TaskStatus } from '../types';

/** 任务队列状态接口 */
interface TaskQueueState {
  /** 任务列表 */
  tasks: TaskItem[];
  /** 批量设置任务 */
  setTasks: (tasks: TaskItem[]) => void;
  /** 添加单个任务 */
  addTask: (task: TaskItem) => void;
  /** 更新单个任务 */
  updateTask: (id: string, partial: Partial<TaskItem>) => void;
  /** 将失败任务放回等待队列 */
  retryTasks: (ids: string[]) => void;
  /** 清空所有任务 */
  clearTasks: () => void;
  /** 获取指定状态的任务数量 */
  getTaskCountByStatus: (status: TaskStatus) => number;
}

/** 任务队列 Store */
export const useTaskQueueStore = create<TaskQueueState>((set, get) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (id, partial) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    })),

  retryTasks: (ids) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        ids.includes(t.id)
          ? {
              ...t,
              status: TaskStatus.PENDING,
              errorMessage: undefined,
              audioBase64: undefined,
            }
          : t
      ),
    })),

  clearTasks: () => set({ tasks: [] }),

  getTaskCountByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status).length;
  },
}));
