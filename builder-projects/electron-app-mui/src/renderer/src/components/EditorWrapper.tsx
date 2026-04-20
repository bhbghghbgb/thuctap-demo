import { EditorProps, EditorPropsV2 } from '@renderer/games/registry'
import type { ComponentType, ForwardRefRenderFunction, JSX } from 'react'
import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  useImperativeHandle,
  useRef,
  useState
} from 'react'

export interface EditorRef<T> {
  getValue(): T
  setValue(value: T): void
}

interface WrappedEditorProps<T> {
  initialData: T
  projectDir: string
  onCommit: (data: T) => void
}

export function createEditorWrapper<T>(
  EditorComponent: ComponentType<EditorPropsV2>
): ForwardRefRenderFunction<EditorRef<T>, WrappedEditorProps<T>> {
  const ForwardedEditor = (
    { initialData, projectDir, onCommit }: WrappedEditorProps<T>,
    ref
  ): JSX.Element => {
    const [data, setData] = useState<T>(initialData)

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => data,
        setValue: (value: T) => {
          setData(value)
        }
      }),
      [data]
    )

    return (
      <EditorComponent
        initialData={initialData}
        projectDir={projectDir}
        onCommit={onCommit}
      />
    )
  }

  return ForwardedEditor
}

interface LegacyWrapperProps<T> {
  EditorComponent: ComponentType<EditorProps>
  appData: T
  projectDir: string
  onChange: (data: T) => void
}

export function createLegacyWrapper<T>() {
  return function LegacyWrapper({
    EditorComponent,
    appData,
    projectDir,
    onChange
  }: LegacyWrapperProps<T>): JSX.Element {
    const [localData, setLocalData] = useState<T>(appData)
    const isInitialMount = useRef(true)

    if (isInitialMount.current && appData !== localData) {
      setLocalData(appData)
      isInitialMount.current = false
    }

    return (
      <EditorComponent
        appData={localData}
        projectDir={projectDir}
        onChange={onChange}
      />
    )
  }
}