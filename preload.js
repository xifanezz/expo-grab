const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal
  sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),
  onTerminalData: (callback) => ipcRenderer.on('terminal-data', (event, data) => callback(data)),
  resizeTerminal: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),

  // Element selection
  sendElementSelected: (elementInfo) => ipcRenderer.send('element-selected', elementInfo),
  onElementContext: (callback) => ipcRenderer.on('element-context', (event, data) => callback(data)),
});
