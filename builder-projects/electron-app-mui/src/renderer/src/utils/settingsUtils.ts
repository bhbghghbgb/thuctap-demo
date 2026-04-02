/**
 * Settings Utilities
 *
 * Pure functions for settings manipulation and merging.
 */

import {
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettings,
  ProjectSettings,
  ResolvedSettings
} from '../types'

/**
 * Merges global and project settings with proper precedence.
 * Project overrides win over global settings.
 *
 * @param global - Global settings (base)
 * @param project - Project-specific overrides (optional)
 * @returns Resolved settings with project overrides applied
 */
export function mergeSettings(
  global: GlobalSettings,
  project?: ProjectSettings | null
): ResolvedSettings {
  if (!project) return global
  return {
    autoSave: {
      mode: project.autoSave?.mode ?? global.autoSave.mode,
      intervalSeconds: project.autoSave?.intervalSeconds ?? global.autoSave.intervalSeconds
    },
    prefillNames: project.prefillNames != null ? project.prefillNames : global.prefillNames
  }
}

/**
 * Deep merges saved settings with default values.
 * Ensures all required fields are present even if save is partial.
 * Preserves additional fields like recentProjects that aren't part of the core settings.
 *
 * @param saved - Saved settings (may be partial)
 * @returns Complete GlobalSettings with defaults applied
 */
export function deepMergeDefaults(saved: object): GlobalSettings {
  const s = saved as Partial<GlobalSettings>
  return {
    // Preserve recentProjects and any other unknown fields
    recentProjects: Array.isArray((s as any).recentProjects) ? (s as any).recentProjects : [],
    autoSave: {
      mode: s.autoSave?.mode ?? DEFAULT_GLOBAL_SETTINGS.autoSave.mode,
      intervalSeconds:
        s.autoSave?.intervalSeconds ?? DEFAULT_GLOBAL_SETTINGS.autoSave.intervalSeconds
    },
    prefillNames: s.prefillNames ?? DEFAULT_GLOBAL_SETTINGS.prefillNames
  }
}
