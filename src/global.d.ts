// Global type declarations for Electron API
export {}

declare global {
  interface Window {
    api: {
      pickFiles: () => Promise<string[] | null>
      pickOutputFolder: () => Promise<string | null>
      renameFiles: (
        files: string[],
        outputFolder: string,
        prefix: string,
        startNumber: number,
        moveMode?: boolean
      ) => Promise<{ success: number; errors: string[] }>
      windowClose: () => void
      windowMinimize: () => void
      windowToggleMaximize: () => void
      checkUpdates: () => void
      downloadUpdate: () => void
      installUpdate: () => void
      onUpdateEvent: (callback: (data: any) => void) => () => void
      getFilePathFromFile: (file: File) => string | null
    }
  }
}
