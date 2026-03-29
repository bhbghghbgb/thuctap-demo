import { useEntityCreateShortcut, type TieredShortcutOptions } from './useEntityCreateShortcut'

/**
 * @deprecated Use useEntityCreateShortcut instead.
 * This is a re-export for backwards compatibility.
 */
export function useAddShortcut(options: TieredShortcutOptions): void {
  useEntityCreateShortcut(options)
}

// Re-export the type for backwards compatibility
export type { TieredShortcutOptions }
