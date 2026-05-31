/**
 * 内置音色配置
 * 定义 9 种预设音色档案，含试听样本
 * TODO: Electron 环境需要运行时通过 getAppPath() 拼接绝对路径
 */

import { VoiceProfile } from '../types';

const SAMPLES = './samples';

/** 全部内置音色列表 */
export const BUILTIN_VOICES: VoiceProfile[] = [
  {
    id: 'mimo_default',
    name: 'Default',
    nameZh: '默认',
    description: '温和自然的女声',
    category: 'chinese',
    voiceParam: 'mimo_default',
    sampleUrl: `${SAMPLES}/mimo_default.mp3`,
  },
  {
    id: '冰糖',
    name: 'Bingtang',
    nameZh: '冰糖',
    description: '甜美可爱的女声',
    category: 'chinese',
    voiceParam: '冰糖',
    sampleUrl: `${SAMPLES}/冰糖.mp3`,
  },
  {
    id: '茉莉',
    name: 'Moli',
    nameZh: '茉莉',
    description: '温柔优雅的女声',
    category: 'chinese',
    voiceParam: '茉莉',
    sampleUrl: `${SAMPLES}/茉莉.mp3`,
  },
  {
    id: '苏打',
    name: 'Suda',
    nameZh: '苏打',
    description: '清爽活泼的女声',
    category: 'chinese',
    voiceParam: '苏打',
    sampleUrl: `${SAMPLES}/苏打.mp3`,
  },
  {
    id: '白桦',
    name: 'Baihua',
    nameZh: '白桦',
    description: '沉稳知性的女声',
    category: 'chinese',
    voiceParam: '白桦',
    sampleUrl: `${SAMPLES}/白桦.mp3`,
  },
  {
    id: 'Mia',
    name: 'Mia',
    nameZh: 'Mia',
    description: '英文女声',
    category: 'english',
    voiceParam: 'Mia',
    sampleUrl: `${SAMPLES}/Mia.mp3`,
  },
  {
    id: 'Chloe',
    name: 'Chloe',
    nameZh: 'Chloe',
    description: '英文女声',
    category: 'english',
    voiceParam: 'Chloe',
    sampleUrl: `${SAMPLES}/Chloe.mp3`,
  },
  {
    id: 'Milo',
    name: 'Milo',
    nameZh: 'Milo',
    description: '英文男声',
    category: 'english',
    voiceParam: 'Milo',
    sampleUrl: `${SAMPLES}/Milo.mp3`,
  },
  {
    id: 'Dean',
    name: 'Dean',
    nameZh: 'Dean',
    description: '英文男声',
    category: 'english',
    voiceParam: 'Dean',
    sampleUrl: `${SAMPLES}/Dean.mp3`,
  },
];
