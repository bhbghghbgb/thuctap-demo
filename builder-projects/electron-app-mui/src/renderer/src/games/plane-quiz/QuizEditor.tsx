import { Box } from '@mui/material'
import { QuizAppData } from '@shared/types'
import { useForm } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { EditorProps, EditorRef } from '../registry'
import { QuizTab, SummarySidebar } from './components'
import { usePlaneQuizCrud } from './hooks/usePlaneQuizCrud'

function normalize(d: QuizAppData): QuizAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: (d.questions ?? []).map((q) => ({
      ...q,
      _answerCounter: q._answerCounter ?? 0,
      answers: (q.answers ?? []).map((a) => ({ ...a }))
    }))
  }
}

const QuizEditor = forwardRef<EditorRef, EditorProps>(
  ({ initialData: raw, projectDir, onCommit }, ref) => {
    const initialData = useMemo(() => normalize(raw), [raw])

    const form = useForm({
      defaultValues: initialData
    })

    const {
      questions,
      addQuestion,
      addQuestionFromDrop,
      updateQuestion,
      deleteQuestion,
      addAnswer,
      updateAnswer,
      deleteAnswer
    } = usePlaneQuizCrud(form, projectDir, onCommit)

    useImperativeHandle(ref, () => ({
      getValue: () => form.state.values,
      setValue: (data: QuizAppData) => {
        form.reset()
        form.update({ defaultValues: normalize(data) })
      }
    }))

    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <form.Subscribe selector={(state) => state.values.questions}>
          {(questions) => <SummarySidebar questions={questions} />}
        </form.Subscribe>

        {/* ── Main ── */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <form.Subscribe selector={(state) => state.values.questions}>
            {(questions) => (
              <QuizTab
                questions={questions}
                projectDir={projectDir}
                onAddQuestion={addQuestion}
                onAddQuestionFromDrop={addQuestionFromDrop}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestion}
                onAddAnswer={addAnswer}
                onUpdateAnswer={updateAnswer}
                onDeleteAnswer={deleteAnswer}
                onCommit={() => onCommit(form.state.values)}
              />
            )}
          </form.Subscribe>
        </Box>
      </Box>
    )
  }
)

QuizEditor.displayName = 'QuizEditor'
export default QuizEditor
