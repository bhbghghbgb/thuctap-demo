import { useFieldContext } from '@renderer/utils/formStore'
import { NameField, NameFieldProps } from './NameField'
import ImagePicker from '../ImagePicker'
import { FormControlLabel, Switch } from '@mui/material'
import React from 'react'

/**
 * A version of NameField that automatically binds to TanStack Form context.
 * Useful for reducing boilerplate in editors.
 */
export function FormNameField(
  props: Omit<NameFieldProps, 'value' | 'onChange'>
): React.ReactElement {
  const field = useFieldContext<string>()

  return (
    <NameField
      {...props}
      value={field.state.value}
      onChange={(v) => field.handleChange(v)}
      // Standard TanStack Form error integration
      required={props.required}
      error={field.state.meta.errors.length > 0}
      helperText={field.state.meta.errors.join(', ')}
      onBlur={field.handleBlur}
    />
  )
}

interface FormImagePickerProps {
  projectDir: string
  desiredNamePrefix: string
  label?: string
  size?: number
  required?: boolean
}

/**
 * A version of ImagePicker that automatically binds to TanStack Form context.
 */
export function FormImagePicker(props: FormImagePickerProps): React.ReactElement {
  const field = useFieldContext<string | null>()

  return (
    <ImagePicker {...props} value={field.state.value} onChange={(v) => field.handleChange(v)} />
  )
}

interface FormSwitchProps {
  label?: React.ReactNode
}

/**
 * A version of MUI Switch that automatically binds to TanStack Form context.
 */
export function FormSwitch({ label }: FormSwitchProps): React.ReactElement {
  const field = useFieldContext<boolean>()

  return (
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={field.state.value}
          onChange={(_, v) => field.handleChange(v)}
          onBlur={field.handleBlur}
        />
      }
      label={label}
      sx={{ m: 0 }}
    />
  )
}
