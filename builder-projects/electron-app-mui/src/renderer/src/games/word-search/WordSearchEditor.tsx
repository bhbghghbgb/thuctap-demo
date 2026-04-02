import CollectionsIcon from '@mui/icons-material/Collections'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Typography } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback, useState } from 'react'
import { SidebarTab } from '../../components/editors'
import { WordSearchAppData, WordSearchItem } from '../../types'
import { getExcelName } from '../../utils/stringUtils'
import { SettingsTab, WordsTab } from './components'

interface Props {
  appData: WordSearchAppData
  projectDir: string
  onChange: (data: WordSearchAppData) => void
}

type Tab = 'words' | 'settings'

function normalize(d: WordSearchAppData): WordSearchAppData {
  return { ...d, _itemCounter: d._itemCounter ?? 0, items: d.items ?? [] }
}

export default function WordSearchEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.JSX.Element {
  const data = normalize(raw)
  const [tab, setTab] = useState<Tab>('words')
  const { resolved } = useSettings()
  const { items } = data

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addItem = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextItemId()
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${getExcelName(counter)}` : '',
        imagePath: initialImage ?? null
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${getExcelName(counter)}` : '',
        imagePath
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<WordSearchItem>) => {
      onChange({ ...data, items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
    },
    [data, items, onChange]
  )

  const deleteItem = useCallback(
    (id: string) => {
      onChange({ ...data, items: items.filter((i) => i.id !== id) })
    },
    [data, items, onChange]
  )

  useEntityCreateShortcut({
    onTier1: addItem
  })

  // Basic validation
  const unnamedI = items.filter((i) => !i.word.trim())
  const invalidI = items.filter((i) => i.word.trim() && !/^[A-Z]+$/.test(i.word.trim()))

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#13161f',
          p: 2,
          gap: 1
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Sections
        </Typography>
        <SidebarTab
          active={tab === 'words'}
          onClick={() => setTab('words')}
          icon={<CollectionsIcon fontSize="small" />}
          label="Words"
          badge={items.length}
          badgeColor={unnamedI.length > 0 || invalidI.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'settings'}
          onClick={() => setTab('settings')}
          icon={<SettingsIcon fontSize="small" />}
          label="Settings"
          badge={0}
          badgeColor="default"
        />
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {tab === 'words' && (
          <WordsTab
            items={items}
            projectDir={projectDir}
            onAdd={addItem}
            onAddFromDrop={addItemFromDrop}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab data={data} projectDir={projectDir} onChange={onChange} />
        )}
      </Box>
    </Box>
  )
}
