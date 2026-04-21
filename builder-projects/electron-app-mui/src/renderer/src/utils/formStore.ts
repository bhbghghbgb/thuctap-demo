import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

// This setup enables "Form Composition" (see https://tanstack.com/form/latest/docs/framework/react/guides/form-composition)
// It allows us to create shared field components that are automatically bound to the nearest form context.

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {}
})
