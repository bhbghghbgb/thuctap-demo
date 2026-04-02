import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import { Alert, Box, Button, Collapse } from '@mui/material'
import React from 'react'
import { EmptyState, FileDropTarget, StickyHeader } from '../../../components'
import { WordSearchItem } from '../../../types'
import { WordCard } from './WordCard'

export interface WordsTabProps {
  items: WordSearchItem[]
  projectDir: string
  onAdd: () => void
  onAddFromDrop: (filePath: string) => void
  onUpdate: (id: string, patch: Partial<WordSearchItem>) => void
  onDelete: (id: string) => void
}

/**
 * Main tab component for WordSearchEditor showing all words.
 */
export function WordsTab({
  items,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: WordsTabProps): React.ReactElement {
  const unnamedI = items.filter((i) => !i.word.trim())
  const invalidI = items.filter((i) => i.word.trim() && !/^[A-Z]+$/.test(i.word.trim()))
  const hasIssues = unnamedI.length > 0 || invalidI.length > 0

  return (
    <Box>
      <Collapse in={hasIssues}>
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {[
            unnamedI.length > 0 && `${unnamedI.length} item(s) missing a word`,
            invalidI.length > 0 && `${invalidI.length} item(s) with invalid characters (A-Z only)`
          ]
            .filter(Boolean)
            .join(' · ')}
        </Alert>
      </Collapse>

      <StickyHeader
        title="Words"
        description="Add words and corresponding images for the word search."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAdd()}
            >
              Add Word
            </Button>
          </FileDropTarget>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<CollectionsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No words yet"
          description='Click "Add Word" or drop an image here to create one.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item, idx) => (
            <WordCard
              key={item.id}
              item={item}
              index={idx}
              projectDir={projectDir}
              onUpdate={onUpdate}
              onDelete={onDelete}
              autoFocus={idx === items.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
