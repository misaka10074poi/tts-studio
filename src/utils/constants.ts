/**
 * 全局默认常量
 * 集中管理所有硬编码的默认值
 */

import { AudioFormat } from '../types';

export const DEFAULTS = {
  /** API 端点地址 */
  API_ENDPOINT: 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
  /** 默认 API Key */
  API_KEY: '',
  /** 最大并发数 */
  MAX_CONCURRENCY: 2,
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 文本最大长度 */
  MAX_TEXT_LENGTH: 100000,
  /** 克隆音频最大文件大小（字节） */
  MAX_CLONE_AUDIO_SIZE: 10 * 1024 * 1024,
  /** 克隆音频最短时长（秒） */
  MIN_CLONE_AUDIO_DURATION: 5,
  /** 克隆音频最长时长（秒） */
  MAX_CLONE_AUDIO_DURATION: 30,
  /** 文本拆分阈值（字符数） */
  SPLIT_THRESHOLD: 1000,
  /** 默认输出格式 */
  OUTPUT_FORMAT: 'mp3' as AudioFormat,
  /** 请求超时时间（毫秒） */
  REQUEST_TIMEOUT: 120000,
  /** 音频输出目录 */
  OUTPUT_DIR: './output',
  /** 拆分防抖延迟（毫秒） */
  SPLIT_DEBOUNCE_MS: 500,
} as const;
