import AddIcon from '@mui/icons-material/Add'
import QuizIcon from '@mui/icons-material/Quiz'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Button, Chip, Collapse, Divider, Typography } from '@mui/material'
import React from 'react'
import { EmptyState, FileDropTarget, SidebarTab, StickyHeader } from '../../../components'
import { QuizAnswer, QuizQuestion } from '../../../types'
import { QuestionCard } from './QuestionCard'

export interface QuizTabProps {
  questions: QuizQuestion[]
  projectDir: string
  onAddQuestion: (initialImage?: string) => void
  onAddQuestionFromDrop: (filePath: string) => void
  onUpdateQuestion: (id: string, patch: Partial<QuizQuestion>) => void
  onDeleteQuestion: (id: string) => void
  onAddAnswer: (qid: string) => void
  onUpdateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  onDeleteAnswer: (qid: string, aid: string) => void
}

/**
 * Main tab component for QuizEditor showing all questions.
 */
export function QuizTab({
  questions,
  projectDir,
  onAddQuestion,
  onAddQuestionFromDrop,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer
}: QuizTabProps): React.ReactElement {
  // Validation
  const noText = questions.filter((q) => !q.question.trim())
  const noCorrect = questions.filter((q) => !q.answers.some((a) => a.isCorrect))
  const emptyAnswers = questions.filter((q) => q.answers.some((a) => !a.text.trim()))
  const tooFewAns = questions.filter((q) => q.answers.length < 2)
  const hasIssues =
    noText.length > 0 || noCorrect.length > 0 || emptyAnswers.length > 0 || tooFewAns.length > 0

  return (
    <Box>
      <Collapse in={hasIssues}>
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {[
            noText.length > 0 && `${noText.length} question(s) have no text`,
            noCorrect.length > 0 && `${noCorrect.length} question(s) have no correct answer marked`,
            emptyAnswers.length > 0 && `${emptyAnswers.length} question(s) have blank answer text`,
            tooFewAns.length > 0 && `${tooFewAns.length} question(s) need at least 2 answers`
          ]
            .filter(Boolean)
            .join(' · ')}
        </Alert>
      </Collapse>

      <StickyHeader
        title="Questions"
        description="Each question has answer choices. Mark which answers are correct."
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
          icon={<QuizIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
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
              onAddAnswer={onAddAnswer}
              onUpdateAnswer={onUpdateAnswer}
              onDeleteAnswer={onDeleteAnswer}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export interface SummarySidebarProps {
  questions: QuizQuestion[]
}

/**
 * Sidebar summary component showing quiz statistics.
 */
export function SummarySidebar({ questions }: SummarySidebarProps): React.ReactElement {
  const noCorrect = questions.filter((q) => !q.answers.some((a) => a.isCorrect))
  const hasIssues = noCorrect.length > 0

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
        icon={<QuizIcon fontSize="small" />}
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
          label="Single-answer"
          value={questions.filter((q) => !q.multipleCorrect).length}
        />
        <SummaryRow
          label="Multiple-answer"
          value={questions.filter((q) => q.multipleCorrect).length}
        />
        {noCorrect.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main">
              {noCorrect.length} need a correct answer
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
