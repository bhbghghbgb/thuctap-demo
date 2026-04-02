import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Tooltip,
  Typography
} from '@mui/material'
import React from 'react'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '../../../components'
import { QuizAnswer, QuizQuestion } from '../../../types'
import { AnswerList } from './AnswerList'

export interface QuestionCardProps {
  question: QuizQuestion
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, patch: Partial<QuizQuestion>) => void
  onDelete: (id: string) => void
  onAddAnswer: (qid: string) => void
  onUpdateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  onDeleteAnswer: (qid: string, aid: string) => void
}

/**
 * Card component for editing a single question in QuizEditor.
 * Supports image drop, question text editing, and answer management.
 */
export function QuestionCard({
  question,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer
}: QuestionCardProps): React.ReactElement {
  const hasNoCorrect = !question.answers.some((a) => a.isCorrect)
  const isSingle = !question.multipleCorrect

  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, question.id)
        onUpdate(question.id, { imagePath: rel })
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: hasNoCorrect ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          overflow: 'hidden'
        }}
      >
        {/* Question header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <IndexBadge index={index} color="primary" />

          <ImagePicker
            projectDir={projectDir}
            desiredNamePrefix={question.id}
            value={question.imagePath}
            onChange={(p) => onUpdate(question.id, { imagePath: p })}
            label="Question image"
            size={80}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <NameField
              label="Question text"
              value={question.question}
              onChange={(v) => onUpdate(question.id, { question: v })}
              placeholder="e.g. Which animal is the largest?"
              autoFocus={autoFocus}
              multiline
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={question.multipleCorrect}
                    onChange={(_, v) => onUpdate(question.id, { multipleCorrect: v })}
                  />
                }
                label={
                  <Typography variant="caption" color="text.secondary">
                    Multiple correct answers
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              {hasNoCorrect && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                  label="No correct answer marked"
                  size="small"
                  color="warning"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>

          <Tooltip title="Delete question">
            <IconButton
              size="small"
              onClick={() => onDelete(question.id)}
              sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Answers */}
        <AnswerList
          question={question}
          projectDir={projectDir}
          isSingle={isSingle}
          onAddAnswer={onAddAnswer}
          onUpdateAnswer={onUpdateAnswer}
          onDeleteAnswer={onDeleteAnswer}
        />
      </Paper>
    </FileDropTarget>
  )
}
