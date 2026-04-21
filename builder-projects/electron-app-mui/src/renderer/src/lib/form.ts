/**
 * App-wide TanStack Form hook infrastructure.
 *
 * All editors that use TanStack Form should import from here.
 *
 * Architecture (following the composition decision tree):
 * - We share defaultValues (formOptions) → editors use formOptions() for initial data
 * - We have custom UI components (NameField, etc) → createFormHook with fieldComponents
 * - Sub-sections of forms (QuestionCard, AnswerRow) are passed `form` via withForm HOC
 *
 * Usage:
 *   import { useAppForm, withForm } from '@renderer/lib/form'
 */
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {}
})
