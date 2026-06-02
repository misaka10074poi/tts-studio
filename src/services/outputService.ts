/**
 * 输出目录管理服务
 * 操作本地文件系统通过 window.electronAPI 桥接
 * 非 Electron 环境下不执行本地文件系统操作
 */

import { AudioFormat, OutputTaskMeta, HistoryIndexEntry, HistoryIndex } from '../types';
import { DEFAULTS } from '../utils/constants';
import { useApiConfigStore } from '../store/apiConfigStore';

/** 检查是否在 Electron 环境中且有可用 API */
function hasElectronAPI(): boolean {
  const has = typeof window !== 'undefined' && !!window.electronAPI;
  console.log('[outputService] hasElectronAPI:', has, 'window:', typeof window !== 'undefined', 'electronAPI:', !!window.electronAPI);
  return has;
}

/**
 * 获取输出根目录的绝对路径
 * 在 Electron 中为 app.getAppPath() + outputDir
 * 浏览器环境返回配置的相对路径
 */
export async function getOutputBaseDir(): Promise<string> {
  const { config } = useApiConfigStore.getState();
  const outputDir = config.outputDir?.trim() || DEFAULTS.OUTPUT_DIR;

  console.log('[outputService] getOutputBaseDir: config.outputDir =', config.outputDir);
  console.log('[outputService] getOutputBaseDir: DEFAULTS.OUTPUT_DIR =', DEFAULTS.OUTPUT_DIR);
  console.log('[outputService] getOutputBaseDir: effective outputDir =', outputDir);

  if (hasElectronAPI()) {
    console.log('[outputService] getOutputBaseDir: calling window.electronAPI.getAppPath()...');
    const appPath = await window.electronAPI!.getAppPath();
    console.log('[outputService] getOutputBaseDir: appPath from electron =', appPath);

    // 相对路径拼接到 appPath
    if (outputDir.startsWith('./') || (!outputDir.startsWith('/') && !/^[A-Za-z]:/.test(outputDir))) {
      // 统一使用正斜杠，Electron 在 Windows 上也兼容
      const cleanAppPath = appPath.replace(/\\/g, '/');
      const cleanDir = outputDir.replace(/^\.\//, '');
      const fullPath = `${cleanAppPath}/${cleanDir}`;
      console.log('[outputService] getOutputBaseDir: relative path, resolved to:', fullPath);
      return fullPath;
    }

    // 绝对路径，直接使用
    console.log('[outputService] getOutputBaseDir: absolute path, using as-is:', outputDir);

    // 尝试获取诊断信息
    try {
      const diag = await window.electronAPI!.getDiagInfo();
      console.log('[outputService] getOutputBaseDir: DIAGNOSTICS =', JSON.stringify(diag, null, 2));
    } catch (e) {
      console.warn('[outputService] getOutputBaseDir: failed to get diagnostics:', e);
    }

    return outputDir;
  }

  console.warn('[outputService] getOutputBaseDir: NOT in Electron, returning raw outputDir:', outputDir);
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
  const name = `${preview}_${timestamp}`;
  console.log('[outputService] generateTaskName:', name);
  return name;
}

/**
 * 创建任务输出子目录
 * @param taskName - 任务目录名
 * @returns 完整的任务目录路径
 */
export async function createTaskDir(taskName: string): Promise<string> {
  console.log('[outputService] createTaskDir: taskName =', taskName);

  const baseDir = await getOutputBaseDir();
  const taskDir = `${baseDir.replace(/\\/g, '/')}/${taskName}`;
  console.log('[outputService] createTaskDir: baseDir =', baseDir);
  console.log('[outputService] createTaskDir: taskDir =', taskDir);

  if (hasElectronAPI()) {
    console.log('[outputService] createTaskDir: ensuring task dir exists...');
    const result = await window.electronAPI!.ensureDir(taskDir);
    console.log('[outputService] createTaskDir: ensureDir result:', JSON.stringify(result));

    if (!result.success) {
      console.error('[outputService] createTaskDir: FAILED to create task dir:', result.error);
      throw new Error(`创建目录失败: ${result.error} (路径: ${taskDir})`);
    }

    // 同时创建 segments 子目录
    const segDir = `${taskDir}/segments`;
    console.log('[outputService] createTaskDir: ensuring segments dir...');
    const segResult = await window.electronAPI!.ensureDir(segDir);
    console.log('[outputService] createTaskDir: segments ensureDir result:', JSON.stringify(segResult));

    if (!segResult.success) {
      console.error('[outputService] createTaskDir: FAILED to create segments dir:', segResult.error);
      throw new Error(`创建 segments 子目录失败: ${segResult.error} (路径: ${segDir})`);
    }

    // 验证目录确实创建了
    const verifyResult = await window.electronAPI!.listDir(taskDir);
    console.log('[outputService] createTaskDir: verify dir contents:', JSON.stringify(verifyResult));
  } else {
    console.warn('[outputService] createTaskDir: NOT in Electron, skipping directory creation! Files will NOT be saved!');
  }

  console.log('[outputService] createTaskDir: SUCCESS, returning taskDir =', taskDir);
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
  console.log('[outputService] saveSegment: index =', index, 'format =', format);
  console.log('[outputService] saveSegment: taskDir =', taskDir);
  console.log('[outputService] saveSegment: audioBase64 length =', audioBase64?.length || 0);

  if (!hasElectronAPI()) {
    console.error('[outputService] saveSegment: NOT in Electron, cannot save segment!');
    throw new Error('非 Electron 环境，无法保存音频文件');
  }

  const cleanDir = taskDir.replace(/\\/g, '/');
  const paddedIndex = String(index + 1).padStart(3, '0');
  const extension = format === AudioFormat.WAV ? 'wav' : 'mp3';
  const filePath = `${cleanDir}/segments/segment_${paddedIndex}.${extension}`;

  console.log('[outputService] saveSegment: writing to', filePath);

  const result = await window.electronAPI!.writeBase64File(filePath, audioBase64);
  console.log('[outputService] saveSegment: writeBase64File result:', JSON.stringify(result));

  if (!result.success) {
    console.error('[outputService] saveSegment: FAILED -', result.error);
    throw new Error(`保存分段音频失败: ${result.error} (文件: ${filePath})`);
  }

  console.log('[outputService] saveSegment: SUCCESS, saved', result.size, 'bytes');
}

/**
 * 保存合并后的完整音频文件
 * @param taskDir - 任务目录路径
 * @param audioBuffer - 音频 ArrayBuffer
 */
export async function saveMergedAudio(
  taskDir: string,
  audioBuffer: ArrayBuffer,
  format: AudioFormat = AudioFormat.WAV
): Promise<void> {
  console.log('[outputService] saveMergedAudio: format =', format);
  console.log('[outputService] saveMergedAudio: taskDir =', taskDir);
  console.log('[outputService] saveMergedAudio: audioBuffer byteLength =', audioBuffer?.byteLength || 0);

  if (!hasElectronAPI()) {
    console.error('[outputService] saveMergedAudio: NOT in Electron, cannot save merged audio!');
    throw new Error('非 Electron 环境，无法保存音频文件');
  }

  if (!audioBuffer || audioBuffer.byteLength === 0) {
    console.error('[outputService] saveMergedAudio: EMPTY audio buffer!');
    throw new Error('音频数据为空，无法保存');
  }

  const cleanDir = taskDir.replace(/\\/g, '/');
  const extension = format === AudioFormat.MP3 ? 'mp3' : 'wav';
  const filePath = `${cleanDir}/full_output.${extension}`;

  console.log('[outputService] saveMergedAudio: writing to', filePath);

  // 将 ArrayBuffer 转为 Uint8Array 以便通过 contextBridge 传递
  // contextBridge 对 ArrayBuffer 的序列化在不同 Electron 版本中可能不一致，
  // 使用 Uint8Array 更加可靠
  const uint8Data = new Uint8Array(audioBuffer);
  console.log('[outputService] saveMergedAudio: converted to Uint8Array, length =', uint8Data.length);

  const result = await window.electronAPI!.writeFile(filePath, uint8Data);
  console.log('[outputService] saveMergedAudio: writeFile result:', JSON.stringify(result));

  if (!result.success) {
    console.error('[outputService] saveMergedAudio: FAILED -', result.error);
    throw new Error(`保存合并音频失败: ${result.error} (文件: ${filePath})`);
  }

  console.log('[outputService] saveMergedAudio: SUCCESS, saved', result.size, 'bytes');
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
  console.log('[outputService] saveMetadata: taskDir =', taskDir);
  console.log('[outputService] saveMetadata: meta.taskId =', meta.taskId);

  if (!hasElectronAPI()) {
    console.error('[outputService] saveMetadata: NOT in Electron, cannot save metadata!');
    throw new Error('非 Electron 环境，无法保存元数据');
  }

  const cleanDir = taskDir.replace(/\\/g, '/');
  const filePath = `${cleanDir}/metadata.json`;
  const jsonStr = JSON.stringify(meta, null, 2);

  console.log('[outputService] saveMetadata: writing to', filePath);

  // 使用 Uint8Array 以确保通过 contextBridge 可靠传递
  const encoder = new TextEncoder();
  const uint8Data = encoder.encode(jsonStr);

  const result = await window.electronAPI!.writeFile(filePath, uint8Data);
  console.log('[outputService] saveMetadata: writeFile result:', JSON.stringify(result));

  if (!result.success) {
    console.error('[outputService] saveMetadata: FAILED -', result.error);
    throw new Error(`保存元数据失败: ${result.error} (文件: ${filePath})`);
  }

  console.log('[outputService] saveMetadata: SUCCESS');
}

/**
 * 更新历史索引文件
 * 读取 output/history_index.json，追加新条目，写回
 * @param entry - 历史索引条目
 */
export async function updateHistoryIndex(entry: HistoryIndexEntry): Promise<void> {
  console.log('[outputService] updateHistoryIndex: entry.taskId =', entry.taskId);

  if (!hasElectronAPI()) {
    console.warn('[outputService] updateHistoryIndex: NOT in Electron, skipping');
    return;
  }

  const baseDir = await getOutputBaseDir();
  const cleanBase = baseDir.replace(/\\/g, '/');
  const indexPath = `${cleanBase}/history_index.json`;

  console.log('[outputService] updateHistoryIndex: indexPath =', indexPath);

  let index: HistoryIndex = { version: 1, tasks: [] };

  // 尝试读取已有索引
  const readResult = await window.electronAPI!.readTextFile(indexPath);
  console.log('[outputService] updateHistoryIndex: readResult =', JSON.stringify({ success: readResult.success, dataLength: readResult.data?.length || 0 }));

  if (readResult.success && readResult.data) {
    try {
      const parsed = JSON.parse(readResult.data) as HistoryIndex;
      if (parsed && Array.isArray(parsed.tasks)) {
        index = parsed;
        console.log('[outputService] updateHistoryIndex: loaded existing index,', index.tasks.length, 'entries');
      }
    } catch {
      console.warn('[outputService] updateHistoryIndex: failed to parse existing index, creating new');
      index = { version: 1, tasks: [] };
    }
  }

  // 去重：如果同名 taskId 已存在则跳过
  const exists = index.tasks.some((t) => t.taskId === entry.taskId);
  if (!exists) {
    index.tasks.unshift(entry);
    if (index.tasks.length > 100) {
      index.tasks = index.tasks.slice(0, 100);
    }
    console.log('[outputService] updateHistoryIndex: added entry, now', index.tasks.length, 'entries');
  } else {
    console.log('[outputService] updateHistoryIndex: entry already exists, skipping');
  }

  // 写回
  const jsonStr = JSON.stringify(index, null, 2);
  const encoder = new TextEncoder();
  const uint8Data = encoder.encode(jsonStr);

  const writeResult = await window.electronAPI!.writeFile(indexPath, uint8Data);
  console.log('[outputService] updateHistoryIndex: writeResult =', JSON.stringify(writeResult));

  if (!writeResult.success) {
    console.error('[outputService] updateHistoryIndex: FAILED to write index:', writeResult.error);
  } else {
    console.log('[outputService] updateHistoryIndex: SUCCESS');
  }
}

/**
 * 在系统资源管理器中打开输出目录
 * @param taskDir - 任务目录路径（可选，不传则打开根输出目录）
 */
export async function openOutputDir(taskDir?: string): Promise<void> {
  if (!hasElectronAPI()) {
    console.warn('[outputService] openOutputDir: 非 Electron 环境，无法打开目录');
    return;
  }

  const target = taskDir || await getOutputBaseDir();
  console.log('[outputService] openOutputDir: target =', target);

  // 先检查路径是否存在
  const checkResult = await window.electronAPI!.fileExists(target);
  console.log('[outputService] openOutputDir: fileExists check:', JSON.stringify(checkResult));

  if (!checkResult.success || !checkResult.exists) {
    console.warn('[outputService] openOutputDir: path does NOT exist!', target);
    // 尝试父目录
    const parentDir = target.substring(0, target.lastIndexOf('/'));
    if (parentDir) {
      console.log('[outputService] openOutputDir: trying parent dir:', parentDir);
      await window.electronAPI!.openPath(parentDir);
      return;
    }
  }

  await window.electronAPI!.openPath(target);
}
