/**
 * 配音工作室 Electron 主进程
 */

process.env.NODE_OPTIONS = ''; // 清除可能干扰的全局 NODE_OPTIONS

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 860, minWidth: 900, minHeight: 600,
    title: '配音工作室 - TTS Studio', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function getOutputBaseDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  return path.dirname(app.getPath('exe'));
}

ipcMain.handle('get-app-path', () => getOutputBaseDir());

app.whenReady().then(() => {
  // 启动时创建输出目录
  const outDir = path.join(getOutputBaseDir(), 'output');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (_) {}
  createWindow();
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
