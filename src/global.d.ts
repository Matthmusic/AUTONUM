// Type declarations for CSS and asset imports
declare module '*.css' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

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
        startNumber: number
      ) => Promise<{ success: number; errors: string[] }>
      windowClose: () => void
      windowMinimize: () => void
      windowToggleMaximize: () => void
      checkUpdates: () => Promise<{ status: string; version?: string; message?: string }>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      onUpdateEvent: (callback: (data: any) => void) => () => void
      getFilePathFromFile: (file: File) => string | null
    }
  }
}
