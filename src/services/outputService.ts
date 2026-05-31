/**
 * 输出目录管理服务
 * 操作本地文件系统通过 window.electronAPI 桥接
 * 所有文件操作在非 Electron 环境下自动降级为 no-op
 */

import { AudioFormat, OutputTaskMeta, HistoryIndexEntry, HistoryIndex } from '../types';
import { DEFAULTS } from '../utils/constants';
import { useApiConfigStore } from '../store/apiConfigStore';

/** 检查是否在 Electron 环境中且有可用 API */
function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

/**
 * 获取输出根目录的绝对路径
 * 在 Electron 中为 app.getAppPath() + outputDir
 * 浏览器环境返回配置的相对路径
 */
export async function getOutputBaseDir(): Promise<string> {
  const { config } = useApiConfigStore.getState();
  const outputDir = config.outputDir?.trim() || DEFAULTS.OUTPUT_DIR;

  if (hasElectronAPI()) {
    const appPath = await window.electronAPI!.getAppPath();
    // 相对路径拼接到 appPath
    if (outputDir.startsWith('./') || (!outputDir.startsWith('/') && !/^[A-Za-z]:/.test(outputDir))) {
      // 统一使用正斜杠，Electron 在 Windows 上也兼容
      const cleanAppPath = appPath.replace(/\\/g, '/');
      const cleanDir = outputDir.replace(/^\.\//, '');
      return `${cleanAppPath}/${cleanDir}`;
    }
    return outputDir;
  }

  return outputDir;
}

/**
 * 根据源文本生成任务目录名
 * 取首行前 8 字 + YYYY-MM-DD_HHmmss 时间戳
 * @param sourceText - 源文本
 * @returns 任务目录名
 */
export function generateTaskName(sourceText: string): string {
  const firstLine = sourceText.trim().split('\n')[0];
  const preview = firstLine.replace(/[<>:"/\\|?*]/g, '').substring(0, 8).trim() || '未命名';
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${preview}_${timestamp}`;
}

/**
 * 创建任务输出子目录
 * @param taskName - 任务目录名
 * @returns 完整的任务目录路径
 */
export async function createTaskDir(taskName: string): Promise<string> {
  const baseDir = await getOutputBaseDir();
  const taskDir = `${baseDir.replace(/\\/g, '/')}/${taskName}`;

  if (hasElectronAPI()) {
    const result = await window.electronAPI!.ensureDir(taskDir);
    if (!result.success) {
      console.error('创建任务目录失败:', result.error);
      throw new Error(`创建目录失败: ${result.error}`);
    }
    // 同时创建 segments 子目录
    const segResult = await window.electronAPI!.ensureDir(`${taskDir}/segments`);
    if (!segResult.success) {
      console.error('创建 segments 子目录失败:', segResult.error);
      throw new Error(`创建 segments 子目录失败: ${segResult.error}`);
    }
  }

  return taskDir;
}

/**
 * 保存单个分段的音频文件
 * @param taskDir - 任务目录路径
 * @param index - 分段序号（从 0 开始）
 * @param audioBase64 - Base64 编码的音频数据
 */
export async function saveSegment(
  taskDir: string,
  index: number,
  audioBase64: string,
  format: AudioFormat = AudioFormat.MP3
): Promise<void> {
  if (!hasElectronAPI()) return;

  const cleanDir = taskDir.replace(/\\/g, '/');
  const paddedIndex = String(index + 1).padStart(3, '0');
  const extension = format === AudioFormat.WAV ? 'wav' : 'mp3';
  const filePath = `${cleanDir}/segments/segment_${paddedIndex}.${extension}`;

  const result = window.electronAPI!.writeBase64File(filePath, audioBase64);
  if (!result.success) {
    console.error('保存分段音频失败:', result.error);
    throw new Error(`保存分段音频失败: ${result.error}`);
  }
}

/**
 * 保存合并后的完整音频文件
 * @param taskDir - 任务目录路径
 * @param wavBuffer - WAV 格式的 ArrayBuffer
 */
export async function saveMergedAudio(
  taskDir: string,
  audioBuffer: ArrayBuffer,
  format: AudioFormat = AudioFormat.WAV
): Promise<void> {
  if (!hasElectronAPI()) return;

  const cleanDir = taskDir.replace(/\\/g, '/');
  const extension = format === AudioFormat.MP3 ? 'mp3' : 'wav';
  const filePath = `${cleanDir}/full_output.${extension}`;

  const result = window.electronAPI!.writeFile(filePath, audioBuffer);
  if (!result.success) {
    console.error('保存合并音频失败:', result.error);
    throw new Error(`保存合并音频失败: ${result.error}`);
  }
}

/**
 * 保存输出任务元数据 JSON 文件
 * @param taskDir - 任务目录路径
 * @param meta - 输出任务元数据
 */
export async function saveMetadata(
  taskDir: string,
  meta: OutputTaskMeta
): Promise<void> {
  if (!hasElectronAPI()) return;

  const cleanDir = taskDir.replace(/\\/g, '/');
  const filePath = `${cleanDir}/metadata.json`;
  const jsonStr = JSON.stringify(meta, null, 2);

  // 使用 writeFile 写入 UTF-8 文本
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonStr).buffer;

  const result = window.electronAPI!.writeFile(filePath, buffer);
  if (!result.success) {
    console.error('保存元数据失败:', result.error);
    throw new Error(`保存元数据失败: ${result.error}`);
  }
}

/**
 * 更新历史索引文件
 * 读取 output/history_index.json，追加新条目，写回
 * @param entry - 历史索引条目
 */
export async function updateHistoryIndex(entry: HistoryIndexEntry): Promise<void> {
  if (!hasElectronAPI()) return;

  const baseDir = await getOutputBaseDir();
  const cleanBase = baseDir.replace(/\\/g, '/');
  const indexPath = `${cleanBase}/history_index.json`;

  let index: HistoryIndex = { version: 1, tasks: [] };

  // 尝试读取已有索引
  const readResult = window.electronAPI!.readTextFile(indexPath);
  if (readResult.success && readResult.data) {
    try {
      const parsed = JSON.parse(readResult.data) as HistoryIndex;
      if (parsed && Array.isArray(parsed.tasks)) {
        index = parsed;
      }
    } catch {
      // 解析失败则新建索引
      index = { version: 1, tasks: [] };
    }
  }

  // 去重：如果同名 taskId 已存在则跳过
  const exists = index.tasks.some((t) => t.taskId === entry.taskId);
  if (!exists) {
    index.tasks.unshift(entry);
    // 最多保留 100 条历史
    if (index.tasks.length > 100) {
      index.tasks = index.tasks.slice(0, 100);
    }
  }

  // 写回
  const jsonStr = JSON.stringify(index, null, 2);
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonStr).buffer;

  const writeResult = window.electronAPI!.writeFile(indexPath, buffer);
  if (!writeResult.success) {
    console.error('更新历史索引失败:', writeResult.error);
  }
}

/**
 * 在系统资源管理器中打开输出目录
 * @param taskDir - 任务目录路径（可选，不传则打开根输出目录）
 */
export async function openOutputDir(taskDir?: string): Promise<void> {
  if (!hasElectronAPI()) {
    console.warn('非 Electron 环境，无法打开目录');
    return;
  }

  const target = taskDir || await getOutputBaseDir();
  console.log('[outputService] openOutputDir:', target);
  window.electronAPI!.openPath(target);
}
