/**
 * 内置音色 Store
 * 管理内置音色的选择状态和文本输入
 */

import { create } from 'zustand';
import { VoiceProfile, TextSegment, AudioFormat, SplitRuleType, SplitRule } from '../types';
import { BUILTIN_VOICES } from '../config/voices';
import { DEFAULTS } from '../utils/constants';

/** 内置音色工作台状态接口 */
interface BuiltinVoiceState {
  /** 全部内置音色列表 */
  voices: VoiceProfile[];
  /** 当前选中的音色 */
  selectedVoice: VoiceProfile | null;
  /** 输入文本 */
  inputText: string;
  /** 拆分后的文本段 */
  segments: TextSegment[];
  /** 输出格式 */
  outputFormat: AudioFormat;
  /** 拆分规则 */
  splitRule: SplitRule;
  /** 分段预览面板是否展开 */
  isSplitExpanded: boolean;
  /** 最近一次输出目录 */
  lastOutputDir: string | null;
  /** 选择音色 */
  selectVoice: (voice: VoiceProfile) => void;
  /** 设置输入文本 */
  setInputText: (text: string) => void;
  /** 设置拆分后的文本段 */
  setSegments: (segments: TextSegment[]) => void;
  /** 设置输出格式 */
  setOutputFormat: (format: AudioFormat) => void;
  /** 设置拆分规则 */
  setSplitRule: (rule: SplitRule) => void;
  /** 切换分段预览面板展开/折叠 */
  toggleSplitExpanded: () => void;
  /** 设置最近输出目录 */
  setLastOutputDir: (dir: string | null) => void;
  /** 重置工作台状态 */
  reset: () => void;
}

/** 内置音色 Store */
export const useBuiltinVoiceStore = create<BuiltinVoiceState>((set) => ({
  voices: BUILTIN_VOICES,
  selectedVoice: null,
  inputText: '',
  segments: [],
  outputFormat: DEFAULTS.OUTPUT_FORMAT,
  splitRule: { type: SplitRuleType.CHARS, value: DEFAULTS.SPLIT_THRESHOLD },
  isSplitExpanded: true,
  lastOutputDir: null,

  selectVoice: (voice) => set({ selectedVoice: voice }),

  setInputText: (text) => set({ inputText: text }),

  setSegments: (segments) => set({ segments }),

  setOutputFormat: (format) => set({ outputFormat: format }),

  setSplitRule: (rule) => set({ splitRule: rule }),

  toggleSplitExpanded: () => set((s) => ({ isSplitExpanded: !s.isSplitExpanded })),

  setLastOutputDir: (dir) => set({ lastOutputDir: dir }),

  reset: () =>
    set({
      selectedVoice: null,
      inputText: '',
      segments: [],
      outputFormat: DEFAULTS.OUTPUT_FORMAT,
      splitRule: { type: SplitRuleType.CHARS, value: DEFAULTS.SPLIT_THRESHOLD },
      isSplitExpanded: true,
      lastOutputDir: null,
    }),
}));
