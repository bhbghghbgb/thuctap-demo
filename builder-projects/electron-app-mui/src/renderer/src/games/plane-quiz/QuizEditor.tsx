import { Box } from '@mui/material'
import { QuizAppData } from '@shared/types'
import React from 'react'
import { QuizTab, SummarySidebar } from './components'
import { usePlaneQuizCrud } from './hooks/usePlaneQuizCrud'

import { LegacyEditorProps } from '../legacyEditorProps'

export default function QuizEditor({
  appData,
  projectDir,
  onChange
}: LegacyEditorProps<QuizAppData>): React.ReactElement {
  const {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    updateAnswer,
    deleteAnswer
  } = usePlaneQuizCrud(appData, projectDir, onChange)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar questions={questions} />

      {/* ── Main ── */}
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
