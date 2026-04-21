/**
 * Shared form options for the plane-quiz editor.
 *
 * Exported so both QuizEditor and withForm sub-components can spread
 * these for correct type inference, per the formOptions() pattern.
 *
 * Note: defaultValues here are ONLY used for type-checking by withForm HOC.
 * Runtime default values are always provided via the `initialData` prop at the top level.
 */
import { formOptions } from '@tanstack/react-form'
import type { QuizAppData, QuizQuestion } from '@shared/types'

export const quizFormOptions = formOptions({
  defaultValues: {
    questions: [] as QuizQuestion[],
    _questionCounter: 0
  } as QuizAppData
})
