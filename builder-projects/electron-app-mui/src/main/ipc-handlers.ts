/**
 * Typed IPC Handler Utility
 *
 * Provides type-safe IPC handler registration by inferring types from the
 * centralized IPC_CHANNEL_DEFINITIONS in the shared module.
 */

import { ipcMain } from 'electron'
import type { IPCChannelDefinitions, IPCHandler } from '../shared'

/**
 * Register a typed IPC handler.
 *
 * Usage:
 *   createHandler('get-templates', async () => {
 *     return [...]
 *   })
 *
 * The handler function will be automatically typed based on the channel definition.
 */
export function createHandler<T extends keyof IPCChannelDefinitions>(
  channel: T,
  handler: IPCHandler<T>
): void {
  ipcMain.handle(channel, handler as Parameters<typeof ipcMain.handle>[1])
}

/**
 * Type-safe IPC main process wrapper.
 * Provides methods to register handlers with full type inference.
 */
export const typedIpcMain = {
  /**
   * Register a typed IPC handler.
   *
   * @param channel - The IPC channel name (type-safe, autocomplete enabled)
   * @param handler - The handler function (types inferred from channel definition)
   */
  handle: <T extends keyof IPCChannelDefinitions>(channel: T, handler: IPCHandler<T>): void => {
    ipcMain.handle(channel, handler as Parameters<typeof ipcMain.handle>[1])
  }
}
