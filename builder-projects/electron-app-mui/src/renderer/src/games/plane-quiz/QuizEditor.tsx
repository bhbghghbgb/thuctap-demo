import { Box } from '@mui/material'
import { QuizAppData } from '@shared/types'
import React, { useImperativeHandle, useState } from 'react'
import { QuizTab, SummarySidebar } from './components'
import { usePlaneQuizCrud } from './hooks/usePlaneQuizCrud'

interface Props {
  initialData: QuizAppData
  projectDir: string
  onCommit: (data: QuizAppData) => void
}

function normalize(d: QuizAppData): QuizAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: (d.questions ?? []).map((q) => ({ ...q, _answerCounter: q._answerCounter ?? 0 }))
  }
}

export interface QuizEditorRef {
  getValue(): QuizAppData
  setValue(data: QuizAppData): void
}

const QuizEditorComponent = React.forwardRef<QuizEditorRef, Props>(
  ({ initialData, projectDir, onCommit }, ref): React.ReactElement => {
    const [data, setData] = useState<QuizAppData>(normalize(initialData))

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => data,
        setValue: (newData: QuizAppData) => {
          setData(normalize(newData))
        }
      }),
      [data]
    )

    const handleCommit = (newData: QuizAppData) => {
      setData(newData)
      onCommit(newData)
    }

    const {
      questions,
      addQuestion,
      addQuestionFromDrop,
      updateQuestion,
      deleteQuestion,
      addAnswer,
      updateAnswer,
      deleteAnswer
    } = usePlaneQuizCrud(data, projectDir, handleCommit)

    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <SummarySidebar questions={questions} />
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
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
          />
        </Box>
      </Box>
    )
  }
)

QuizEditorComponent.displayName = 'QuizEditor'

export default QuizEditorComponent
