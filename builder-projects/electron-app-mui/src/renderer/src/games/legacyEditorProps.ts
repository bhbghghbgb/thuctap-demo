import { AnyAppData } from '@shared'

// Generic base for legacy editors.
export type LegacyEditorProps = {
  appData: AnyAppData
  projectDir: string
  onChange: (data: AnyAppData) => void
}
