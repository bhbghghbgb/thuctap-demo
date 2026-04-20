/**
 * Hook for Plane Quiz entity CRUD operations.
 * Manages questions and answers (nested within questions) with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { QuizAnswer, QuizAppData, QuizQuestion } from '@renderer/types'
import { toBb26 } from '@renderer/utils'
import { FormApi } from '@tanstack/react-form'
import { useCallback } from 'react'
import { insert, remove, replace } from 'travels'

interface UsePlaneQuizCrudReturn {
  questions: QuizQuestion[]
  addQuestion: (initialImage?: string) => void
  addQuestionFromDrop: (filePath: string) => Promise<void>
  updateQuestion: (id: string, patch: Partial<QuizQuestion>, shouldCommit?: boolean) => void
  deleteQuestion: (id: string) => void
  addAnswer: (qid: string) => void
  updateAnswer: (
    qid: string,
    aid: string,
    patch: Partial<QuizAnswer>,
    shouldCommit?: boolean
  ) => void
  deleteAnswer: (qid: string, aid: string) => void
}

/**
 * Provides CRUD operations for plane quiz questions and answers.
 *
 * @param form - Tanstack Form instance
 * @param projectDir - Project directory path for image imports
 * @param onCommit - History commit callback
 */
export function usePlaneQuizCrud(
  form: FormApi<QuizAppData, any>,
  projectDir: string,
  onCommit: (data: QuizAppData) => void
): UsePlaneQuizCrudReturn {
  const { resolved } = useSettings()
  const questions = form.state.values.questions

  // ── Question CRUD ─────────────────────────────────────────────────────────
  const addQuestion = useCallback(
    (initialImage?: string) => {
      const qc = form.state.values._questionCounter + 1
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
      form.setFieldValue('_questionCounter', qc)
      form.setFieldValue('questions', insert(questions, questions.length, q))
      onCommit(form.state.values)
    },
    [form, questions, resolved.prefillNames, onCommit]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = form.state.values._questionCounter + 1
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
      form.setFieldValue('_questionCounter', qc)
      form.setFieldValue('questions', insert(questions, questions.length, q))
      onCommit(form.state.values)
    },
    [form, questions, projectDir, resolved.prefillNames, onCommit]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuizQuestion>, shouldCommit = true) => {
      const idx = questions.findIndex((q) => q.id === id)
      if (idx === -1) return
      const next = replace(questions, idx, { ...questions[idx], ...patch })
      form.setFieldValue('questions', next)
      if (shouldCommit) onCommit(form.state.values)
    },
    [form, questions, onCommit]
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      const idx = questions.findIndex((q) => q.id === id)
      if (idx === -1) return
      form.setFieldValue('questions', remove(questions, idx))
      onCommit(form.state.values)
    },
    [form, questions, onCommit]
  )

  // ── Answer CRUD (nested within questions) ─────────────────────────────────
  const addAnswer = useCallback(
    (qid: string) => {
      const qidx = questions.findIndex((q) => q.id === qid)
      if (qidx === -1) return
      const q = questions[qidx]
      const ac = q._answerCounter + 1
      const newAnswer: QuizAnswer = {
        id: `${qid}-a-${ac}`,
        text: resolved.prefillNames ? `Answer ${toBb26(ac)}` : '',
        isCorrect: false
      }
      form.setFieldValue(
        'questions',
        replace(questions, qidx, {
          ...q,
          _answerCounter: ac,
          answers: insert(q.answers, q.answers.length, newAnswer)
        })
      )
      onCommit(form.state.values)
    },
    [form, questions, resolved.prefillNames, onCommit]
  )

  const updateAnswer = useCallback(
    (qid: string, aid: string, patch: Partial<QuizAnswer>, shouldCommit = true) => {
      const qidx = questions.findIndex((q) => q.id === qid)
      if (qidx === -1) return
      const q = questions[qidx]
      const aidx = q.answers.findIndex((a) => a.id === aid)
      if (aidx === -1) return

      let nextAnswers = replace(q.answers, aidx, { ...q.answers[aidx], ...patch })
      if (patch.isCorrect && !q.multipleCorrect) {
        nextAnswers = nextAnswers.map((a) => (a.id === aid ? a : { ...a, isCorrect: false }))
      }

      form.setFieldValue('questions', replace(questions, qidx, { ...q, answers: nextAnswers }))
      if (shouldCommit) onCommit(form.state.values)
    },
    [form, questions, onCommit]
  )

  const deleteAnswer = useCallback(
    (qid: string, aid: string) => {
      const qidx = questions.findIndex((q) => q.id === qid)
      if (qidx === -1) return
      const q = questions[qidx]
      const aidx = q.answers.findIndex((a) => a.id === aid)
      if (aidx === -1) return

      form.setFieldValue(
        'questions',
        replace(questions, qidx, { ...q, answers: remove(q.answers, aidx) })
      )
      onCommit(form.state.values)
    },
    [form, questions, onCommit]
  )

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  // Quiz has only one unit (question), so all tiers do the same
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
