/**
 * 配音工作室 Electron 主进程
 * 加载 Vite 构建产物，提供独立桌面窗口
 */

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: '配音工作室 - TTS Studio',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载页面
  if (process.env.VITE_DEV) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：dist/ 在 electron/ 的上级
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (process.env.VITE_DEV) {
      console.log('Loading:', indexPath);
    }
    mainWindow.loadFile(indexPath);
  }

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 页面就绪后显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/** 获取用户可见的输出根目录（便携版返回 exe 实际所在目录，而非临时解压目录） */
function getOutputBaseDir() {
  // 便携版：electron-builder 设置此环境变量指向原始 exe 位置
  if (process.env.PORTABLE_EXECUTABLE_FILE) {
    return path.dirname(process.env.PORTABLE_EXECUTABLE_FILE);
  }
  // 开发/非便携模式：exe 路径即真实路径
  return path.dirname(app.getPath('exe'));
}

ipcMain.handle('get-app-path', () => getOutputBaseDir());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
