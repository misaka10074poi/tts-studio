/// <reference types="vite/client" />

/** 文件存在性检查结果 */
interface FileExistsResult {
  success: boolean;
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  error?: string;
}

/** 目录列表项 */
interface DirItem {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

/** 目录列表结果 */
interface ListDirResult {
  success: boolean;
  items: DirItem[];
  exists: boolean;
  path: string;
  error?: string;
}

/** 写入文件结果 */
interface WriteFileResult {
  success: boolean;
  error?: string;
  path?: string;
  size?: number;
}

/** 打开系统路径结果 */
interface OpenPathResult {
  success: boolean;
  path?: string;
  error?: string;
}

/** 诊断信息 */
interface DiagInfo {
  portableExecutableFile: string;
  exePath: string;
  baseDir: string;
  outputDir: string;
  outputDirWritable: boolean;
  isPackaged: boolean;
  resourcesPath: string;
  execPath: string;
  __dirname: string;
  cwd: string;
}

/** Electron API 桥接接口 */
interface ElectronAPI {
  /** 用系统资源管理器打开文件夹 */
  openPath: (dirPath: string) => Promise<OpenPathResult>;
  /** 获取应用根目录（异步 IPC） */
  getAppPath: () => Promise<string>;
  /** 获取诊断信息（异步 IPC） */
  getDiagInfo: () => Promise<DiagInfo>;
  /** 确保输出根目录存在（异步 IPC） */
  ensureOutputDir: () => Promise<{ success: boolean; path?: string; error?: string }>;
  /** 将 ArrayBuffer/Uint8Array 写入文件 */
  writeFile: (filePath: string, data: ArrayBuffer | Uint8Array) => Promise<WriteFileResult>;
  /** 检查目录是否存在，不存在则创建 */
  ensureDir: (dirPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  /** 将 Base64 音频写入文件 */
  writeBase64File: (filePath: string, base64Data: string) => Promise<WriteFileResult>;
  /** 读取文本文件内容（UTF-8） */
  readTextFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  /** 检查文件/目录是否存在 */
  fileExists: (filePath: string) => Promise<FileExistsResult>;
  /** 列出目录内容 */
  listDir: (dirPath: string) => Promise<ListDirResult>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
