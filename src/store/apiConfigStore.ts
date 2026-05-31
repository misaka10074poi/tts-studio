/**
 * API 配置 Store
 * 管理 TTS API 的端点、密钥和并发数，持久化到 localStorage
 */

import { create } from 'zustand';
import { ApiConfig } from '../types';
import { DEFAULTS } from '../utils/constants';

const STORAGE_KEY = 'tts_studio_api_config';

/** 从 localStorage 加载配置 */
function loadConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ApiConfig;
    }
  } catch {
    // 解析失败使用默认值
  }
  return {
    endpoint: DEFAULTS.API_ENDPOINT,
    apiKey: DEFAULTS.API_KEY,
    maxConcurrency: DEFAULTS.MAX_CONCURRENCY,
    outputDir: DEFAULTS.OUTPUT_DIR,
  };
}

/** 保存配置到 localStorage */
function saveConfig(config: ApiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Store 状态接口 */
interface ApiConfigState {
  /** 当前 API 配置 */
  config: ApiConfig;
  /** 更新配置（部分更新） */
  updateConfig: (partial: Partial<ApiConfig>) => void;
  /** 重置为默认配置 */
  resetConfig: () => void;
}

/** API 配置 Store */
export const useApiConfigStore = create<ApiConfigState>((set) => ({
  config: loadConfig(),

  updateConfig: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      saveConfig(newConfig);
      return { config: newConfig };
    }),

  resetConfig: () =>
    set(() => {
      const defaultConfig: ApiConfig = {
        endpoint: DEFAULTS.API_ENDPOINT,
        apiKey: DEFAULTS.API_KEY,
        maxConcurrency: DEFAULTS.MAX_CONCURRENCY,
        outputDir: DEFAULTS.OUTPUT_DIR,
      };
      saveConfig(defaultConfig);
      return { config: defaultConfig };
    }),
}));
