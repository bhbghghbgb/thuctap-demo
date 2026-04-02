import { Box } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import React, { useCallback } from 'react'
import { WhackAMoleAppData, WhackAMoleQuestion } from '../../types'
import { QuestionsTab, SummarySidebar } from './components'

interface Props {
  appData: WhackAMoleAppData
  projectDir: string
  onChange: (data: WhackAMoleAppData) => void
}

function normalize(d: WhackAMoleAppData): WhackAMoleAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: d.questions ?? []
  }
}

export default function WhackAMoleEditor({
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
      const q: WhackAMoleQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        questionImage: initialImage ?? null,
        answerText: resolved.prefillNames ? `Answer ${qc}` : '',
        answerImage: null
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const questionImage = await window.electronAPI.importImage(filePath, projectDir, qid)
      const q: WhackAMoleQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        questionImage,
        answerText: resolved.prefillNames ? `Answer ${qc}` : '',
        answerImage: null
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, projectDir, resolved.prefillNames, onChange]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<WhackAMoleQuestion>) => {
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addQuestion
  })

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar questions={questions} />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <QuestionsTab
          questions={questions}
          projectDir={projectDir}
          onAddQuestion={addQuestion}
          onAddQuestionFromDrop={addQuestionFromDrop}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
        />
      </Box>
    </Box>
  )
}
