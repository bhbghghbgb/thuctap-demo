import { useHotkeys } from 'react-hotkeys-hook'

export interface TieredShortcutOptions {
  /** Callback for tier 1: Ctrl+Key (smallest unit) */
  onTier1?: () => void
  /** Callback for tier 2: Ctrl+Shift+Key (medium unit) */
  onTier2?: () => void
  /** Callback for tier 3: Ctrl+Alt+Key (large unit) */
  onTier3?: () => void
  /** Callback for tier 4: Ctrl+Shift+Alt+Key (complex unit) */
  onTier4?: () => void
}

/**
 * Generic tiered keyboard shortcuts hook.
 * Registers hotkeys for up to 4 tiers of actions using a single key.
 *
 * Tier modifiers:
 * - Tier 1: Ctrl+Key
 * - Tier 2: Ctrl+Shift+Key
 * - Tier 3: Ctrl+Alt+Key
 * - Tier 4: Ctrl+Shift+Alt+Key
 *
 * @param key - The base key to listen for (e.g., 'n', 'p')
 * @param options - Callbacks for each tier
 */
export function useTieredShortcuts(key: string, options: TieredShortcutOptions): void {
  const { onTier1, onTier2, onTier3, onTier4 } = options

  // Tier 1: Ctrl+Key
  useHotkeys(
    `ctrl+${key}`,
    (e) => {
      if (!onTier1) return
      e.preventDefault()
      onTier1()
    },
    { enableOnFormTags: false }
  )

  // Tier 2: Ctrl+Shift+Key
  useHotkeys(
    `ctrl+shift+${key}`,
    (e) => {
      if (!onTier2) return
      e.preventDefault()
      onTier2()
    },
    { enableOnFormTags: false }
  )

  // Tier 3: Ctrl+Alt+Key
  useHotkeys(
    `ctrl+alt+${key}`,
    (e) => {
      if (!onTier3) return
      e.preventDefault()
      onTier3()
    },
    { enableOnFormTags: false }
  )

  // Tier 4: Ctrl+Shift+Alt+Key
  useHotkeys(
    `ctrl+shift+alt+${key}`,
    (e) => {
      if (!onTier4) return
      e.preventDefault()
      onTier4()
    },
    { enableOnFormTags: false }
  )
}
