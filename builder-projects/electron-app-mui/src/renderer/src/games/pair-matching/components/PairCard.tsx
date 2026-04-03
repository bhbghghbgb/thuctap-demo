import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Paper, TextField, Tooltip } from '@mui/material'
import React from 'react'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '../../../components'
import { PairMatchingItem } from '../../../types'

export interface PairCardProps {
  item: PairMatchingItem
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, patch: Partial<PairMatchingItem>) => void
  onDelete: (id: string) => void
}

/**
 * Card component for editing a single pair in PairMatchingEditor.
 * Supports image drop, keyword editing, and minPairs configuration.
 */
export function PairCard({
  item,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete
}: PairCardProps): React.ReactElement {
  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, item.id)
        onUpdate(item.id, { imagePath: rel })
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'rgba(255,255,255,0.12)' }
        }}
      >
        <IndexBadge index={index} color="primary" />
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={item.id}
          value={item.imagePath}
          onChange={(p) => onUpdate(item.id, { imagePath: p })}
          label="Image"
          size={72}
        />
        <NameField
          label="Keyword"
          value={item.keyword}
          onBlur={(v) => onUpdate(item.id, { keyword: v })}
          placeholder="e.g. Apple, Dog…"
          autoFocus={autoFocus}
        />
        <TextField
          label="Min Pairs"
          type="number"
          size="small"
          value={item.minPairs ?? ''}
          onBlur={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onUpdate(item.id, { minPairs: val })
          }}
          sx={{ width: 100 }}
          placeholder="Default"
        />
        <Tooltip title="Delete pair">
          <IconButton
            size="small"
            onClick={() => onDelete(item.id)}
            sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </FileDropTarget>
  )
}
