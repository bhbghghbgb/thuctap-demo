import { AnyAppData } from '@shared'
import { forwardRef, JSX, useImperativeHandle, useState } from 'react'
import { LegacyEditorProps } from '../games/legacyEditorProps'

// Lightweight wrapper to adapt existing editors to a new API surface
// - Forwards onChange to onCommit (to move towards onCommit-per-action)
// - Maintains a local copy of editor data to avoid forcing parent re-renders on every keystroke
// - Exposes a minimal imperative handle with getValue / setValue

export type EditorWrapperHandle<T extends AnyAppData = AnyAppData> = {
  getValue: () => T
  setValue: (data: T) => void
}

type EditorWrapperProps<T extends AnyAppData> = {
  // The actual editor component to render (expects props defined by LegacyEditorProps)
  EditorComponent: React.ComponentType<LegacyEditorProps<T>>
  // Initial data passed from the parent/editor container
  initialData: T
  // Project directory for assets, images, etc.
  projectDir: string
  // Callback used by the parent to persist changes (archive/history)
  onCommit: (data: T) => void
}

/**
 * EditorWrapper component
 * Wraps an existing editor to provide getValue/setValue and to forward onChange to onCommit.
 */
export function EditorWrapperInner<T extends AnyAppData>(
  { EditorComponent, initialData, projectDir, onCommit, ...rest }: EditorWrapperProps<T>,
  ref: React.ForwardedRef<EditorWrapperHandle<T>>
): JSX.Element {
  const [localData, setLocalData] = useState<T>(initialData)

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => localData,
      setValue: (data: T) => setLocalData(data)
    }),
    [localData]
  )

  // When the inner editor notifies a change, forward it to the parent via onCommit
  const handleChange = (data: T): void => {
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

export const EditorWrapper = forwardRef(EditorWrapperInner) as <T extends AnyAppData>(
  props: EditorWrapperProps<T> & { ref?: React.ForwardedRef<EditorWrapperHandle<T>> }
) => React.ReactElement

export default EditorWrapper
