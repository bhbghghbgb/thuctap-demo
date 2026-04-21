import { Box } from '@mui/material'
import type { EditorWrapperHandle } from '@renderer/components/EditorWrapper'
import { useEditorHandle } from '@renderer/hooks/useEditorHandle'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAppForm } from '@renderer/lib/form'
import { toBb26 } from '@renderer/utils'
import type { QuizAnswer, QuizAppData, QuizQuestion } from '@shared/types'
import { forwardRef, useCallback } from 'react'
import { QuizContentSection, SummarySidebar } from './components'
import { quizFormOptions } from './quizFormOptions'

export type QuizEditorProps = {
  initialData: QuizAppData
  projectDir: string
  onCommit: (data: QuizAppData) => void
}

/**
 * Plane Quiz Editor — natively migrated to TanStack Form.
 *
 * No longer uses EditorWrapper. Instead, it:
 * - Manages its own form state via useAppForm
 * - Exposes getValue / setValue via useEditorHandle (for ProjectPage's undo/redo contract)
 * - Commits to the parent via onCommit on blur (text) or immediately (structural changes)
 */
const QuizEditor = forwardRef<EditorWrapperHandle<QuizAppData>, QuizEditorProps>(
  function QuizEditor({ initialData, projectDir, onCommit }, ref) {
    const { resolved } = useSettings()

    const form = useAppForm({
      ...quizFormOptions,
      defaultValues: initialData
    })

    // ── Ref handle (ProjectPage contract) ─────────────────────────────────────
    const getValue = useCallback((): QuizAppData => form.state.values, [form])
    const setValue = useCallback(
      (data: QuizAppData): void => {
        form.reset(data)
      },
      [form]
    )
    useEditorHandle<QuizAppData>(ref, getValue, setValue)

    // ── Commit helper ─────────────────────────────────────────────────────────
    // Reads the latest form state and sends it to ProjectPage.
    // For structural changes (add/delete), called immediately after the mutation.
    // For text changes, the sub-components call this on onBlur.
    const commit = useCallback((): void => {
      onCommit(form.state.values)
    }, [form, onCommit])

    // ── Question CRUD ──────────────────────────────────────────────────────────
    const addQuestion = useCallback(
      (initialImage?: string): void => {
        const qc = (form.getFieldValue('_questionCounter') as number) + 1
        const qid = `q-${qc}`
        const q: QuizQuestion = {
          id: qid,
          question: resolved.prefillNames ? `Question ${qc}` : '',
          imagePath: initialImage ?? null,
          multipleCorrect: false,
          _answerCounter: 2,
          answers: [
            { id: `${qid}-a-1`, text: resolved.prefillNames ? 'Answer A' : '', isCorrect: true },
            { id: `${qid}-a-2`, text: resolved.prefillNames ? 'Answer B' : '', isCorrect: false }
          ]
        }
        form.setFieldValue('_questionCounter', qc, { touch: false })
        form.pushFieldValue('questions', q, { touch: false })
        commit()
      },
      [form, resolved.prefillNames, commit]
    )

    const addQuestionFromDrop = useCallback(
      async (filePath: string): Promise<void> => {
        const qc = (form.getFieldValue('_questionCounter') as number) + 1
        const qid = `q-${qc}`
        const imagePath = await window.electronAPI.importImage(filePath, projectDir, qid)
        const q: QuizQuestion = {
          id: qid,
          question: resolved.prefillNames ? `Question ${qc}` : '',
          imagePath,
          multipleCorrect: false,
          _answerCounter: 2,
          answers: [
            { id: `${qid}-a-1`, text: resolved.prefillNames ? 'Answer A' : '', isCorrect: true },
            { id: `${qid}-a-2`, text: resolved.prefillNames ? 'Answer B' : '', isCorrect: false }
          ]
        }
        form.setFieldValue('_questionCounter', qc, { touch: false })
        form.pushFieldValue('questions', q, { touch: false })
        commit()
      },
      [form, projectDir, resolved.prefillNames, commit]
    )

    const deleteQuestion = useCallback(
      (qIdx: number): void => {
        form.removeFieldValue('questions', qIdx, { touch: false })
        commit()
      },
      [form, commit]
    )

    // ── Answer CRUD ────────────────────────────────────────────────────────────
    const addAnswer = useCallback(
      (qIdx: number): void => {
        const q = form.getFieldValue(`questions[${qIdx}]`) as QuizQuestion
        const ac = q._answerCounter + 1
        const newAnswer: QuizAnswer = {
          id: `${q.id}-a-${ac}`,
          text: resolved.prefillNames ? `Answer ${toBb26(ac)}` : '',
          isCorrect: false
        }
        form.setFieldValue(`questions[${qIdx}]._answerCounter`, ac, { touch: false })
        form.pushFieldValue(`questions[${qIdx}].answers`, newAnswer, { touch: false })
        commit()
      },
      [form, resolved.prefillNames, commit]
    )

    const deleteAnswer = useCallback(
      (qIdx: number, aIdx: number): void => {
        form.removeFieldValue(`questions[${qIdx}].answers`, aIdx, { touch: false })
        commit()
      },
      [form, commit]
    )

    // Toggle isCorrect, enforcing single-answer constraint
    const toggleCorrect = useCallback(
      (qIdx: number, aIdx: number): void => {
        const multipleCorrect = form.getFieldValue(`questions[${qIdx}].multipleCorrect`) as boolean
        const answers = form.getFieldValue(`questions[${qIdx}].answers`) as QuizAnswer[]
        const isCurrentlyCorrect = answers[aIdx].isCorrect

        if (!multipleCorrect) {
          // Single-answer: mark only this one, clear others
          answers.forEach((_, i) => {
            form.setFieldValue(
              `questions[${qIdx}].answers[${i}].isCorrect`,
              i === aIdx ? !isCurrentlyCorrect : false,
              { touch: false }
            )
          })
        } else {
          form.setFieldValue(`questions[${qIdx}].answers[${aIdx}].isCorrect`, !isCurrentlyCorrect, {
            touch: false
          })
        }
        commit()
      },
      [form, commit]
    )

    // Keyboard shortcut: Ctrl+N adds a question
    useEntityCreateShortcut({ onTier1: addQuestion })

    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* ── Sidebar: subscribes to questions for reactive summary ── */}
        <form.Subscribe selector={(s) => s.values.questions}>
          {(questions) => <SummarySidebar questions={questions} />}
        </form.Subscribe>

        {/* ── Main content ── */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <QuizContentSection
            form={form}
            projectDir={projectDir}
            onCommit={commit}
            onAddQuestion={addQuestion}
            onAddQuestionFromDrop={addQuestionFromDrop}
            onDeleteQuestion={deleteQuestion}
            onAddAnswer={addAnswer}
            onDeleteAnswer={deleteAnswer}
            onToggleCorrect={toggleCorrect}
          />
        </Box>
      </Box>
    )
  }
)

export default QuizEditor
