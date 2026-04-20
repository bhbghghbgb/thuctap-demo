import { SxProps, TextField } from '@mui/material'
import React, { useCallback, useRef } from 'react'

export interface NameFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  multiline?: boolean
  sx?: SxProps
  /** When true, the TextField shows a required indicator and error state when empty */
  required?: boolean
  /** Called when the field loses focus */
  onBlur?: () => void
}

/**
 * Text field that auto-focuses and selects-all when autoFocus=true (newest card).
 * Lets users immediately type over the prefilled name.
 */
export function NameField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  multiline,
  sx,
  required = false,
  onBlur
}: NameFieldProps): React.ReactElement {
  const didSelect = useRef(false)
  const handleRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (input && autoFocus && !didSelect.current) {
        didSelect.current = true
        setTimeout(() => {
          input.focus()
          input.select()
        }, 30)
      }
    },
    [autoFocus]
  )

  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      sx={[{ flex: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}
      required={required}
      error={required && !value.trim()}
      helperText={required && !value.trim() ? 'Required' : ''}
      inputRef={handleRef}
    />
  )
}
