import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import { Alert, Box, Button, Collapse } from '@mui/material'
import React from 'react'
import { EmptyState, FileDropTarget, StickyHeader } from '../../../components'
import { PairMatchingItem } from '../../../types'
import { PairCard } from './PairCard'

export interface PairsTabProps {
  items: PairMatchingItem[]
  projectDir: string
  onAdd: () => void
  onAddFromDrop: (filePath: string) => void
  onUpdate: (id: string, patch: Partial<PairMatchingItem>) => void
  onDelete: (id: string) => void
}

/**
 * Main tab component for PairMatchingEditor showing all pairs.
 */
export function PairsTab({
  items,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: PairsTabProps): React.ReactElement {
  const unnamedI = items.filter((i) => !i.keyword.trim())
  const hasIssues = unnamedI.length > 0

  return (
    <Box>
      <Collapse in={hasIssues}>
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {unnamedI.length > 0 && `${unnamedI.length} pair(s) missing a keyword`}
        </Alert>
      </Collapse>

      <StickyHeader
        title="Pairs"
        description="Add pairs of images and keywords for students to match."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAdd()}
            >
              Add Pair
            </Button>
          </FileDropTarget>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<CollectionsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No pairs yet"
          description='Click "Add Pair" or drop an image here to create one.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item, idx) => (
            <PairCard
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
