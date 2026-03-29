import { useHotkeys } from 'react-hotkeys-hook'
import { useTieredShortcuts } from './useTieredShortcuts'

export interface ProjectShortcutOptions {
  // Navigation
  /** Callback for undo: Ctrl+Z */
  onUndo?: () => void
  /** Callback for redo: Ctrl+Y or Ctrl+Shift+Z */
  onRedo?: () => void

  // File operations
  /** Callback for save: Ctrl+S */
  onSave?: () => void
  /** Callback for save as: Ctrl+Shift+S */
  onSaveAs?: () => void

  // Preview and Export (uses P key with tiers)
  /** Callback for preview: Ctrl+P */
  onPreview?: () => void
  /** Callback for export to folder: Ctrl+Shift+P */
  onExportFolder?: () => void
  /** Callback for export to ZIP: Ctrl+Alt+P */
  onExportZip?: () => void

  // Entity creation (uses N key with tiers) - optional passthrough
  /** Callback for tier 1 entity create: Ctrl+N */
  onEntityCreateTier1?: () => void
  /** Callback for tier 2 entity create: Ctrl+Shift+N */
  onEntityCreateTier2?: () => void
  /** Callback for tier 3 entity create: Ctrl+Alt+N */
  onEntityCreateTier3?: () => void
  /** Callback for tier 4 entity create: Ctrl+Shift+Alt+N */
  onEntityCreateTier4?: () => void
}

/**
 * Comprehensive keyboard shortcuts for project-level actions.
 * Includes navigation, file operations, preview/export, and entity creation.
 */
export function useProjectShortcuts(options: ProjectShortcutOptions): void {
  const {
    onUndo,
    onRedo,
    onSave,
    onSaveAs,
    onPreview,
    onExportFolder,
    onExportZip,
    onEntityCreateTier1,
    onEntityCreateTier2,
    onEntityCreateTier3,
    onEntityCreateTier4
  } = options

  // ── Navigation ─────────────────────────────────────────────────────────────
  // Undo: Ctrl+Z
  useHotkeys(
    'ctrl+z',
    (e) => {
      if (e.shiftKey) return // Let ctrl+shift+z handle redo
      if (!onUndo) return
      e.preventDefault()
      onUndo()
    },
    { enableOnFormTags: false }
  )

  // Redo: Ctrl+Y or Ctrl+Shift+Z
  useHotkeys(
    'ctrl+y, ctrl+shift+z',
    (e) => {
      if (!onRedo) return
      e.preventDefault()
      onRedo()
    },
    { enableOnFormTags: false }
  )

  // ── File Operations ────────────────────────────────────────────────────────
  // Save: Ctrl+S
  useHotkeys(
    'ctrl+s',
    (e) => {
      if (e.shiftKey) return // Let ctrl+shift+s handle Save As
      if (!onSave) return
      e.preventDefault()
      onSave()
    },
    { enableOnFormTags: false }
  )

  // Save As: Ctrl+Shift+S
  useHotkeys(
    'ctrl+shift+s',
    (e) => {
      if (!onSaveAs) return
      e.preventDefault()
      onSaveAs()
    },
    { enableOnFormTags: false }
  )

  // ── Preview and Export (P key tiers) ───────────────────────────────────────
  // Preview: Ctrl+P
  useHotkeys(
    'ctrl+p',
    (e) => {
      if (!onPreview) return
      e.preventDefault()
      onPreview()
    },
    { enableOnFormTags: false }
  )

  // Export to folder: Ctrl+Shift+P
  useHotkeys(
    'ctrl+shift+p',
    (e) => {
      if (!onExportFolder) return
      e.preventDefault()
      onExportFolder()
    },
    { enableOnFormTags: false }
  )

  // Export to ZIP: Ctrl+Alt+P
  useHotkeys(
    'ctrl+alt+p',
    (e) => {
      if (!onExportZip) return
      e.preventDefault()
      onExportZip()
    },
    { enableOnFormTags: false }
  )

  // ── Entity Creation (N key tiers) ──────────────────────────────────────────
  useTieredShortcuts('n', {
    onTier1: onEntityCreateTier1,
    onTier2: onEntityCreateTier2,
    onTier3: onEntityCreateTier3,
    onTier4: onEntityCreateTier4
  })
}
