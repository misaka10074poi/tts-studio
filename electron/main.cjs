const path = require('path');
const fs = require('fs');

try { fs.writeFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'START\n', 'utf8'); } catch(_) {}

setTimeout(() => {
  try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'TIMEOUT\n', 'utf8'); } catch(_) {}
  
  // require electron
  let e, app, BrowserWindow, ipcMain;
  try { e = require('electron'); } catch(err) { try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'REQ_ERR=' + err.message + '\n', 'utf8'); } catch(_) {} }
  try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'e_type=' + typeof e + '\n', 'utf8'); } catch(_) {}
  
  if (e && typeof e === 'object') {
    app = e.app;
    BrowserWindow = e.BrowserWindow;
    ipcMain = e.ipcMain;
  }
  
  try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'app=' + !!app + ' bw=' + !!BrowserWindow + '\n', 'utf8'); } catch(_) {}
  
  if (!app || !BrowserWindow) {
    try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'FATAL\n', 'utf8'); } catch(_) {}
    process.exit(1);
  }
  
  function getOutputBaseDir() {
    return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
  }
  
  try {
    const od = path.join(getOutputBaseDir(), 'output');
    fs.mkdirSync(od, { recursive: true });
    fs.writeFileSync(path.join(od, 'STARTUP.txt'), new Date().toISOString());
    try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'OUT=' + od + '\n', 'utf8'); } catch(_) {}
  } catch(e2) {
    try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'OUT_ERR=' + e2.message + '\n', 'utf8'); } catch(_) {}
  }
  
  if (ipcMain) ipcMain.handle('get-app-path', () => getOutputBaseDir());
  
  app.whenReady().then(() => {
    try { fs.appendFileSync('C:\\Users\\46027\\Desktop\\E-DIAG.txt', 'READY\n', 'utf8'); } catch(_) {}
    let win = new BrowserWindow({
      width: 1280, height: 860, minWidth: 900, minHeight: 600,
      title: '配音工作室', show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false, contextIsolation: true,
      },
    });
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    win.once('ready-to-show', () => win.show());
  });
}, 1000);
