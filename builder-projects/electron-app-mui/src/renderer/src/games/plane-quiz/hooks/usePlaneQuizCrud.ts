/**
 * Hook for Plane Quiz entity CRUD operations.
 * Manages questions and answers (nested within questions) with counter-based ID generation.
 * Uses onCommit instead of onChange - commits on user actions (blur, buttons, toggles).
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { QuizAnswer, QuizAppData, QuizQuestion } from '@renderer/types'
import { toBb26 } from '@renderer/utils'
import { useCallback } from 'react'

interface UsePlaneQuizCrudReturn {
  questions: QuizQuestion[]
  addQuestion: (initialImage?: string) => void
  addQuestionFromDrop: (filePath: string) => Promise<void>
  updateQuestion: (id: string, patch: Partial<QuizQuestion>) => void
  deleteQuestion: (id: string) => void
  addAnswer: (qid: string) => void
  updateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  deleteAnswer: (qid: string, aid: string) => void
}

export function usePlaneQuizCrud(
  data: QuizAppData,
  projectDir: string,
  onCommit: (data: QuizAppData) => void
): UsePlaneQuizCrudReturn {
  const { resolved } = useSettings()
  const { questions } = data

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
      onCommit({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, resolved.prefillNames, onCommit]
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
      onCommit({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, projectDir, resolved.prefillNames, onCommit]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuizQuestion>) => {
      onCommit({ ...data, questions: questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
    },
    [data, questions, onCommit]
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      onCommit({ ...data, questions: questions.filter((q) => q.id !== id) })
    },
    [data, questions, onCommit]
  )

  const addAnswer = useCallback(
    (qid: string) => {
      onCommit({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          const ac = q._answerCounter + 1
          const newAnswer: QuizAnswer = {
            id: `${qid}-a-${ac}`,
            text: resolved.prefillNames ? `Answer ${toBb26(ac)}` : '',
            isCorrect: false
          }
          return { ...q, _answerCounter: ac, answers: [...q.answers, newAnswer] }
        })
      })
    },
    [data, questions, resolved.prefillNames, onCommit]
  )

  const updateAnswer = useCallback(
    (qid: string, aid: string, patch: Partial<QuizAnswer>) => {
      onCommit({
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
    [data, questions, onCommit]
  )

  const deleteAnswer = useCallback(
    (qid: string, aid: string) => {
      onCommit({
        ...data,
        questions: questions.map((q) =>
          q.id !== qid ? q : { ...q, answers: q.answers.filter((a) => a.id !== aid) }
        )
      })
    },
    [data, questions, onCommit]
  )

  useEntityCreateShortcut({
    onTier1: addQuestion
  })

  return {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    updateAnswer,
    deleteAnswer
  }
}
