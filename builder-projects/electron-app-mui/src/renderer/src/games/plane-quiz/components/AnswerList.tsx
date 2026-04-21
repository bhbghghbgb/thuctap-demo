import AddIcon from '@mui/icons-material/Add'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
import { toBb26 } from '@renderer/utils'
import { FormNameField } from '@renderer/components/editors/FormFields'
import { useFormContext } from '@renderer/utils/formStore'
import { QuizAnswer, QuizAppData, QuizQuestion } from '@shared/types'
import React from 'react'

export interface AnswerListProps {
  question: QuizQuestion
  projectDir: string
  isSingle: boolean
  onAddAnswer: (qid: string) => void
  onUpdateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  onDeleteAnswer: (qid: string, aid: string) => void
  onCommit: () => void
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
  onDeleteAnswer,
  onCommit
}: AnswerListProps): React.ReactElement {
  const form = useFormContext<QuizAppData>()
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

            <form.Field
              name={`questions[${form.state.values.questions.findIndex((q) => q.id === question.id)}].answers[${aIdx}].text`}
            >
              {() => (
                <FormNameField
                  label=""
                  placeholder={`Answer ${toBb26(aIdx + 1)}…`}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderColor: isCorrect ? 'success.main' : undefined,
                      '& fieldset': { borderColor: isCorrect ? 'rgba(52,211,153,0.4)' : undefined }
                    }
                  }}
                  onBlur={onCommit}
                />
              )}
            </form.Field>

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
