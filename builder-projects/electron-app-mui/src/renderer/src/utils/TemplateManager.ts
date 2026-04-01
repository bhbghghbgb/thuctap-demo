/**
 * Template Manager
 *
 * Centralized manager for game templates with efficient lookups.
 * Templates are stored as an object with id as key for O(1) access.
 *
 * Uses the registry from ../games/registry for Editor components and initial data factories.
 */

import { GAME_REGISTRY, type GameRegistryEntry } from '../games/registry'
import type { AnyAppData, GameTemplate } from '../types'

/**
 * TemplateManager - Manages game templates with efficient lookups.
 *
 * Features:
 * - O(1) template lookup by ID
 * - Type-safe access to Editor components
 * - Initial data factory for new projects
 * - Immutable updates (returns new instance on setTemplates)
 */
export class TemplateManager {
  /** Templates stored as object with id as key for O(1) lookup */
  private readonly templatesById: Readonly<Record<string, GameTemplate>>
  /** Ordered list of template IDs for iteration */
  private readonly templateIds: readonly string[]

  private constructor(templates: GameTemplate[]) {
    // Build lookup object for O(1) access
    this.templatesById = Object.fromEntries(templates.map((t) => [t.id, t]))
    // Keep ordered list for iteration
    this.templateIds = templates.map((t) => t.id)
  }

  /**
   * Creates a TemplateManager from an array of templates.
   * Transforms array to object with id as key for efficient lookups.
   */
  static fromArray(templates: GameTemplate[]): TemplateManager {
    return new TemplateManager(templates)
  }

  /**
   * Get a template by ID.
   * @param templateId - The template ID to look up
   * @returns The template or undefined if not found
   */
  getTemplate(templateId: string): GameTemplate | undefined {
    return this.templatesById[templateId]
  }

  /**
   * Get a template by ID, throwing an error if not found.
   * @param templateId - The template ID to look up
   * @returns The template
   * @throws Error if template not found
   */
  getTemplateOrThrow(templateId: string): GameTemplate {
    const template = this.templatesById[templateId]
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }
    return template
  }

  /**
   * Get the Editor component for a template.
   * @param templateId - The template ID
   * @returns The registry entry with Editor and createInitialData, or undefined
   */
  getRegistryEntry(templateId: string): GameRegistryEntry | undefined {
    return GAME_REGISTRY[templateId]
  }

  /**
   * Get the Editor component for a template, throwing if not found.
   * @param templateId - The template ID
   * @returns The registry entry with Editor and createInitialData
   * @throws Error if template not found
   */
  getRegistryEntryOrThrow(templateId: string): GameRegistryEntry {
    const entry = GAME_REGISTRY[templateId]
    if (!entry) {
      throw new Error(`No editor registered for template: ${templateId}`)
    }
    return entry
  }

  /**
   * Get initial app data for a template.
   * @param templateId - The template ID
   * @returns Fresh initial data object, or empty object if template not found
   */
  createInitialData(templateId: string): AnyAppData {
    return GAME_REGISTRY[templateId]?.createInitialData() ?? ({} as AnyAppData)
  }

  /**
   * Get all templates as an array (for rendering lists).
   * Maintains the original order from when templates were loaded.
   */
  getAllTemplates(): GameTemplate[] {
    return this.templateIds.map((id) => this.templatesById[id])
  }

  /**
   * Get all template IDs.
   */
  getTemplateIds(): readonly string[] {
    return this.templateIds
  }

  /**
   * Check if a template exists.
   */
  hasTemplate(templateId: string): boolean {
    return templateId in this.templatesById
  }

  /**
   * Get the number of templates.
   */
  get count(): number {
    return this.templateIds.length
  }
}
