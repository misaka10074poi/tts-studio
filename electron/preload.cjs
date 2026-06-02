const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openPath: (dirPath) => ipcRenderer.invoke('open-path', dirPath),

  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  getDiagInfo: () => ipcRenderer.invoke('get-diag-info'),

  ensureOutputDir: () => ipcRenderer.invoke('ensure-output-dir'),

  ensureDir: (dirPath) => ipcRenderer.invoke('ensure-dir', dirPath),

  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),

  writeBase64File: (filePath, base64Data) =>
    ipcRenderer.invoke('write-base64-file', filePath, base64Data),

  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),

  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

  listDir: (dirPath) => ipcRenderer.invoke('list-dir', dirPath),
});
