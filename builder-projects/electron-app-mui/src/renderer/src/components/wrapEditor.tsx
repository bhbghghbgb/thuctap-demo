import React from 'react'
import { EditorWrapper } from './EditorWrapper'

// Helper to obtain a wrapped editor from an existing editor component
// This is a thin adapter that can be used by the registry to migrate editors progressively

export function wrapEditor(EditorComponent: React.ComponentType<any>) {
  return (props: any) => (
    <EditorWrapper
      EditorComponent={EditorComponent}
      initialData={props.appData}
      projectDir={props.projectDir}
      onCommit={props.onCommit}
      {...props}
    />
  )
}
