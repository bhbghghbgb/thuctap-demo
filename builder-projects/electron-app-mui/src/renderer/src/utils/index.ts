/**
 * Utils Barrel Export
 *
 * Centralized exports for utility functions.
 */

// String utilities
export * from './stringUtils'

// Settings utilities
export { deepMergeDefaults, mergeSettings } from './settingsUtils'

// Project file utilities
export { buildProjectFile, buildProjectTitle } from './projectFileUtils'

// History utilities
export { getHistoryArray } from './historyUtils'

// Template manager
export { TemplateManager } from './TemplateManager'
