import { Box } from '@mui/material'
import { QuizAnswer, QuizAppData, QuizQuestion } from '@shared/types'
import React from 'react'
import { QuizTab, SummarySidebar } from './components'

import { useAppForm } from '@renderer/utils/formStore'
import { EditorWrapperHandle } from '@renderer/components/EditorWrapper'
import * as logic from './quizLogic'
import { useSettings } from '@renderer/hooks/useSettings'

export interface QuizEditorProps {
  initialData: QuizAppData
  projectDir: string
  onCommit: (data: QuizAppData) => void
}

const QuizEditor = React.forwardRef<EditorWrapperHandle<QuizAppData>, QuizEditorProps>(
  ({ initialData, projectDir, onCommit }, ref): React.ReactElement => {
    const { resolved } = useSettings()

    // Initialize the uncontrolled form
    const form = useAppForm({
      defaultValues: initialData,
      onSubmit: ({ value }) => onCommit(value)
    })

    // Expose the "New API" handles to the ProjectPage
    React.useImperativeHandle(ref, () => ({
      getValue: () => form.state.values,
      setValue: (newData) => form.update({ defaultValues: newData })
    }))

    // ── Local Handlers (using Form state + logic) ───────────────────────────
    const handleAddQuestion = (initialImage?: string): void => {
      const { newData } = logic.createQuestion(
        form.state.values,
        resolved.prefillNames,
        initialImage
      )
      form.setFieldValue('questions', newData.questions)
      form.setFieldValue('_questionCounter', newData._questionCounter)
      onCommit(form.state.values)
    }

    const handleAddQuestionFromDrop = async (filePath: string): Promise<void> => {
      const qc = form.state.values._questionCounter + 1
      const qid = `q-${qc}`
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, qid)
      const { newData } = logic.createQuestion(form.state.values, resolved.prefillNames, imagePath)
      form.setFieldValue('questions', newData.questions)
      form.setFieldValue('_questionCounter', newData._questionCounter)
      onCommit(form.state.values)
    }

    const handleUpdateQuestion = (id: string, patch: Partial<QuizQuestion>): void => {
      const updated = logic.updateQuestion(form.state.values, id, patch)
      form.setFieldValue('questions', updated.questions)
      // Note: we don't necessarily onCommit on every single stroke if we want true "uncontrolled"
      // but for structural changes or blurs, we definitely do.
    }

    const handleDeleteQuestion = (id: string): void => {
      const updated = logic.deleteQuestion(form.state.values, id)
      form.setFieldValue('questions', updated.questions)
      onCommit(form.state.values)
    }

    const handleAddAnswer = (qid: string): void => {
      const updated = logic.createAnswer(form.state.values, qid, resolved.prefillNames)
      form.setFieldValue('questions', updated.questions)
      onCommit(form.state.values)
    }

    const handleUpdateAnswer = (qid: string, aid: string, patch: Partial<QuizAnswer>): void => {
      const updated = logic.updateAnswer(form.state.values, qid, aid, patch)
      form.setFieldValue('questions', updated.questions)
    }

    const handleDeleteAnswer = (qid: string, aid: string): void => {
      const updated = logic.deleteAnswer(form.state.values, qid, aid)
      form.setFieldValue('questions', updated.questions)
      onCommit(form.state.values)
    }

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
                onAddQuestion={handleAddQuestion}
                onAddQuestionFromDrop={handleAddQuestionFromDrop}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onAddAnswer={handleAddAnswer}
                onUpdateAnswer={handleUpdateAnswer}
                onDeleteAnswer={handleDeleteAnswer}
                onCommit={() => onCommit(form.state.values)}
              />
            )}
          </form.Subscribe>
        </Box>
      </Box>
    )
  }
)

export default QuizEditor
