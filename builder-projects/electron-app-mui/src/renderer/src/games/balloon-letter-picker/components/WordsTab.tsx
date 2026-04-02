import AddIcon from '@mui/icons-material/Add'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import { Alert, Box, Button, Chip, Collapse, Divider, Typography } from '@mui/material'
import React from 'react'
import { EmptyState, FileDropTarget, SidebarTab, StickyHeader } from '../../../components'
import { BalloonWord } from '../../../types'
import { WordCard } from './WordCard'

export interface WordsTabProps {
  words: BalloonWord[]
  projectDir: string
  onAddWord: (initialImage?: string) => void
  onAddWordFromDrop: (filePath: string) => void
  onUpdateWord: (id: string, patch: Partial<BalloonWord>) => void
  onDeleteWord: (id: string) => void
}

/**
 * Main tab component for BalloonLetterPickerEditor showing all words.
 */
export function WordsTab({
  words,
  projectDir,
  onAddWord,
  onAddWordFromDrop,
  onUpdateWord,
  onDeleteWord
}: WordsTabProps): React.ReactElement {
  const missingWord = words.filter((w) => !w.word.trim())
  const invalidWord = words.filter((w) => w.word.trim() && !/^[A-Za-z]+$/.test(w.word.trim()))
  const missingHint = words.filter((w) => !w.hint.trim())
  const hasIssues = missingWord.length > 0 || invalidWord.length > 0 || missingHint.length > 0

  return (
    <Box>
      <Collapse in={hasIssues}>
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {[
            missingWord.length > 0 && `${missingWord.length} word(s) have no text`,
            invalidWord.length > 0 && `${invalidWord.length} word(s) contain non-letter characters`,
            missingHint.length > 0 && `${missingHint.length} word(s) are missing a hint`
          ]
            .filter(Boolean)
            .join(' · ')}
        </Alert>
      </Collapse>

      <StickyHeader
        title="Words"
        description="Each word will be spelled by picking letters from balloons. Add a hint to help students."
        actions={
          <FileDropTarget onFileDrop={onAddWordFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAddWord()}
            >
              Add Word
            </Button>
          </FileDropTarget>
        }
      />

      {words.length === 0 ? (
        <EmptyState
          icon={<TextFieldsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No words yet"
          description='Click "Add Word" or drop an image on the button to create your first word.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {words.map((w, idx) => (
            <WordCard
              key={w.id}
              word={w}
              index={idx}
              projectDir={projectDir}
              autoFocus={idx === words.length - 1}
              onUpdate={onUpdateWord}
              onDelete={onDeleteWord}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export interface SummarySidebarProps {
  words: BalloonWord[]
}

/**
 * Sidebar summary component showing word statistics.
 */
export function SummarySidebar({ words }: SummarySidebarProps): React.ReactElement {
  const missingWord = words.filter((w) => !w.word.trim())
  const invalidWord = words.filter((w) => w.word.trim() && !/^[A-Za-z]+$/.test(w.word.trim()))
  const missingHint = words.filter((w) => !w.hint.trim())
  const hasIssues = missingWord.length > 0 || invalidWord.length > 0 || missingHint.length > 0

  return (
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
        Words
      </Typography>
      <SidebarTab
        active={true}
        onClick={() => {}}
        icon={<TextFieldsIcon fontSize="small" />}
        label="All Words"
        badge={words.length}
        badgeColor={hasIssues ? 'error' : 'default'}
      />

      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
      >
        Summary
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <SummaryRow label="Total words" value={words.length} />
        <SummaryRow label="With images" value={words.filter((w) => !!w.imagePath).length} />
        <SummaryRow label="With hints" value={words.filter((w) => !!w.hint.trim()).length} />
        {missingWord.length > 0 && (
          <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
            {missingWord.length} missing word text
          </Typography>
        )}
        {invalidWord.length > 0 && (
          <Typography variant="caption" color="warning.main">
            {invalidWord.length} contain non-letters
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Chip
        label={value}
        size="small"
        sx={{ height: 16, fontSize: '0.65rem', minWidth: 24 }}
        color={value === 0 ? 'default' : 'primary'}
      />
    </Box>
  )
}
