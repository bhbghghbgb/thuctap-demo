export interface ElectronAPI {
  // Templates
  getTemplates: () => Promise<import('../renderer/src/types').GameTemplate[]>

  // Folder / project management
  checkFolderStatus: (folderPath: string) => Promise<'empty' | 'has-project' | 'non-empty'>
  chooseProjectFolder: () => Promise<string | null>
  openProjectFile: (
    filePath?: string
  ) => Promise<{ filePath: string; data: import('../renderer/src/types').ProjectFile } | null>
  saveProject: (data: object, projectPath: string) => Promise<boolean>

  // Assets
  pickImage: () => Promise<string | null>
  importImage: (sourcePath: string, projectDir: string, desiredName: string) => Promise<string>
  resolveAssetUrl: (projectDir: string, relativePath: string) => Promise<string>

  // Settings
  settingsReadGlobal: () => Promise<object>
  settingsWriteGlobal: (data: object) => Promise<boolean>

  // Export
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => Promise<{ success?: boolean; canceled?: boolean; path?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
