import { useHotkeys } from 'react-hotkeys-hook'

// ── useTieredEntityHotkeys ──────────────────────────────────────────────────
/**
 * Registers keyboard shortcuts for project actions and entity creation.
 *
 * Project Actions:
 * - Ctrl+P: Preview
 * - Ctrl+Shift+P: Export to folder
 * - Ctrl+Alt+P: Export to zip
 *
 * Entity Creation:
 * - Ctrl+N: Tier 1 (Smallest unit)
 * - Ctrl+Shift+N: Tier 2 (Mid unit)
 * - Ctrl+Alt+N: Tier 3 (High unit)
 * - Ctrl+Shift+Alt+N: Tier 4 (Highest unit)
 */

interface TieredHotkeysOptions {
  onTier: (tier: 1 | 2 | 3 | 4) => void
  onPreview?: () => void
  onExportFolder?: () => void
  onExportZip?: () => void
  enabled?: boolean
}

export function useTieredEntityHotkeys({
  onTier,
  onPreview,
  onExportFolder,
  onExportZip,
  enabled = true
}: TieredHotkeysOptions): void {
  // Entity Tiers
  useHotkeys(
    'ctrl+n',
    (e) => {
      e.preventDefault()
      onTier(1)
    },
    { enabled, preventDefault: true }
  )

  useHotkeys(
    'ctrl+shift+n',
    (e) => {
      e.preventDefault()
      onTier(2)
    },
    { enabled, preventDefault: true }
  )

  useHotkeys(
    'ctrl+alt+n',
    (e) => {
      e.preventDefault()
      onTier(3)
    },
    { enabled, preventDefault: true }
  )

  useHotkeys(
    'ctrl+shift+alt+n',
    (e) => {
      e.preventDefault()
      onTier(4)
    },
    { enabled, preventDefault: true }
  )

  // Project Actions
  useHotkeys(
    'ctrl+p',
    (e) => {
      e.preventDefault()
      onPreview?.()
    },
    { enabled, preventDefault: true }
  )

  useHotkeys(
    'ctrl+shift+p',
    (e) => {
      e.preventDefault()
      onExportFolder?.()
    },
    { enabled, preventDefault: true }
  )

  useHotkeys(
    'ctrl+alt+p',
    (e) => {
      e.preventDefault()
      onExportZip?.()
    },
    { enabled, preventDefault: true }
  )
}
