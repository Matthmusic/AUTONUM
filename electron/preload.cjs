const { ipcRenderer, webUtils } = require('electron')

// Avec contextIsolation: false, on peut utiliser window directement
window.api = {
  pickFiles: () => ipcRenderer.invoke('pick-files'),
  pickOutputFolder: () => ipcRenderer.invoke('pick-output-folder'),
  renameFiles: (files, outputFolder, prefix, startNumber, moveMode) =>
    ipcRenderer.invoke('rename-files', files, outputFolder, prefix, startNumber, moveMode),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  checkUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateEvent: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('update-event', listener)
    return () => ipcRenderer.removeListener('update-event', listener)
  },
  // Fonction helper pour récupérer le chemin d'un fichier
  getFilePathFromFile: (file) => {
    try {
      return webUtils.getPathForFile(file)
    } catch (err) {
      return null
    }
  },
}
