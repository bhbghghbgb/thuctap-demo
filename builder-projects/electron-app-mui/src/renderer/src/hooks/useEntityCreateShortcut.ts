import { useTieredShortcuts, type TieredShortcutOptions } from './useTieredShortcuts'

/**
 * Keyboard shortcuts for creating entities at different tiers.
 * Uses the 'N' key (for "New") with various modifiers.
 *
 * Hotkeys:
 * - Ctrl+N: Create smallest unit (item, word, question)
 * - Ctrl+Shift+N: Create medium unit (group, category)
 * - Ctrl+Alt+N: Create large unit (section, block)
 * - Ctrl+Shift+Alt+N: Create complex unit
 */
export function useEntityCreateShortcut(options: TieredShortcutOptions): void {
  useTieredShortcuts('n', options)
}

// Re-export the type for convenience
export type { TieredShortcutOptions }
