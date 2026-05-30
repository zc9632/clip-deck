const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cb', {
  getItems: () => ipcRenderer.invoke('items:get'),
  onItems: (cb) => ipcRenderer.on('items:update', (_, items) => cb(items)),
  select: (id) => ipcRenderer.send('item:select', id),
  close: () => ipcRenderer.send('window:close'),
  clear: () => ipcRenderer.send('items:clear'),
});
