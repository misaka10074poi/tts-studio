/**
 * Electron Preload 脚本
 * 通过 contextBridge 暴露安全的 Node API 给渲染进程
 */

const { contextBridge, ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  /** 用系统资源管理器打开文件夹 */
  openPath: (dirPath) => {
    shell.openPath(dirPath);
  },

  /** 获取应用根目录 */
  getAppPath: () => {
    return ipcRenderer.invoke('get-app-path');
  },

  /** 将 ArrayBuffer 写入文件 */
  writeFile: (filePath, data) => {
    try {
      // data 是 ArrayBuffer（通过 IPC 传递后变为 Uint8Array）
      const buffer = Buffer.from(data);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /** 检查目录是否存在，不存在则创建 */
  ensureDir: (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /** 将 Base64 音频写入文件 */
  writeBase64File: (filePath, base64Data) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /** 读取文本文件内容（UTF-8） */
  readTextFile: (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: true, data: '' };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
});
