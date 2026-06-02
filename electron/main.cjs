const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

function getAppBaseDir() {
  return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
}

function getDefaultOutputDir() {
  return path.join(getAppBaseDir(), 'output');
}

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  if (Array.isArray(data)) return Buffer.from(data);
  return Buffer.from(data);
}

function success(extra = {}) {
  return { success: true, ...extra };
}

function failure(err) {
  return { success: false, error: err instanceof Error ? err.message : String(err) };
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function registerIpcHandlers() {
  ipcMain.handle('get-app-path', () => getAppBaseDir());

  ipcMain.handle('get-diag-info', () => {
    const outputDir = getDefaultOutputDir();
    let outputDirWritable = false;

    try {
      fs.mkdirSync(outputDir, { recursive: true });
      const probePath = path.join(outputDir, '.write-test');
      fs.writeFileSync(probePath, String(Date.now()), 'utf8');
      fs.unlinkSync(probePath);
      outputDirWritable = true;
    } catch {
      outputDirWritable = false;
    }

    return {
      portableExecutableFile: process.env.PORTABLE_EXECUTABLE_FILE || '',
      exePath: app.getPath('exe'),
      baseDir: getAppBaseDir(),
      outputDir,
      outputDirWritable,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
      execPath: process.execPath,
      __dirname,
      cwd: process.cwd(),
    };
  });

  ipcMain.handle('ensure-output-dir', () => {
    try {
      const outputDir = getDefaultOutputDir();
      fs.mkdirSync(outputDir, { recursive: true });
      return success({ path: outputDir });
    } catch (err) {
      return failure(err);
    }
  });

  ipcMain.handle('ensure-dir', (_event, dirPath) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return success({ path: dirPath });
    } catch (err) {
      return failure(err);
    }
  });

  ipcMain.handle('write-file', (_event, filePath, data) => {
    try {
      const buffer = toBuffer(data);
      ensureParentDir(filePath);
      fs.writeFileSync(filePath, buffer);
      return success({ path: filePath, size: buffer.length });
    } catch (err) {
      return failure(err);
    }
  });

  ipcMain.handle('write-base64-file', (_event, filePath, base64Data) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      ensureParentDir(filePath);
      fs.writeFileSync(filePath, buffer);
      return success({ path: filePath, size: buffer.length });
    } catch (err) {
      return failure(err);
    }
  });

  ipcMain.handle('read-text-file', (_event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) return success({ data: '' });
      return success({ data: fs.readFileSync(filePath, 'utf8') });
    } catch (err) {
      return failure(err);
    }
  });

  ipcMain.handle('file-exists', (_event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return success({ exists: false, isFile: false, isDirectory: false, size: 0 });
      }

      const stat = fs.statSync(filePath);
      return success({
        exists: true,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
      });
    } catch (err) {
      return {
        ...failure(err),
        exists: false,
        isFile: false,
        isDirectory: false,
        size: 0,
      };
    }
  });

  ipcMain.handle('list-dir', (_event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        return success({ exists: false, items: [], path: dirPath });
      }

      const items = fs.readdirSync(dirPath, { withFileTypes: true }).map((item) => ({
        name: item.name,
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
      }));

      return success({ exists: true, items, path: dirPath });
    } catch (err) {
      return { ...failure(err), exists: false, items: [], path: dirPath };
    }
  });

  ipcMain.handle('open-path', async (_event, targetPath) => {
    try {
      const error = await shell.openPath(targetPath);
      if (error) return { success: false, error };
      return success({ path: targetPath });
    } catch (err) {
      return failure(err);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: '配音工作室',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.once('ready-to-show', () => win.show());
}

registerIpcHandlers();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
