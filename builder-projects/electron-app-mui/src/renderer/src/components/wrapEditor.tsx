import React from 'react'
import { EditorWrapper, EditorWrapperHandle } from './EditorWrapper'
import { LegacyEditorProps } from '../games/legacyEditorProps'
import { AnyAppData } from '@shared'

// Helper to obtain a wrapped editor from an existing editor component
// This is a thin adapter that can be used by the registry to migrate editors progressively

type WrapperIncomingProps = {
  ref: React.ForwardedRef<EditorWrapperHandle>
  initialData: AnyAppData
  projectDir: string
  onCommit: (data: AnyAppData) => void
}

export function wrapEditor(
  EditorComponent: React.ComponentType<LegacyEditorProps>
): React.ComponentType<WrapperIncomingProps & React.RefAttributes<EditorWrapperHandle>> {
  const Wrapped = React.forwardRef<EditorWrapperHandle, WrapperIncomingProps>((props, ref) => (
    <EditorWrapper ref={ref} EditorComponent={EditorComponent} {...props} />
  ))
  Wrapped.displayName = `WrapEditor(${EditorComponent.displayName ?? EditorComponent.name ?? 'Editor'})`
  return Wrapped
}
