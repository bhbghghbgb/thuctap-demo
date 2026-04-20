import React from 'react'
import { EditorWrapper } from './EditorWrapper'
import { LegacyEditorProps } from '../games/legacyEditorProps'
import { AnyAppData } from '@shared'

// Helper to obtain a wrapped editor from an existing editor component
// This is a thin adapter that can be used by the registry to migrate editors progressively

type WrapperIncomingProps = {
  appData?: AnyAppData
  projectDir?: string
  onCommit?: (data: AnyAppData) => void
  [key: string]: unknown
}

export function wrapEditor<T extends AnyAppData = AnyAppData>(
  EditorComponent: React.ComponentType<LegacyEditorProps<T>>
) {
  return (props: WrapperIncomingProps) => (
    <EditorWrapper
      // Cast to the non-generic type expected by EditorWrapper
      EditorComponent={EditorComponent as unknown as React.ComponentType<LegacyEditorProps<any>>}
      initialData={props.appData as T}
      projectDir={props.projectDir}
      onCommit={props.onCommit as any}
      {...props}
    />
  )
}
