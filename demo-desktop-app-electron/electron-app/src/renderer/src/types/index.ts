// ── Template meta ─────────────────────────────────────────────────────────────
export interface GameTemplate {
  id: string
  name: string
  description: string
  thumbnail?: string
  gameType: 'group-sort' | string
  version: string
}

// ── Group Sort game data ──────────────────────────────────────────────────────
export interface GroupSortGroup {
  id: string // e.g. "group-1", "group-2"
  name: string
  imagePath: string | null
}

export interface GroupSortItem {
  id: string // e.g. "item-1", "item-2"
  name: string
  imagePath: string | null
  groupId: string
}

export interface GroupSortAppData {
  groups: GroupSortGroup[]
  items: GroupSortItem[]
  // Monotonically increasing counters — never reset on delete
  _groupCounter: number
  _itemCounter: number
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** How auto-save is triggered */
export type AutoSaveMode =
  | 'off'
  | 'on-edit' // save after every change (debounced ~1s)
  | 'interval' // save every N seconds

export interface GlobalSettings {
  autoSave: {
    mode: AutoSaveMode
    intervalSeconds: number // used when mode === 'interval', default 30
  }
  /** Prefill group/item names like "Group 1", "Item 1" on creation */
  prefillNames: boolean
}

/** Per-project overrides — null means "use global setting" */
export interface ProjectSettings {
  autoSave?: {
    mode?: AutoSaveMode
    intervalSeconds?: number
  } | null
  prefillNames?: boolean | null
}

/** Resolved = global merged with project override */
export type ResolvedSettings = GlobalSettings

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  autoSave: {
    mode: 'on-edit',
    intervalSeconds: 30
  },
  prefillNames: true
}

// ── Project file (saved as .mgproj) ──────────────────────────────────────────
export interface ProjectFile {
  version: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  settings?: ProjectSettings // optional per-project overrides
  appData: GroupSortAppData
}

// ── In-memory project state ───────────────────────────────────────────────────
export interface ProjectState {
  filePath: string
  projectDir: string
  isDirty: boolean
  data: ProjectFile
}

// ── Electron API ──────────────────────────────────────────────────────────────
export interface ElectronAPI {
  getTemplates: () => Promise<GameTemplate[]>
  checkFolderStatus: (folderPath: string) => Promise<'empty' | 'has-project' | 'non-empty'>
  chooseProjectFolder: () => Promise<string | null>
  openProjectFile: (filePath?: string) => Promise<{ filePath: string; data: ProjectFile } | null>
  saveProject: (data: object, projectPath: string) => Promise<boolean>
  pickImage: () => Promise<string | null>
  importImage: (sourcePath: string, projectDir: string, desiredName: string) => Promise<string>
  resolveAssetUrl: (projectDir: string, relativePath: string) => Promise<string>
  settingsReadGlobal: () => Promise<object>
  settingsWriteGlobal: (data: object) => Promise<boolean>
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
