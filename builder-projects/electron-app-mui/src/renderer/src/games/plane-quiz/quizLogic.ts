import { QuizAnswer, QuizAppData, QuizQuestion } from '@renderer/types'
import { toBb26 } from '@renderer/utils'

/**
 * Pure logic for Quiz transactions.
 * Extracted from hooks to be compatible with both standard state and form state.
 */

export const createQuestion = (
  data: QuizAppData,
  prefillNames: boolean,
  initialImage: string | null = null
): { newData: QuizAppData; newQuestionId: string } => {
  const qc = data._questionCounter + 1
  const qid = `q-${qc}`
  const q: QuizQuestion = {
    id: qid,
    question: prefillNames ? `Question ${qc}` : '',
    imagePath: initialImage,
    multipleCorrect: false,
    _answerCounter: 2,
    answers: [
      { id: `${qid}-a-1`, text: prefillNames ? 'Answer A' : '', isCorrect: true },
      { id: `${qid}-a-2`, text: prefillNames ? 'Answer B' : '', isCorrect: false }
    ]
  }

  return {
    newData: { ...data, _questionCounter: qc, questions: [...data.questions, q] },
    newQuestionId: qid
  }
}

export const deleteQuestion = (data: QuizAppData, id: string): QuizAppData => {
  return {
    ...data,
    questions: data.questions.filter((q) => q.id !== id)
  }
}

export const updateQuestion = (
  data: QuizAppData,
  id: string,
  patch: Partial<QuizQuestion>
): QuizAppData => {
  return {
    ...data,
    questions: data.questions.map((q) => (q.id === id ? { ...q, ...patch } : q))
  }
}

export const createAnswer = (
  data: QuizAppData,
  qid: string,
  prefillNames: boolean
): QuizAppData => {
  return {
    ...data,
    questions: data.questions.map((q) => {
      if (q.id !== qid) return q
      const ac = q._answerCounter + 1
      const newAnswer: QuizAnswer = {
        id: `${qid}-a-${ac}`,
        text: prefillNames ? `Answer ${toBb26(ac)}` : '',
        isCorrect: false
      }
      return { ...q, _answerCounter: ac, answers: [...q.answers, newAnswer] }
    })
  }
}

export const updateAnswer = (
  data: QuizAppData,
  qid: string,
  aid: string,
  patch: Partial<QuizAnswer>
): QuizAppData => {
  return {
    ...data,
    questions: data.questions.map((q) => {
      if (q.id !== qid) return q
      let answers = q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a))
      // Handle radio-button behavior if not multiple correct
      if (patch.isCorrect && !q.multipleCorrect) {
        answers = answers.map((a) => (a.id === aid ? a : { ...a, isCorrect: false }))
      }
      return { ...q, answers }
    })
  }
}

export const deleteAnswer = (data: QuizAppData, qid: string, aid: string): QuizAppData => {
  return {
    ...data,
    questions: data.questions.map((q) =>
      q.id !== qid ? q : { ...q, answers: q.answers.filter((a) => a.id !== aid) }
    )
  }
}
