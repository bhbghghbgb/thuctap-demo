import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettings,
  ProjectSettings,
  ResolvedSettings
} from '../types'
import { deepMergeDefaults, mergeSettings } from '../utils/settingsUtils'

// ── Context types ─────────────────────────────────────────────────────────────

export interface SettingsContextValue {
  /** Raw global settings (for displaying / editing) */
  globalSettings: GlobalSettings
  /** Current per-project overrides */
  projectSettings: ProjectSettings | null
  /** Merged effective settings */
  resolved: ResolvedSettings
  /** Whether global settings have been loaded from disk */
  ready: boolean

  updateGlobal: (patch: Partial<GlobalSettings>) => void
  updateProject: (patch: ProjectSettings | null) => void

  /**
   * Call this from ProjectPage to plug in per-project settings.
   * Pass null when leaving the project page.
   */
  setProjectSettings: (s: ProjectSettings | null) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS)
  const [projectSettings, setProjectSettingsState] = useState<ProjectSettings | null>(null)
  const [ready, setReady] = useState(false)

  // Load global settings from disk on mount
  useEffect(() => {
    window.electronAPI.settingsReadGlobal().then((raw) => {
      setGlobalSettings(deepMergeDefaults(raw))
      setReady(true)
    })
  }, [])

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateGlobal = useCallback((patch: Partial<GlobalSettings>) => {
    // Debounce persist - read current settings from disk and merge
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(async () => {
      // Read latest settings from disk to get current recentProjects
      const current = await window.electronAPI.settingsReadGlobal()
      const next: GlobalSettings = {
        // Preserve recentProjects and any other fields from disk
        ...(current as GlobalSettings),
        // Override with updated core settings
        autoSave: {
          mode:
            patch.autoSave?.mode ?? current.autoSave?.mode ?? DEFAULT_GLOBAL_SETTINGS.autoSave.mode,
          intervalSeconds:
            patch.autoSave?.intervalSeconds ??
            current.autoSave?.intervalSeconds ??
            DEFAULT_GLOBAL_SETTINGS.autoSave.intervalSeconds
        },
        prefillNames:
          patch.prefillNames ?? current.prefillNames ?? DEFAULT_GLOBAL_SETTINGS.prefillNames
      }
      window.electronAPI.settingsWriteGlobal(next)
    }, 500)

    // Update local state immediately for UI responsiveness
    setGlobalSettings((prev) => ({
      ...prev,
      autoSave: {
        mode: patch.autoSave?.mode ?? prev.autoSave.mode,
        intervalSeconds: patch.autoSave?.intervalSeconds ?? prev.autoSave.intervalSeconds
      },
      prefillNames: patch.prefillNames ?? prev.prefillNames
    }))
  }, [])

  const updateProject = useCallback((patch: ProjectSettings | null) => {
    setProjectSettingsState(patch)
    // Note: Project settings are persisted when the project file is saved
    // They are stored in ProjectFile.settings and saved via doSave/handleSave
  }, [])

  const setProjectSettings = useCallback((s: ProjectSettings | null) => {
    setProjectSettingsState(s)
  }, [])

  const resolved = mergeSettings(globalSettings, projectSettings)

  return (
    <SettingsContext.Provider
      value={{
        globalSettings,
        projectSettings,
        resolved,
        ready,
        updateGlobal,
        updateProject,
        setProjectSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
