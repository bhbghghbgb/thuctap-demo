/**
 * QuestionCard — withForm HOC
 *
 * Renders a single question with its image, text, settings, and answers.
 * Receives form from parent (QuizContentSection) so all fields are registered
 * in the same form instance.
 *
 * Commit strategy:
 * - Text fields (question text, answer text): commit on onBlur
 * - Toggle/structural changes (imagePath, multipleCorrect, isCorrect, add/delete): immediate commit
 */
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AddIcon from '@mui/icons-material/Add'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '@renderer/components'
import { withForm } from '@renderer/lib/form'
import { toBb26 } from '@renderer/utils'
import type { QuizAnswer } from '@shared/types'
import { quizFormOptions } from '../quizFormOptions'

export const QuestionCard = withForm({
  ...quizFormOptions,
  props: {
    questionIndex: 0,
    projectDir: '' as string,
    autoFocus: false as boolean,
    onCommit: (() => {}) as () => void,
    onDeleteQuestion: (() => {}) as (qIdx: number) => void,
    onAddAnswer: (() => {}) as (qIdx: number) => void,
    onDeleteAnswer: (() => {}) as (qIdx: number, aIdx: number) => void,
    onToggleCorrect: (() => {}) as (qIdx: number, aIdx: number) => void
  },
  render: function Render({
    form,
    questionIndex,
    projectDir,
    autoFocus,
    onCommit,
    onDeleteQuestion,
    onAddAnswer,
    onDeleteAnswer,
    onToggleCorrect
  }) {
    const qPrefix = `questions[${questionIndex}]` as const

    return (
      <form.Field name={`${qPrefix}.id`}>
        {(idField) => (
          <FileDropTarget
            onFileDrop={async (fp) => {
              const rel = await window.electronAPI.importImage(fp, projectDir, idField.state.value)
              form.setFieldValue(`${qPrefix}.imagePath`, rel, { dontUpdateMeta: true })
              onCommit()
            }}
          >
            {/* ── No-correct warning border ── */}
            <form.Subscribe selector={(s) => s.values.questions[questionIndex]?.answers}>
              {(answers) => {
                const hasNoCorrect = !answers?.some((a: QuizAnswer) => a.isCorrect)
                return (
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
                    {/* ── Question header ── */}
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <IndexBadge index={questionIndex} color="primary" />

                      {/* Image picker */}
                      <form.Field name={`${qPrefix}.imagePath`}>
                        {(imageField) => (
                          <ImagePicker
                            projectDir={projectDir}
                            desiredNamePrefix={idField.state.value}
                            value={imageField.state.value}
                            onChange={(p) => {
                              imageField.handleChange(p)
                              onCommit()
                            }}
                            label="Question image"
                            size={80}
                          />
                        )}
                      </form.Field>

                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Question text — commits on blur */}
                        <form.Field name={`${qPrefix}.question`}>
                          {(textField) => (
                            <NameField
                              label="Question text"
                              value={textField.state.value}
                              onChange={(v) => textField.handleChange(v)}
                              onBlur={() => {
                                textField.handleBlur()
                                onCommit()
                              }}
                              placeholder="e.g. Which animal is the largest?"
                              autoFocus={autoFocus}
                              multiline
                              required
                            />
                          )}
                        </form.Field>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Multiple-correct toggle — commits immediately */}
                          <form.Field name={`${qPrefix}.multipleCorrect`}>
                            {(mcField) => (
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={mcField.state.value}
                                    onChange={(_, v) => {
                                      mcField.handleChange(v)
                                      // When switching to single-answer, keep only first correct
                                      if (!v) {
                                        const answers = form.getFieldValue(
                                          `${qPrefix}.answers`
                                        ) as QuizAnswer[]
                                        let foundFirst = false
                                        answers.forEach((a, i) => {
                                          if (a.isCorrect && !foundFirst) {
                                            foundFirst = true
                                          } else if (a.isCorrect) {
                                            form.setFieldValue(
                                              `${qPrefix}.answers[${i}].isCorrect`,
                                              false,
                                              { dontUpdateMeta: true }
                                            )
                                          }
                                        })
                                      }
                                      onCommit()
                                    }}
                                  />
                                }
                                label={
                                  <Typography variant="caption" color="text.secondary">
                                    Multiple correct answers
                                  </Typography>
                                }
                                sx={{ m: 0 }}
                              />
                            )}
                          </form.Field>

                          {/* Warning chip */}
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
                          onClick={() => onDeleteQuestion(questionIndex)}
                          sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* ── Answers ── */}
                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        pl: '88px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{ fontSize: '0.6rem', letterSpacing: 2, color: 'text.disabled' }}
                      >
                        Answers — click the icon to mark as correct
                      </Typography>

                      <form.Field name={`${qPrefix}.answers`} mode="array">
                        {(answersField) =>
                          answersField.state.value.map((answer, aIdx) => {
                            const isCorrect = answer.isCorrect
                            const isSingle = !form.getFieldValue(`${qPrefix}.multipleCorrect`)
                            const CorrectIcon = isSingle
                              ? isCorrect
                                ? CheckCircleIcon
                                : RadioButtonUncheckedIcon
                              : isCorrect
                                ? CheckBoxIcon
                                : CheckBoxOutlineBlankIcon

                            return (
                              <Box
                                key={answer.id}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                              >
                                <Tooltip
                                  title={
                                    isCorrect
                                      ? 'Correct answer (click to toggle)'
                                      : 'Mark as correct'
                                  }
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => onToggleCorrect(questionIndex, aIdx)}
                                    sx={{
                                      color: isCorrect ? 'success.main' : 'text.disabled',
                                      flexShrink: 0
                                    }}
                                  >
                                    <CorrectIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {/* Answer text — commits on blur */}
                                <form.Field name={`${qPrefix}.answers[${aIdx}].text`}>
                                  {(textField) => (
                                    <TextField
                                      size="small"
                                      fullWidth
                                      value={textField.state.value}
                                      onChange={(e) => textField.handleChange(e.target.value)}
                                      onBlur={() => {
                                        textField.handleBlur()
                                        onCommit()
                                      }}
                                      placeholder={`Answer ${toBb26(aIdx)}…`}
                                      error={!textField.state.value.trim()}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          borderColor: isCorrect ? 'success.main' : undefined,
                                          '& fieldset': {
                                            borderColor: isCorrect
                                              ? 'rgba(52,211,153,0.4)'
                                              : undefined
                                          }
                                        }
                                      }}
                                    />
                                  )}
                                </form.Field>

                                <Tooltip title="Remove answer">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => onDeleteAnswer(questionIndex, aIdx)}
                                      disabled={answersField.state.value.length <= 2}
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
                          })
                        }
                      </form.Field>

                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onAddAnswer(questionIndex)}
                        sx={{ alignSelf: 'flex-start', mt: 0.5, opacity: 0.7 }}
                      >
                        Add answer
                      </Button>
                    </Box>
                  </Paper>
                )
              }}
            </form.Subscribe>
          </FileDropTarget>
        )}
      </form.Field>
    )
  }
})
