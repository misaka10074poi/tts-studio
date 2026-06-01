/**
 * Electron Preload 脚本
 * 通过 contextBridge 暴露安全的 Node API 给渲染进程
 */

const { contextBridge, ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ---- 工具函数 ----

/** 安全地将渲染进程传来的数据转为 Buffer */
function toBuffer(data) {
  console.log('[preload] toBuffer: type =', typeof data);
  console.log('[preload] toBuffer: data is ArrayBuffer?', data instanceof ArrayBuffer);
  console.log('[preload] toBuffer: data is Uint8Array?', data instanceof Uint8Array);
  console.log('[preload] toBuffer: data is Buffer?', Buffer.isBuffer(data));

  if (Buffer.isBuffer(data)) {
    console.log('[preload] toBuffer: already a Buffer, length =', data.length);
    return data;
  }

  if (data instanceof ArrayBuffer) {
    console.log('[preload] toBuffer: ArrayBuffer, byteLength =', data.byteLength);
    return Buffer.from(data);
  }

  if (data instanceof Uint8Array) {
    console.log('[preload] toBuffer: Uint8Array, length =', data.length);
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  // 如果数据经过序列化变成了普通对象或数组
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // 尝试从序列化后的对象重建
    const keys = Object.keys(data);
    console.log('[preload] toBuffer: plain object with keys:', keys.join(', '));
    if (data.data && data.type === 'Buffer') {
      // JSON 序列化的 Buffer
      console.log('[preload] toBuffer: reconstructing from JSON Buffer, data.data.length =', data.data.length);
      return Buffer.from(data.data);
    }
  }

  // 如果是有 length 属性的对象（类数组）
  if (data && typeof data === 'object' && typeof data.length === 'number') {
    console.log('[preload] toBuffer: array-like object, length =', data.length);
    return Buffer.from(data);
  }

  console.error('[preload] toBuffer: UNSUPPORTED data type!', typeof data, data?.constructor?.name);
  throw new Error(`不支持的数据类型: ${typeof data} (${data?.constructor?.name || 'unknown'})`);
}

// ---- 暴露 API ----

contextBridge.exposeInMainWorld('electronAPI', {
  /** 用系统资源管理器打开文件夹 */
  openPath: (dirPath) => {
    console.log('[preload] openPath called:', dirPath);

    // 验证路径是否存在
    if (!fs.existsSync(dirPath)) {
      console.error('[preload] openPath: path does NOT exist!', dirPath);
      // 尝试父目录
      const parentDir = path.dirname(dirPath);
      if (fs.existsSync(parentDir)) {
        console.log('[preload] openPath: falling back to parent dir:', parentDir);
        shell.openPath(parentDir);
        return;
      }
    }

    shell.openPath(dirPath);
  },

  /** 获取应用根目录 */
  getAppPath: () => {
    console.log('[preload] getAppPath called');
    return ipcRenderer.invoke('get-app-path');
  },

  /** 获取诊断信息 */
  getDiagInfo: () => {
    console.log('[preload] getDiagInfo called');
    return ipcRenderer.invoke('get-diag-info');
  },

  /** 确保输出目录存在 */
  ensureOutputDir: () => {
    console.log('[preload] ensureOutputDir called');
    return ipcRenderer.invoke('ensure-output-dir');
  },

  /** 将 ArrayBuffer/Uint8Array 写入文件 */
  writeFile: (filePath, data) => {
    console.log('[preload] ====== writeFile called ======');
    console.log('[preload] writeFile: filePath =', filePath);
    console.log('[preload] writeFile: data type =', typeof data);
    console.log('[preload] writeFile: data constructor =', data?.constructor?.name);

    try {
      const buffer = toBuffer(data);
      console.log('[preload] writeFile: buffer created, size =', buffer.length, 'bytes');

      const dir = path.dirname(filePath);
      console.log('[preload] writeFile: target dir =', dir);

      if (!fs.existsSync(dir)) {
        console.log('[preload] writeFile: dir does not exist, creating recursively...');
        fs.mkdirSync(dir, { recursive: true });
        console.log('[preload] writeFile: dir created, exists now?', fs.existsSync(dir));
      } else {
        console.log('[preload] writeFile: dir already exists');
      }

      fs.writeFileSync(filePath, buffer);
      console.log('[preload] writeFile: SUCCESS, wrote', buffer.length, 'bytes to', filePath);

      // 验证写入
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        console.log('[preload] writeFile: verify OK, file size =', stat.size, 'bytes');
        return { success: true, path: filePath, size: stat.size };
      } else {
        console.error('[preload] writeFile: VERIFY FAILED - file does NOT exist after write!');
        return { success: false, error: '文件写入后验证失败：文件不存在' };
      }
    } catch (err) {
      console.error('[preload] writeFile: FAILED -', err.message);
      console.error('[preload] writeFile: stack -', err.stack);
      return { success: false, error: err.message, path: filePath };
    }
  },

  /** 检查目录是否存在，不存在则创建 */
  ensureDir: (dirPath) => {
    console.log('[preload] ====== ensureDir called ======');
    console.log('[preload] ensureDir: dirPath =', dirPath);

    try {
      if (!fs.existsSync(dirPath)) {
        console.log('[preload] ensureDir: dir does not exist, creating recursively...');
        fs.mkdirSync(dirPath, { recursive: true });
        const created = fs.existsSync(dirPath);
        console.log('[preload] ensureDir: created?', created);
        if (!created) {
          return { success: false, error: '目录创建后验证失败' };
        }
      } else {
        console.log('[preload] ensureDir: dir already exists');
        const stat = fs.statSync(dirPath);
        console.log('[preload] ensureDir: isDirectory?', stat.isDirectory());
        if (!stat.isDirectory()) {
          return { success: false, error: '路径存在但不是目录: ' + dirPath };
        }
      }
      return { success: true, path: dirPath };
    } catch (err) {
      console.error('[preload] ensureDir: FAILED -', err.message);
      console.error('[preload] ensureDir: stack -', err.stack);
      return { success: false, error: err.message, path: dirPath };
    }
  },

  /** 将 Base64 音频写入文件 */
  writeBase64File: (filePath, base64Data) => {
    console.log('[preload] ====== writeBase64File called ======');
    console.log('[preload] writeBase64File: filePath =', filePath);
    console.log('[preload] writeBase64File: base64 data length =', base64Data?.length || 0);

    try {
      if (!base64Data || typeof base64Data !== 'string') {
        console.error('[preload] writeBase64File: invalid data type:', typeof base64Data);
        return { success: false, error: 'Base64 数据无效: 类型=' + typeof base64Data };
      }

      const buffer = Buffer.from(base64Data, 'base64');
      console.log('[preload] writeBase64File: decoded buffer size =', buffer.length, 'bytes');

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log('[preload] writeBase64File: dir does not exist, creating...');
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      console.log('[preload] writeBase64File: SUCCESS, wrote', buffer.length, 'bytes');

      // 验证写入
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        console.log('[preload] writeBase64File: verify OK, file size =', stat.size, 'bytes');
        return { success: true, path: filePath, size: stat.size };
      } else {
        return { success: false, error: '文件写入后验证失败：文件不存在' };
      }
    } catch (err) {
      console.error('[preload] writeBase64File: FAILED -', err.message);
      return { success: false, error: err.message, path: filePath };
    }
  },

  /** 读取文本文件内容（UTF-8） */
  readTextFile: (filePath) => {
    console.log('[preload] readTextFile called:', filePath);
    try {
      if (!fs.existsSync(filePath)) {
        console.log('[preload] readTextFile: file does not exist, returning empty');
        return { success: true, data: '' };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      console.log('[preload] readTextFile: SUCCESS, size =', data.length, 'chars');
      return { success: true, data };
    } catch (err) {
      console.error('[preload] readTextFile: FAILED -', err.message);
      return { success: false, error: err.message };
    }
  },

  /** 检查文件是否存在 */
  fileExists: (filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      let stat = null;
      if (exists) {
        stat = fs.statSync(filePath);
      }
      return {
        success: true,
        exists,
        isFile: stat ? stat.isFile() : false,
        isDirectory: stat ? stat.isDirectory() : false,
        size: stat ? stat.size : 0,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /** 列出目录内容 */
  listDir: (dirPath) => {
    console.log('[preload] listDir called:', dirPath);
    try {
      if (!fs.existsSync(dirPath)) {
        return { success: true, items: [], exists: false };
      }
      const items = fs.readdirSync(dirPath, { withFileTypes: true }).map((d) => ({
        name: d.name,
        isDirectory: d.isDirectory(),
        isFile: d.isFile(),
      }));
      console.log('[preload] listDir: found', items.length, 'items');
      return { success: true, items, exists: true, path: dirPath };
    } catch (err) {
      console.error('[preload] listDir: FAILED -', err.message);
      return { success: false, error: err.message };
    }
  },
});
