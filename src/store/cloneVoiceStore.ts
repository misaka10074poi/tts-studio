/**
 * 声音克隆 Store
 * 管理克隆方式选择、上传音频和音色描述
 */

import { create } from 'zustand';
import { CloneMethod, CloneConfig, AudioFormat } from '../types';
import { DEFAULTS } from '../utils/constants';

/** 声音克隆工作台状态接口 */
interface CloneVoiceState {
  /** 克隆配置 */
  config: CloneConfig;
  /** 输入文本 */
  inputText: string;
  /** 输出格式 */
  outputFormat: AudioFormat;
  /** 设置克隆方式 */
  setMethod: (method: CloneMethod) => void;
  /** 设置上传音频信息 */
  setAudioData: (base64: string, fileName: string, rawData: ArrayBuffer) => void;
  /** 设置音色描述 */
  setVoiceDescription: (desc: string) => void;
  /** 设置输入文本 */
  setInputText: (text: string) => void;
  /** 设置输出格式 */
  setOutputFormat: (format: AudioFormat) => void;
  /** 重置工作台状态 */
  reset: () => void;
}

/** 声音克隆 Store */
export const useCloneVoiceStore = create<CloneVoiceState>((set) => ({
  config: {
    method: CloneMethod.UPLOAD,
  },
  inputText: '',
  outputFormat: DEFAULTS.OUTPUT_FORMAT,

  setMethod: (method) =>
    set((state) => ({
      config: { ...state.config, method },
    })),

  setAudioData: (base64, fileName, rawData) =>
    set((state) => ({
      config: {
        ...state.config,
        audioBase64: base64,
        audioFileName: fileName,
        sampleAudioData: rawData,
      },
    })),

  setVoiceDescription: (desc) =>
    set((state) => ({
      config: { ...state.config, voiceDescription: desc },
    })),

  setInputText: (text) => set({ inputText: text }),

  setOutputFormat: (format) => set({ outputFormat: format }),

  reset: () =>
    set({
      config: { method: CloneMethod.UPLOAD },
      inputText: '',
      outputFormat: DEFAULTS.OUTPUT_FORMAT,
    }),
}));
