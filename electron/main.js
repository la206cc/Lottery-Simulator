const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_SCHEME = 'lottery';

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
      stream: true
    }
  }
]);

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
      webSecurity: true
    }
  });

  win.loadURL(`${APP_SCHEME}://app/index.html`);

  win.once('ready-to-show', () => {
    win.show();
  });

  win.setMenu(null);
}

app.whenReady().then(() => {
  protocol.handle(APP_SCHEME, (request) => {
    const url = new URL(request.url);
    let filePath = url.pathname;
    if (filePath.startsWith('/')) filePath = filePath.substring(1);
    const fullPath = path.join(__dirname, '..', filePath);

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(fullPath);
      return new Response(data, {
        headers: { 'content-type': `${mimeType};charset=utf-8` }
      });
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  });

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
