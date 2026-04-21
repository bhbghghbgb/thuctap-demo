/**
 * QuizContentSection — withForm HOC
 *
 * Renders quiz validation warnings and the list of question cards.
 * Receives the form instance from QuizEditor and passes it down to each QuestionCard.
 *
 * Uses `withForm` so TypeScript can infer the form's value types without requiring
 * explicit generic parameters at every usage site.
 */
import AddIcon from '@mui/icons-material/Add'
import QuizIcon from '@mui/icons-material/Quiz'
import { Alert, Box, Button, Collapse } from '@mui/material'
import { EmptyState, FileDropTarget, StickyHeader } from '@renderer/components'
import { withForm } from '@renderer/lib/form'
import { quizFormOptions } from '../quizFormOptions'
import { QuestionCard } from './QuestionCard'

export const QuizContentSection = withForm({
  ...quizFormOptions,
  props: {
    projectDir: '' as string,
    onCommit: (() => {}) as () => void,
    onAddQuestion: (() => {}) as (img?: string) => void,
    onAddQuestionFromDrop: (async () => {}) as (fp: string) => Promise<void>,
    onDeleteQuestion: (() => {}) as (qIdx: number) => void,
    onAddAnswer: (() => {}) as (qIdx: number) => void,
    onDeleteAnswer: (() => {}) as (qIdx: number, aIdx: number) => void,
    onToggleCorrect: (() => {}) as (qIdx: number, aIdx: number) => void
  },
  render: function Render({
    form,
    projectDir,
    onCommit,
    onAddQuestion,
    onAddQuestionFromDrop,
    onDeleteQuestion,
    onAddAnswer,
    onDeleteAnswer,
    onToggleCorrect
  }) {
    return (
      <Box>
        {/* ── Validation warnings (subscribe to questions array) ── */}
        <form.Subscribe selector={(s) => s.values.questions}>
          {(questions) => {
            const noText = questions.filter((q) => !q.question.trim())
            const noCorrect = questions.filter((q) => !q.answers.some((a) => a.isCorrect))
            const emptyAnswers = questions.filter((q) => q.answers.some((a) => !a.text.trim()))
            const tooFewAns = questions.filter((q) => q.answers.length < 2)
            const hasIssues =
              noText.length > 0 ||
              noCorrect.length > 0 ||
              emptyAnswers.length > 0 ||
              tooFewAns.length > 0

            return (
              <Collapse in={hasIssues}>
                <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
                  {[
                    noText.length > 0 && `${noText.length} question(s) have no text`,
                    noCorrect.length > 0 &&
                      `${noCorrect.length} question(s) have no correct answer marked`,
                    emptyAnswers.length > 0 &&
                      `${emptyAnswers.length} question(s) have blank answer text`,
                    tooFewAns.length > 0 &&
                      `${tooFewAns.length} question(s) need at least 2 answers`
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Alert>
              </Collapse>
            )
          }}
        </form.Subscribe>

        {/* ── Header with Add button ── */}
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

        {/* ── Question list ── */}
        <form.Field name="questions" mode="array">
          {(questionsField) => {
            const questions = questionsField.state.value
            return questions.length === 0 ? (
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
                    form={form}
                    questionIndex={idx}
                    projectDir={projectDir}
                    autoFocus={idx === questions.length - 1}
                    onCommit={onCommit}
                    onDeleteQuestion={onDeleteQuestion}
                    onAddAnswer={onAddAnswer}
                    onDeleteAnswer={onDeleteAnswer}
                    onToggleCorrect={onToggleCorrect}
                  />
                ))}
              </Box>
            )
          }}
        </form.Field>
      </Box>
    )
  }
})
