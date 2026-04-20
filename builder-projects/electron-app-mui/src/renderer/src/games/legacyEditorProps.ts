import { AnyAppData } from '@shared'

// Generic base for legacy editors. Editors can specify a concrete T that extends AnyAppData.
export type LegacyEditorProps<T extends AnyAppData = AnyAppData> = {
  appData: T
  projectDir: string
  onChange: (data: T) => void
}
