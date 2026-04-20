import { AnyAppData } from '@shared'
import React, { forwardRef, useImperativeHandle, useState } from 'react'

// Lightweight wrapper to adapt existing editors to a new API surface
// - Forwards onChange to onCommit (to move towards onCommit-per-action)
// - Maintains a local copy of editor data to avoid forcing parent re-renders on every keystroke
// - Exposes a minimal imperative handle with getValue / setValue

// NOTE: To keep this wrapper generic and avoid tight coupling to AppData types,
// we loosely type data as any. In a real migration this would be the shared AppData union.

export type EditorWrapperHandle = {
  getValue: () => any
  setValue: (data: any) => void
}
type EditorWrapperProps = {
  // The actual editor component to render (expects props: appData, projectDir, onChange)
  EditorComponent: React.ComponentType<any>
  // Initial data passed from the parent/editor container
  initialData?: any
  // Project directory for assets, images, etc.
  projectDir: string
  // Callback used by the parent to persist changes (archive/history)
  onCommit: (data: any) => void
  // Forwarded props to the inner editor (e.g., appData for the initial render, etc.)
  [key: string]: any
}

/**
 * EditorWrapper component
 * Wraps an existing editor to provide getValue/setValue and to forward onChange to onCommit.
 * This wrapper is part of Phase 1 bridging to the new API surface.
 */
export const EditorWrapper = forwardRef<EditorWrapperHandle, EditorWrapperProps>(
  ({ EditorComponent, initialData, projectDir, onCommit, ...rest }, ref) => {
    const [localData, setLocalData] = useState<AnyAppData>(initialData)

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => localData,
        setValue: (data: AnyAppData) => setLocalData(data)
      }),
      [localData]
    )

    // When the inner editor notifies a change, forward it to the parent via onCommit
    const handleChange = (data: AnyAppData): void => {
      // Forward to parent as a commit for archival/history purposes
      if (typeof onCommit === 'function') {
        onCommit(data)
      }
      // Also update local state so internal editor stays in sync without re-rendering the parent
      setLocalData(data)
    }

    // Render the wrapped editor with local data and the change-forwarding handler
    return (
      <EditorComponent
        appData={localData}
        projectDir={projectDir}
        onChange={handleChange}
        {...rest}
      />
    )
  }
)

export default EditorWrapper
