import AddIcon from '@mui/icons-material/Add'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { QuizAnswer, QuizQuestion } from '../../../types'

export interface AnswerListProps {
  question: QuizQuestion
  projectDir: string
  isSingle: boolean
  onAddAnswer: (qid: string) => void
  onUpdateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  onDeleteAnswer: (qid: string, aid: string) => void
}

/**
 * List of answer choices for a question.
 * Handles marking correct answers and deleting answers.
 */
export function AnswerList({
  question,
  isSingle,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer
}: AnswerListProps): React.ReactElement {
  return (
    <Box sx={{ px: 2, pb: 2, pl: '88px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="overline"
        sx={{ fontSize: '0.6rem', letterSpacing: 2, color: 'text.disabled' }}
      >
        Answers — click the icon to mark as correct
      </Typography>

      {question.answers.map((answer, aIdx) => {
        const isCorrect = answer.isCorrect
        const CorrectIcon = isSingle
          ? isCorrect
            ? CheckCircleIcon
            : RadioButtonUncheckedIcon
          : isCorrect
            ? CheckBoxIcon
            : CheckBoxOutlineBlankIcon

        return (
          <Box key={answer.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isCorrect ? 'Correct answer (click to toggle)' : 'Mark as correct'}>
              <IconButton
                size="small"
                onClick={() => onUpdateAnswer(question.id, answer.id, { isCorrect: !isCorrect })}
                sx={{ color: isCorrect ? 'success.main' : 'text.disabled', flexShrink: 0 }}
              >
                <CorrectIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <TextField
              size="small"
              fullWidth
              value={answer.text}
              onChange={(e) => onUpdateAnswer(question.id, answer.id, { text: e.target.value })}
              placeholder={`Answer ${String.fromCharCode(64 + aIdx + 1)}…`}
              error={!answer.text.trim()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderColor: isCorrect ? 'success.main' : undefined,
                  '& fieldset': { borderColor: isCorrect ? 'rgba(52,211,153,0.4)' : undefined }
                }
              }}
            />

            <Tooltip title="Remove answer">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onDeleteAnswer(question.id, answer.id)}
                  disabled={question.answers.length <= 2}
                  sx={{
                    color: 'error.main',
                    opacity: 0.5,
                    '&:hover': { opacity: 1 },
                    '&.Mui-disabled': { opacity: 0.2 }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )
      })}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => onAddAnswer(question.id)}
        sx={{ alignSelf: 'flex-start', mt: 0.5, opacity: 0.7 }}
      >
        Add answer
      </Button>
    </Box>
  )
}
