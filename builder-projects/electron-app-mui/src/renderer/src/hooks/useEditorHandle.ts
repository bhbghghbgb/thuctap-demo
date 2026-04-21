/**
 * useEditorHandle
 *
 * A reusable hook that wires a TanStack Form instance to the EditorWrapperHandle
 * imperative ref expected by ProjectPage (getValue / setValue).
 *
 * When an editor is FULLY migrated (no longer uses EditorWrapper), it will:
 *  - call useEditorHandle(ref, form) to satisfy the handle contract
 *  - call form.setFieldValue on each setValue (for undo/redo sync)
 *
 * @param ref    - The forwarded ref from ProjectPage (via forwardRef)
 * @param form   - The TanStack form instance returned by useAppForm
 * @param toData - Maps form.state.values → the editor's AppData shape
 * @param reset  - Callback that resets the form to new data (called on setValue, e.g. undo/redo)
 */
import type { AnyAppData } from '@shared/types'
import { useImperativeHandle } from 'react'
import type { EditorWrapperHandle } from '@renderer/components/EditorWrapper'

export function useEditorHandle<T extends AnyAppData>(
  ref: React.ForwardedRef<EditorWrapperHandle<T>>,
  getValue: () => T,
  setValue: (data: T) => void
): void {
  useImperativeHandle(
    ref,
    () => ({
      getValue,
      setValue
    }),
    // getValue and setValue should be stable (wrapped in useCallback by the caller)
    [getValue, setValue]
  )
}
