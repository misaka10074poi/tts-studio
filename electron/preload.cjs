/**
 * Electron Preload 脚本
 */

// 启动验证
try { require('fs').writeFileSync('C:\\Users\\46027\\Desktop\\PRELOAD_LOADED.txt', 'OK ' + new Date().toISOString()); } catch(_) {}

const { contextBridge, ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/** 安全转换数据为 Buffer */
function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (data instanceof Uint8Array) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  return Buffer.from(data);
}

contextBridge.exposeInMainWorld('electronAPI', {
  openPath: (dirPath) => shell.openPath(dirPath),

  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  writeFile: async (filePath, data) => {
    try {
      const buffer = toBuffer(data);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, buffer);
      return { success: true, size: buffer.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  ensureDir: async (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  writeBase64File: async (filePath, base64Data) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, buffer);
      return { success: true, size: buffer.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  readTextFile: async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) return { success: true, data: '' };
      return { success: true, data: fs.readFileSync(filePath, 'utf-8') };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
});
