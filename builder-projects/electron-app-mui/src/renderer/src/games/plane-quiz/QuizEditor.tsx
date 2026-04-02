import { Box } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import React, { useCallback } from 'react'
import { QuizAnswer, QuizAppData, QuizQuestion } from '../../types'
import { QuizTab, SummarySidebar } from './components'

interface Props {
  appData: QuizAppData
  projectDir: string
  onChange: (data: QuizAppData) => void
}

function normalize(d: QuizAppData): QuizAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: (d.questions ?? []).map((q) => ({ ...q, _answerCounter: q._answerCounter ?? 0 }))
  }
}

export default function QuizEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const { resolved } = useSettings()
  const { questions } = data

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addQuestion = useCallback(
    (initialImage?: string) => {
      const qc = data._questionCounter + 1
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
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = data._questionCounter + 1
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
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, projectDir, resolved.prefillNames, onChange]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuizQuestion>) => {
      onChange({ ...data, questions: questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
    },
    [data, questions, onChange]
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      onChange({ ...data, questions: questions.filter((q) => q.id !== id) })
    },
    [data, questions, onChange]
  )

  const addAnswer = useCallback(
    (qid: string) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          const ac = q._answerCounter + 1
          const newAnswer: QuizAnswer = {
            id: `${qid}-a-${ac}`,
            text: resolved.prefillNames ? `Answer ${String.fromCharCode(64 + ac)}` : '',
            isCorrect: false
          }
          return { ...q, _answerCounter: ac, answers: [...q.answers, newAnswer] }
        })
      })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const updateAnswer = useCallback(
    (qid: string, aid: string, patch: Partial<QuizAnswer>) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          let answers = q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a))
          if (patch.isCorrect && !q.multipleCorrect) {
            answers = answers.map((a) => (a.id === aid ? a : { ...a, isCorrect: false }))
          }
          return { ...q, answers }
        })
      })
    },
    [data, questions, onChange]
  )

  const deleteAnswer = useCallback(
    (qid: string, aid: string) => {
      onChange({
        ...data,
        questions: questions.map((q) =>
          q.id !== qid ? q : { ...q, answers: q.answers.filter((a) => a.id !== aid) }
        )
      })
    },
    [data, questions, onChange]
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Quiz has only one unit (question), so all tiers do the same
  useEntityCreateShortcut({
    onTier1: addQuestion
  })

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
