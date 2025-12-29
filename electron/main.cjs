const electron = require('electron')
const { app, BrowserWindow, ipcMain, dialog, shell, screen, Menu, globalShortcut } = electron
const path = require('path')
const { spawn } = require('cross-spawn')

// Import autoUpdater only after app is ready
let autoUpdater = null

const isDev = !!process.env.VITE_DEV_SERVER_URL
let mainWindow = null

// Python paths setup
const PY_SCRIPT = isDev
  ? path.resolve(__dirname, '../../python_backend/renamer.py')
  : path.join(process.resourcesPath, 'python_backend', 'renamer.py')
const PY_EMBED = isDev
  ? path.resolve(__dirname, '../python_runtime/python.exe')
  : path.join(process.resourcesPath, 'python_runtime', 'python.exe')
const PY_CMD = process.env.PYTHON || (isDev ? 'python' : PY_EMBED)

function createWindow() {
  const { width: displayW, height: displayH } = screen.getPrimaryDisplay().workAreaSize
  const targetW = Math.max(1100, Math.min(1400, Math.round(displayW * 0.9)))
  const targetH = Math.max(800, Math.min(1100, Math.round(displayH * 0.8)))

  mainWindow = new BrowserWindow({
    width: targetW,
    height: targetH,
    minWidth: 1100,
    minHeight: 800,
    backgroundColor: '#0a0e17',
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'electron', 'autonum.ico')
      : path.join(__dirname, 'autonum.ico'),
    title: 'AutoNUM',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: false, // Nécessaire pour accéder à file.path
      nodeIntegration: true,   // Nécessaire pour accéder à file.path dans le drag & drop
      webSecurity: false,      // Permet d'accéder à file.path pour le drag & drop
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Intercepter les fichiers droppés pour récupérer les chemins
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Empêcher la navigation par défaut pour les fichiers droppés
    if (url.startsWith('file://')) {
      event.preventDefault()
    }
  })
}

function initAutoUpdater() {
  if (isDev || autoUpdater) return autoUpdater

  // Lazy load autoUpdater
  autoUpdater = require('electron-updater').autoUpdater
  autoUpdater.autoDownload = false

  // Setup event listeners once
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-event', { type: 'available', info })
  })
  autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-event', { type: 'not-available' })
  })
  autoUpdater.on('error', (error) => {
    if (mainWindow) mainWindow.webContents.send('update-event', { type: 'error', message: error.message })
  })
  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) mainWindow.webContents.send('update-event', { type: 'progress', progress })
  })
  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-event', { type: 'downloaded', info })
  })

  return autoUpdater
}

function wireAutoUpdater() {
  if (isDev) return
  initAutoUpdater()
}

// IPC Handlers

ipcMain.handle('pick-files', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Sélectionner les fichiers',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'] },
      { name: 'Tous fichiers', extensions: ['*'] }
    ]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths
})

ipcMain.handle('pick-output-folder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Sélectionner le dossier de sortie',
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
})

ipcMain.handle('rename-files', async (_event, files, outputFolder, prefix, startNumber, moveMode = false) => {
  return new Promise((resolve, reject) => {
    // Debug logs
    console.log('=== RENAME DEBUG ===')
    console.log('isDev:', isDev)
    console.log('PY_CMD:', PY_CMD)
    console.log('PY_SCRIPT:', PY_SCRIPT)
    console.log('moveMode:', moveMode)
    console.log('process.resourcesPath:', process.resourcesPath)

    const args = [
      PY_SCRIPT,
      '--files', JSON.stringify(files),
      '--output', outputFolder,
      '--prefix', prefix,
      '--start', String(startNumber)
    ]
    if (moveMode) {
      args.push('--move')
    }

    console.log('Command:', PY_CMD, args.join(' '))
    console.log('==================')

    const child = spawn(PY_CMD, args)
    let stdout = ''
    let stderr = ''

    child.on('error', (err) => {
      console.error('Spawn error:', err)
      reject(new Error(`Failed to start Python: ${err.message}`))
    })

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    child.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('Python stderr:', data.toString())
    })

    child.on('close', (code) => {
      console.log('Python exit code:', code)
      console.log('Python stdout:', stdout)
      console.log('Python stderr:', stderr)

      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`))
        return
      }
      try {
        const parsed = JSON.parse(stdout)
        resolve(parsed)
      } catch (err) {
        reject(new Error(`Réponse JSON invalide: ${err}\nStdout: ${stdout}`))
      }
    })
  })
})

ipcMain.handle('check-updates', async () => {
  if (isDev) return { status: 'dev' }

  const updater = initAutoUpdater()
  if (!updater) return { status: 'error', message: 'AutoUpdater not available' }

  try {
    const result = await updater.checkForUpdates()
    if (result && result.updateInfo && result.updateInfo.version !== app.getVersion()) {
      return { status: 'available', version: result.updateInfo.version }
    }
    return { status: 'up-to-date', version: app.getVersion() }
  } catch (err) {
    return { status: 'error', message: String(err) }
  }
})

ipcMain.handle('download-update', async () => {
  if (isDev) return

  const updater = initAutoUpdater()
  if (!updater) return

  await updater.downloadUpdate()
})

ipcMain.handle('install-update', async () => {
  if (isDev) return

  const updater = initAutoUpdater()
  if (!updater) return

  updater.quitAndInstall()
})

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window-toggle-maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})


app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  wireAutoUpdater()
  if (!isDev) {
    autoUpdater.checkForUpdates()
  }

  // Enable DevTools in production for debugging (F12)
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.toggleDevTools({ mode: 'detach' })
    }
  })
  if (isDev) {
    globalShortcut.register('Control+Shift+I', () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        win.webContents.toggleDevTools({ mode: 'detach' })
      }
    })
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
