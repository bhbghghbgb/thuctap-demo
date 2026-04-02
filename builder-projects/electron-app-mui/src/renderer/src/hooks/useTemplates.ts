/**
 * Templates Query
 *
 * TanStack Query hook for fetching and managing game templates.
 * Templates are loaded on boot and cached indefinitely (staleTime: Infinity).
 *
 * Uses the "Raw/Cooked" pattern:
 * - Raw: GameTemplate[] stored in cache (from IPC)
 * - Cooked: TemplateManager created via select() for consumption
 */

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { GameTemplate } from '../types'
import { TemplateManager } from '../utils/TemplateManager'

/**
 * Query key for templates - single key since there's only one IPC call.
 */
export const TEMPLATES_QUERY_KEY = ['templates'] as const

/**
 * Fetches templates from the electron main process.
 * Returns raw array - transformation to TemplateManager happens in select().
 */
async function fetchTemplates(): Promise<GameTemplate[]> {
  return window.electronAPI.getTemplates()
}

/**
 * Hook to get the TemplateManager instance.
 *
 * Templates are:
 * - Loaded on first access (or preloaded on boot via usePrefetchTemplates)
 * - Cached as raw GameTemplate[] array indefinitely (staleTime: Infinity)
 * - Transformed to TemplateManager via select() for efficient O(1) lookups
 *
 * @returns TemplateManager instance with loaded templates
 * @throws Error if templates fail to load
 */
export function useTemplateManager(): TemplateManager {
  const { data: manager } = useSuspenseQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    // Transform raw data (GameTemplate[]) to cooked data (TemplateManager)
    select: (templates) => TemplateManager.fromArray(templates),
    staleTime: Infinity, // Never stale - templates don't change at runtime
    gcTime: Infinity // Keep in memory indefinitely
  })

  if (!manager) {
    throw new Error('TemplateManager not loaded')
  }

  return manager
}

/**
 * Hook to prefetch templates on boot.
 * Call this in your root component to load templates before they're needed.
 *
 * @example
 * ```tsx
 * // In App.tsx or similar
 * usePrefetchTemplates() // Preload on boot
 * ```
 */
export function usePrefetchTemplates(): void {
  useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    staleTime: Infinity,
    gcTime: Infinity,
    // Don't retry on error - templates are critical for app functionality
    retry: false
  })
}

/**
 * Hook to get all templates as an array.
 * Useful for rendering template lists.
 *
 * @returns Array of all available templates
 */
export function useAllTemplates(): GameTemplate[] {
  const { data: templates } = useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    staleTime: Infinity,
    gcTime: Infinity
  })

  return templates ?? []
}
