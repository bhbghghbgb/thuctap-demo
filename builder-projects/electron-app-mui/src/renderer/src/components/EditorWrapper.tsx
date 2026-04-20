import { AnyAppData } from '@shared/types'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { EditorProps, EditorRef, OldEditorProps } from '../games/registry'

interface Props extends EditorProps {
  OldEditor: React.ComponentType<OldEditorProps>
}

export const EditorWrapper = forwardRef<EditorRef, Props>(
  ({ OldEditor, initialData, projectDir, onCommit }, ref) => {
    const [appData, setAppData] = useState<AnyAppData>(initialData)

    useImperativeHandle(ref, () => ({
      getValue: () => appData,
      setValue: (data: AnyAppData) => setAppData(data)
    }))

    const handleChange = (newData: AnyAppData): void => {
      setAppData(newData)
      onCommit(newData)
    }

    return <OldEditor appData={appData} projectDir={projectDir} onChange={handleChange} />
  }
)

EditorWrapper.displayName = 'EditorWrapper'
