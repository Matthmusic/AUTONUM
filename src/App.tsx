import { useEffect, useState, useRef } from 'react'
import { Maximize2, Minus, X as Close, Upload, FolderOpen, Sparkles, Trash2 } from 'lucide-react'
import './App.css'
import logo from '../public/autonum.svg'

type FileItem = {
  path: string
  name: string
  newName: string
}

const hasApi = () => typeof window !== 'undefined' && typeof (window as any).api !== 'undefined'

function App() {
  const currentVersion = '0.0.7'
  const [files, setFiles] = useState<FileItem[]>([])
  const [outputFolder, setOutputFolder] = useState('')
  const [prefix, setPrefix] = useState('Relevé')
  const [startNumber, setStartNumber] = useState(1)
  const [moveMode, setMoveMode] = useState(false)
  const [status, setStatus] = useState('Prêt - Glissez vos fichiers pour commencer')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null)
  const [toastTimeout, setToastTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'
    version?: string
    progress?: number
    message?: string
  }>({ state: 'idle' })

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (toastTimeout) clearTimeout(toastTimeout)
    setToast({ message, type })
    const t = setTimeout(() => setToast(null), 3200)
    setToastTimeout(t)
  }

  useEffect(() => {
    if (!hasApi()) return
    const unsubscribe = window.api.onUpdateEvent((data: any) => {
      switch (data?.type) {
        case 'available':
          setUpdateStatus({ state: 'available', version: data.info?.version })
          showToast(`Mise à jour disponible (${data.info?.version}).`, 'info')
          break
        case 'downloaded':
          setUpdateStatus({ state: 'downloaded', version: data.info?.version })
          showToast('Mise à jour téléchargée. Clique pour installer.', 'success')
          break
        case 'progress':
          setUpdateStatus((prev) => ({
            state: 'downloading',
            version: prev.version || data.progress?.version,
            progress: Math.round(data.progress?.percent || 0),
          }))
          break
        case 'error':
          setUpdateStatus({ state: 'error', message: data.message })
          showToast('Erreur de mise à jour.', 'error')
          break
        case 'not-available':
          setUpdateStatus({ state: 'idle' })
          break
        default:
          break
      }
    })
    window.api.checkUpdates()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Gestion du drag & drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      console.log('🎯 DragEnter')
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = dropZoneRef.current?.getBoundingClientRect()
      if (rect && e.clientX !== 0 && e.clientY !== 0) {
        if (e.clientX < rect.left || e.clientX >= rect.right ||
            e.clientY < rect.top || e.clientY >= rect.bottom) {
          setIsDragging(false)
        }
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!e.dataTransfer) return

      const files = Array.from(e.dataTransfer.files || [])
      const filePaths: string[] = []

      // Utiliser webUtils.getPathForFile() pour récupérer les chemins
      for (const file of files) {
        if (hasApi() && window.api.getFilePathFromFile) {
          const path = window.api.getFilePathFromFile(file)
          if (path) {
            filePaths.push(path)
          }
        }
      }

      if (filePaths.length > 0) {
        addFiles(filePaths)
      } else {
        showToast('Impossible de récupérer les chemins. Utilisez le bouton "Sélectionner fichiers".', 'error')
      }
    }

    const dropZone = dropZoneRef.current
    if (dropZone) {
      dropZone.addEventListener('dragenter', handleDragEnter)
      dropZone.addEventListener('dragover', handleDragOver)
      dropZone.addEventListener('dragleave', handleDragLeave)
      dropZone.addEventListener('drop', handleDrop)
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener('dragenter', handleDragEnter)
        dropZone.removeEventListener('dragover', handleDragOver)
        dropZone.removeEventListener('dragleave', handleDragLeave)
        dropZone.removeEventListener('drop', handleDrop)
      }
    }
  }, [files, prefix, startNumber])

  const generateNewName = (index: number) => {
    const number = startNumber + index
    return `${prefix}_${number.toString().padStart(3, '0')}`
  }

  const addFiles = (filePaths: string[]) => {
    const extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif']
    const newFiles: FileItem[] = []

    filePaths.forEach(path => {
      const name = path.split(/[\\/]/).pop() || ''
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()

      if (extensions.includes(ext) && !files.some(f => f.path === path)) {
        const index = files.length + newFiles.length
        newFiles.push({
          path,
          name,
          newName: generateNewName(index) + ext
        })
      }
    })

    if (newFiles.length > 0) {
      setFiles([...files, ...newFiles])
      showToast(`${newFiles.length} fichier(s) ajouté(s)`, 'success')
      setStatus(`${files.length + newFiles.length} fichier(s) prêt(s)`)
    } else {
      showToast('Aucun nouveau fichier valide', 'error')
    }
  }

  const pickFiles = async () => {
    if (!hasApi()) {
      showToast("Lance l'app Electron pour sélectionner des fichiers.", 'error')
      return
    }
    try {
      const selected = await window.api.pickFiles()
      if (selected && selected.length > 0) {
        addFiles(selected)
      }
    } catch (err) {
      console.error('pickFiles', err)
      showToast('Erreur lors de la sélection.', 'error')
    }
  }

  const pickOutputFolder = async () => {
    if (!hasApi()) {
      showToast("Lance l'app Electron pour sélectionner un dossier.", 'error')
      return
    }
    try {
      const selected = await window.api.pickOutputFolder()
      if (selected) {
        setOutputFolder(selected)
        const folderName = selected.split(/[\\/]/).pop() || selected
        showToast(`Dossier: ${folderName}`, 'info')
        setStatus(`Dossier de sortie: ${folderName}`)
      }
    } catch (err) {
      console.error('pickOutputFolder', err)
      showToast('Erreur lors de la sélection.', 'error')
    }
  }

  const renameFiles = async () => {
    if (!hasApi()) {
      showToast("Lance l'app Electron pour renommer.", 'error')
      return
    }
    if (files.length === 0 || !outputFolder || !prefix) {
      showToast('Fichiers, dossier et préfixe requis.', 'error')
      return
    }

    setLoading(true)
    setStatus('Renommage en cours...')

    try {
      const filePaths = files.map(f => f.path)
      const result = await window.api.renameFiles(filePaths, outputFolder, prefix, startNumber, moveMode)

      if (result.errors && result.errors.length > 0) {
        showToast(`${result.success} réussite(s), ${result.errors.length} erreur(s)`, 'error')
        setStatus(`Terminé avec ${result.errors.length} erreur(s)`)
      } else {
        showToast(`${result.success} fichier(s) renommé(s) avec succès!`, 'success')
        setStatus(`✓ ${result.success} fichier(s) renommé(s)`)
      }
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du renommage.', 'error')
      setStatus('Erreur lors du renommage')
    } finally {
      setLoading(false)
    }
  }

  const clearFiles = () => {
    setFiles([])
    setStatus('Liste effacée')
    showToast('Liste effacée', 'info')
  }

  const updatePreviews = () => {
    setFiles(files.map((f, i) => ({
      ...f,
      newName: generateNewName(i) + f.name.substring(f.name.lastIndexOf('.'))
    })))
  }

  useEffect(() => {
    updatePreviews()
  }, [prefix, startNumber])

  const downloadUpdate = async () => {
    if (!hasApi()) return
    await window.api.downloadUpdate()
    setUpdateStatus((prev) => ({ ...prev, state: 'downloading' }))
  }

  const installUpdate = async () => {
    if (!hasApi()) return
    await window.api.installUpdate()
  }

  return (
    <div className="app-shell">
      <div className="titlebar">
        <div className="window-title">
          <img src={logo} alt="AutoNUM" className="title-logo" />
          <span className="window-title-text">AutoNUM</span>
        </div>
        <div className="window-controls">
          <button className="btn-icon" aria-label="Minimiser" onClick={() => window.api.windowMinimize()}>
            <Minus size={14} />
          </button>
          <button className="btn-icon" aria-label="Agrandir" onClick={() => window.api.windowToggleMaximize()}>
            <Maximize2 size={14} />
          </button>
          <button className="btn-icon close" aria-label="Fermer" onClick={() => window.api.windowClose()}>
            <Close size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className={`toast ${toast ? 'visible' : ''} ${toast?.type === 'error' ? 'error' : ''} ${toast?.type === 'success' ? 'success' : ''}`}>
        {toast?.message}
      </div>
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="content">
        <header className="hero">
          <div className="hero-left">
            <div className="logo-wrap">
              <img src={logo} alt="AutoNUM" className="logo" />
              <div className="logo-text">
                <p className="eyebrow">AutoNUM</p>
                <p className="subtext">Renommage automatique</p>
              </div>
            </div>
            <h1>Renomme tes fichiers en un clic.</h1>
            <p className="lede">
              Glisse tes fichiers, définis un préfixe et obtiens une numérotation automatique. Simple et efficace.
            </p>
          </div>
          <div className="right-stack">
            <div className="stats" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <div className="stat">
                <span className="stat-label">Fichiers</span>
                <span className="stat-value">{files.length} fichier(s)</span>
              </div>
              <div className="stat">
                <span className="stat-label">État</span>
                <span className="stat-value">{loading ? 'En cours...' : status}</span>
              </div>
            </div>
            {updateStatus.state !== 'idle' ? (
              <div className="update-box" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <div>
                  <p className="label">Mise à jour</p>
                  <p className="tiny">
                    {updateStatus.state === 'available' && `Version ${updateStatus.version} disponible.`}
                    {updateStatus.state === 'downloading' && `Téléchargement... ${updateStatus.progress ?? 0}%`}
                    {updateStatus.state === 'downloaded' && `Version ${updateStatus.version} téléchargée.`}
                    {updateStatus.state === 'error' && updateStatus.message}
                  </p>
                </div>
                {updateStatus.state === 'available' && (
                  <button className="btn secondary small" onClick={downloadUpdate}>
                    Télécharger
                  </button>
                )}
                {updateStatus.state === 'downloading' && <span className="pill">Téléchargement...</span>}
                {updateStatus.state === 'downloaded' && (
                  <button className="btn primary small" onClick={installUpdate}>
                    Installer
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <main className="layout">
          <section className="panel config">
            <div className="panel-head">
              <div>
                <p className="eyebrow subtle">Configuration</p>
                <h2>Paramètres de renommage</h2>
                <p className="hint">Définis le préfixe et le numéro de départ pour tes fichiers.</p>
              </div>
            </div>

            <div className="config-inputs">
              <div className="input-group">
                <label className="label">Préfixe</label>
                <input
                  type="text"
                  className="input"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Relevé"
                />
              </div>
              <div className="input-group">
                <label className="label">Numéro de départ</label>
                <input
                  type="number"
                  className="input"
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="input-group">
                <label className="label">Mode d'opération</label>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${!moveMode ? 'active' : ''}`}
                    onClick={() => setMoveMode(false)}
                    disabled={loading}
                    data-tooltip="Les fichiers d'origine sont conservés"
                  >
                    Copier
                  </button>
                  <button
                    className={`toggle-btn ${moveMode ? 'active' : ''}`}
                    onClick={() => setMoveMode(true)}
                    disabled={loading}
                    data-tooltip="Les fichiers d'origine sont supprimés"
                  >
                    Déplacer
                  </button>
                </div>
              </div>
            </div>

            <div className="buttons">
              <button className="btn secondary" onClick={pickFiles} disabled={loading}>
                <FolderOpen size={16} />
                Sélectionner fichiers
              </button>
              <button className="btn secondary" onClick={pickOutputFolder} disabled={loading}>
                <FolderOpen size={16} />
                Dossier de sortie
              </button>
              <button
                className="btn primary"
                onClick={renameFiles}
                disabled={loading || files.length === 0 || !outputFolder}
              >
                <Sparkles size={16} />
                RENOMMER
              </button>
            </div>
          </section>

          <section className="panel files">
            <div className="panel-head">
              <div>
                <p className="eyebrow subtle">Fichiers</p>
                <h2>Zone de travail</h2>
                <p className="hint">Glisse tes fichiers ici ou utilise le bouton de sélection.</p>
              </div>
              <div className="panel-head-actions">
                {files.length > 0 ? (
                  <>
                    <span className="pill">{files.length} fichier(s)</span>
                    <button className="btn ghost small" onClick={clearFiles} disabled={loading}>
                      <Trash2 size={14} />
                      Vider la liste
                    </button>
                  </>
                ) : (
                  <span className="pill muted">Vide</span>
                )}
              </div>
            </div>

            <div
              ref={dropZoneRef}
              className={`drop-zone ${files.length > 0 ? 'has-files' : ''} ${isDragging ? 'dragging' : ''}`}
              onClick={() => files.length === 0 && pickFiles()}
            >
              {files.length === 0 ? (
                <div className="drop-placeholder">
                  <Upload size={48} strokeWidth={1.5} />
                  <p className="drop-text">Glisse tes fichiers ici</p>
                  <p className="drop-hint">ou clique pour sélectionner</p>
                  <p className="drop-formats">JPG, PNG, BMP, TIFF, GIF</p>
                </div>
              ) : (
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-original">
                        <span className="file-index">{index + 1}.</span>
                        <span className="file-name">{file.name}</span>
                      </div>
                      <div className="file-arrow">→</div>
                      <div className="file-new">{file.newName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="footer">AutoNUM - v{currentVersion}</footer>
      </div>
    </div>
  )
}

export default App
