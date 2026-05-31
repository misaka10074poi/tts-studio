/**
 * 项目历史 Store
 * 管理所有配音项目（任务），支持创建/切换/归档
 * 持久化到 localStorage
 */

import { create } from 'zustand';
import { TtsProject, ProjectStatus } from '../types';

const STORAGE_KEY = 'tts_studio_projects';

/** 从 localStorage 加载项目列表 */
function loadProjects(): TtsProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as TtsProject[];
    }
  } catch { /* ignore */ }
  return [];
}

/** 保存到 localStorage */
function saveProjects(projects: TtsProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

interface ProjectStore {
  /** 所有项目列表（按创建时间倒序） */
  projects: TtsProject[];
  /** 当前活跃项目 ID */
  activeProjectId: string | null;
  /** 新增项目 */
  addProject: (project: TtsProject) => void;
  /** 更新项目 */
  updateProject: (id: string, partial: Partial<TtsProject>) => void;
  /** 删除项目 */
  removeProject: (id: string) => void;
  /** 切换活跃项目 */
  setActiveProject: (id: string | null) => void;
  /** 获取活跃项目 */
  getActiveProject: () => TtsProject | undefined;
  /** 从项目恢复工作台状态 */
  restoreProject: (id: string) => TtsProject | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadProjects(),
  activeProjectId: null,

  addProject: (project) =>
    set((state) => {
      const newProjects = [project, ...state.projects].slice(0, 50); // 最多保留 50 个
      saveProjects(newProjects);
      return { projects: newProjects, activeProjectId: project.id };
    }),

  updateProject: (id, partial) =>
    set((state) => {
      const newProjects = state.projects.map((p) =>
        p.id === id ? { ...p, ...partial } : p
      );
      saveProjects(newProjects);
      return { projects: newProjects };
    }),

  removeProject: (id) =>
    set((state) => {
      const newProjects = state.projects.filter((p) => p.id !== id);
      saveProjects(newProjects);
      const newActive =
        state.activeProjectId === id ? null : state.activeProjectId;
      return { projects: newProjects, activeProjectId: newActive };
    }),

  setActiveProject: (id) => set({ activeProjectId: id }),

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId);
  },

  restoreProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (project) {
      set({ activeProjectId: id });
    }
    return project;
  },
}));
