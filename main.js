const { app, BrowserWindow, ipcMain, clipboard, shell } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    backgroundColor: '#050508',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
  });
}

// ── Shorten URL via is.gd ─────────────────────────────────────────────────
ipcMain.handle('shorten-url', async (_event, url) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.shorturl) resolve(json.shorturl);
          else reject(json.errormessage || 'Could not shorten that URL.');
        } catch {
          reject('Invalid response from API.');
        }
      });
    }).on('error', (err) => reject(err.message));
  });
});

// ── Expand URL by following redirects ────────────────────────────────────
ipcMain.handle('expand-url', async (_event, url) => {
  return new Promise((resolve, reject) => {
    const follow = (currentUrl, hops = 0) => {
      if (hops > 15) return reject('Too many redirects.');
      const lib = currentUrl.startsWith('https') ? https : http;
      const req = lib.request(currentUrl, { method: 'HEAD', timeout: 8000 }, (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc) {
          // Handle relative redirects
          const next = loc.startsWith('http') ? loc : new URL(loc, currentUrl).href;
          follow(next, hops + 1);
        } else {
          resolve(currentUrl);
        }
      });
      req.on('error', () => {
        // Fallback: try GET if HEAD fails
        const req2 = lib.request(currentUrl, { method: 'GET', timeout: 8000 }, (res) => {
          const loc = res.headers.location;
          if (res.statusCode >= 300 && res.statusCode < 400 && loc) {
            const next = loc.startsWith('http') ? loc : new URL(loc, currentUrl).href;
            follow(next, hops + 1);
          } else {
            resolve(currentUrl);
          }
          res.resume();
        });
        req2.on('error', (err) => reject(err.message));
        req2.end();
      });
      req.end();
    };
    follow(url);
  });
});

// ── Clipboard ─────────────────────────────────────────────────────────────
ipcMain.handle('copy-to-clipboard', (_event, text) => {
  clipboard.writeText(text);
  return true;
});

// ── Open in browser ───────────────────────────────────────────────────────
ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});

// ── Window controls (for custom title bar on Win/Linux) ───────────────────
ipcMain.on('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  win?.isMaximized() ? win.unmaximize() : win?.maximize();
});
ipcMain.on('window-close', () => BrowserWindow.getFocusedWindow()?.close());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
