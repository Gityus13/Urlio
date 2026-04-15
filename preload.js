const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  shortenUrl:      (url)  => ipcRenderer.invoke('shorten-url', url),
  expandUrl:       (url)  => ipcRenderer.invoke('expand-url', url),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  openExternal:    (url)  => ipcRenderer.invoke('open-external', url),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),
});
