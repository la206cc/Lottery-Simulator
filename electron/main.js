const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: '彩票摇号模拟器',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  const indexPath = path.join(__dirname, '..', 'index.html');
  win.loadFile(indexPath);

  win.once('ready-to-show', () => {
    win.show();
  });

  win.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
