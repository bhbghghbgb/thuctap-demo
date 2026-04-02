import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Paper, Tooltip } from '@mui/material'
import React from 'react'
import { AtoZWordField, FileDropTarget, ImagePicker, IndexBadge } from '../../../components'
import { WordSearchItem } from '../../../types'

export interface WordCardProps {
  item: WordSearchItem
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, patch: Partial<WordSearchItem>) => void
  onDelete: (id: string) => void
}

/**
 * Card component for editing a single word in WordSearchEditor.
 * Supports image drop and A-Z word field.
 */
export function WordCard({
  item,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete
}: WordCardProps): React.ReactElement {
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
          label="Word image"
          size={72}
        />
        <AtoZWordField
          label="Word"
          value={item.word}
          onChange={(v) => onUpdate(item.id, { word: v })}
          placeholder="e.g. JUMP"
          autoFocus={autoFocus}
        />
        <Tooltip title="Delete word">
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
