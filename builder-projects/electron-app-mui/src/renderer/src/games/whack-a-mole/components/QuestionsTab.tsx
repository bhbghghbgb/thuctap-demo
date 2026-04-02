import MoleIcon from '@mui/icons-material/Cookie'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Button, Chip, Collapse, Divider, Typography } from '@mui/material'
import React from 'react'
import { EmptyState, FileDropTarget, SidebarTab, StickyHeader } from '../../../components'
import { WhackAMoleQuestion } from '../../../types'
import { QuestionCard } from './QuestionCard'

export interface QuestionsTabProps {
  questions: WhackAMoleQuestion[]
  projectDir: string
  onAddQuestion: (initialImage?: string) => void
  onAddQuestionFromDrop: (filePath: string) => void
  onUpdateQuestion: (id: string, patch: Partial<WhackAMoleQuestion>) => void
  onDeleteQuestion: (id: string) => void
}

/**
 * Main tab component for WhackAMoleEditor showing all questions.
 */
export function QuestionsTab({
  questions,
  projectDir,
  onAddQuestion,
  onAddQuestionFromDrop,
  onUpdateQuestion,
  onDeleteQuestion
}: QuestionsTabProps): React.ReactElement {
  const noQuestion = questions.filter((q) => !q.question.trim())
  const noAnswer = questions.filter((q) => !q.answerText.trim())
  const hasIssues = noQuestion.length > 0 || noAnswer.length > 0

  return (
    <Box>
      <Collapse in={hasIssues}>
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {[
            noQuestion.length > 0 && `${noQuestion.length} question(s) have no text`,
            noAnswer.length > 0 && `${noAnswer.length} question(s) have no answer text`
          ]
            .filter(Boolean)
            .join(' · ')}
        </Alert>
      </Collapse>

      <StickyHeader
        title="Questions"
        description="Each question has a correct answer. All answers will be pooled in the game."
        actions={
          <FileDropTarget onFileDrop={onAddQuestionFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAddQuestion()}
            >
              Add Question
            </Button>
          </FileDropTarget>
        }
      />

      {questions.length === 0 ? (
        <EmptyState
          icon={<MoleIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No questions yet"
          description='Click "Add Question" or drop an image to create your first question.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              projectDir={projectDir}
              autoFocus={idx === questions.length - 1}
              onUpdate={onUpdateQuestion}
              onDelete={onDeleteQuestion}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export interface SummarySidebarProps {
  questions: WhackAMoleQuestion[]
}

/**
 * Sidebar summary component showing question statistics.
 */
export function SummarySidebar({ questions }: SummarySidebarProps): React.ReactElement {
  const noQuestion = questions.filter((q) => !q.question.trim())
  const noAnswer = questions.filter((q) => !q.answerText.trim())
  const hasIssues = noQuestion.length > 0 || noAnswer.length > 0

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
        Questions
      </Typography>
      <SidebarTab
        active={true}
        onClick={() => {}}
        icon={<MoleIcon fontSize="small" />}
        label="All Questions"
        badge={questions.length}
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
        <SummaryRow label="Total questions" value={questions.length} />
        <SummaryRow
          label="With question image"
          value={questions.filter((q) => q.questionImage !== null).length}
        />
        <SummaryRow
          label="With answer image"
          value={questions.filter((q) => q.answerImage !== null).length}
        />
        {noQuestion.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main">
              {noQuestion.length} missing question text
            </Typography>
          </Box>
        )}
        {noAnswer.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main">
              {noAnswer.length} missing answer text
            </Typography>
          </Box>
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

// Need to import AddIcon
import AddIcon from '@mui/icons-material/Add'
