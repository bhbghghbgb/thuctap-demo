import { useHead } from '@unhead/react'

/**
 * Custom hook that sets the document title using Unhead.
 * Title is automatically formatted with " — Minigame Builder" suffix via global titleTemplate.
 * @param {string} title - The title to set.
 * @public
 * @example
 * ```tsx
 * useAppDocumentTitle('Home Page');
 * ```
 */
export function useAppDocumentTitle(title: string): void {
  useHead({ title })
}
