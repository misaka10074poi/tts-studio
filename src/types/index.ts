/**
 * 核心类型定义文件
 * 包含所有业务实体的 TypeScript 类型与枚举
 */

/** 音频输出格式 */
export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  PCM16 = 'pcm16',
}

/** 任务执行状态 */
export enum TaskStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** 声音克隆方式 */
export enum CloneMethod {
  UPLOAD = 'upload',
  DESCRIBE = 'describe',
}

/** TTS 模型类型 */
export enum TtsModel {
  STANDARD = 'mimo-v2.5-tts',
  VOICE_CLONE = 'mimo-v2.5-tts-voiceclone',
  VOICE_DESIGN = 'mimo-v2.5-tts-voicedesign',
}

/** 内置音色档案 */
export interface VoiceProfile {
  /** 音色唯一标识 */
  id: string;
  /** 英文名称 */
  name: string;
  /** 中文名称 */
  nameZh: string;
  /** 音色描述 */
  description: string;
  /** 音色类别 */
  category: 'chinese' | 'english';
  /** 传递给 API 的 voice 参数值 */
  voiceParam: string;
  /** 试听样本 URL */
  sampleUrl: string;
}

/** 文本拆分后的段 */
export interface TextSegment {
  /** 段落唯一标识 */
  id: string;
  /** 段落序号（从 0 开始） */
  index: number;
  /** 段落文本内容 */
  text: string;
  /** 段落字符数 */
  charCount: number;
}

/** 任务队列中的单条任务 */
export interface TaskItem {
  /** 任务唯一标识 */
  id: string;
  /** 关联的文本段 ID */
  segmentId: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 生成的音频 Base64 编码 */
  audioBase64?: string;
  /** 解码后的音频数据 */
  audioData?: ArrayBuffer;
  /** 音频时长（秒） */
  duration?: number;
  /** 错误信息 */
  errorMessage?: string;
  /** 已重试次数 */
  retryCount: number;
}

/** 声音克隆配置 */
export interface CloneConfig {
  /** 克隆方式 */
  method: CloneMethod;
  /** 上传音频的 Base64 编码 */
  audioBase64?: string;
  /** 上传音频的文件名 */
  audioFileName?: string;
  /** 音色描述文字（用于 voicedesign） */
  voiceDescription?: string;
  /** 上传音频的原始 ArrayBuffer */
  sampleAudioData?: ArrayBuffer;
}

/** TTS 请求参数 */
export interface TtsRequest {
  /** 使用的模型 */
  model: TtsModel;
  /** 要合成的文本 */
  text: string;
  /** 输出格式 */
  format: AudioFormat;
  /** 音色参数（标准 TTS 传音色名，克隆传 DataURL） */
  voice?: string;
  /** 音色描述（voicedesign 模式使用） */
  voiceDescription?: string;
}

/** TTS API 响应 */
export interface TtsApiResponse {
  /** 是否成功 */
  success: boolean;
  /** 音频 Base64 编码 */
  audioBase64?: string;
  /** 错误信息 */
  error?: string;
}

/** API 配置 */
export interface ApiConfig {
  /** API 端点地址 */
  endpoint: string;
  /** API Key */
  apiKey: string;
  /** 最大并发数 */
  maxConcurrency: number;
  /** 输出目录 */
  outputDir: string;
}

/** 拆分规则类型 */
export enum SplitRuleType {
  CHARS = 'chars',
  PARAGRAPH = 'paragraph',
}

/** 拆分规则 */
export interface SplitRule {
  type: SplitRuleType;
  value: number | string;
}

/** 输出段元数据 */
export interface OutputSegmentMeta {
  index: number;
  charCount: number;
  textPreview: string;
}

/** 输出任务元数据 */
export interface OutputTaskMeta {
  taskId: string;
  createdAt: string;
  voiceName: string;
  voiceId: string;
  totalSegments: number;
  totalChars: number;
  splitRule: SplitRule;
  segments: OutputSegmentMeta[];
}

/** 历史索引条目 */
export interface HistoryIndexEntry {
  taskId: string;
  dirName: string;
  createdAt: string;
  voiceName: string;
  totalSegments: number;
}

/** 历史索引 */
export interface HistoryIndex {
  version: number;
  tasks: HistoryIndexEntry[];
}

/** 项目状态 */
export type ProjectStatus = 'ready' | 'generating' | 'completed' | 'failed';

/** 完整的配音项目（任务归档） */
export interface TtsProject {
  /** 项目唯一标识 */
  id: string;
  /** 项目标题（自动取首行或手动设置） */
  title: string;
  /** 原始文本 */
  sourceText: string;
  /** 文本分段 */
  segments: TextSegment[];
  /** 使用的音色 ID */
  voiceId: string;
  /** 音色显示名 */
  voiceName: string;
  /** 输出格式 */
  outputFormat: AudioFormat;
  /** 生成任务项 */
  taskItems: TaskItem[];
  /** 项目状态 */
  status: ProjectStatus;
  /** 创建时间戳 */
  createdAt: number;
  /** 完成时间戳 */
  completedAt?: number;
  /** 来源文件名（上传时） */
  sourceFile?: string;
  /** 总字数 */
  totalChars: number;
  /** 总段数 */
  segmentCount: number;
  /** 输出目录路径 */
  taskDir?: string;
}
