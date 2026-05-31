/// <reference types="vite/client" />

/** Electron API 桥接接口 */
interface ElectronAPI {
  /** 用系统资源管理器打开文件夹 */
  openPath: (dirPath: string) => void;
  /** 获取应用根目录（异步 IPC） */
  getAppPath: () => Promise<string>;
  /** 将 ArrayBuffer 写入文件 */
  writeFile: (filePath: string, data: ArrayBuffer) => { success: boolean; error?: string };
  /** 检查目录是否存在，不存在则创建 */
  ensureDir: (dirPath: string) => { success: boolean; error?: string };
  /** 将 Base64 音频写入文件 */
  writeBase64File: (filePath: string, base64Data: string) => { success: boolean; error?: string };
  /** 读取文本文件内容（UTF-8） */
  readTextFile: (filePath: string) => { success: boolean; data?: string; error?: string };
}

interface Window {
  electronAPI?: ElectronAPI;
}
