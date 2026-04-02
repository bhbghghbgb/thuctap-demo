import { useCallback, useState } from 'react'

export interface UseSnackbarReturn {
  message: string | null
  severity: 'success' | 'error' | 'info'
  showSnack: (msg: string, severity?: 'success' | 'error' | 'info') => void
  hideSnack: () => void
}

const SNACKBAR_AUTO_HIDE_MS = 3500

/**
 * Hook for managing snackbar state.
 * Provides a simple API to show/hide snackbars with different severities.
 */
export function useSnackbar(defaultAutoHideMs: number = SNACKBAR_AUTO_HIDE_MS): UseSnackbarReturn {
  const [snack, setSnack] = useState<{
    msg: string
    severity: 'success' | 'error' | 'info'
  } | null>(null)

  const showSnack = useCallback(
    (msg: string, severity: 'success' | 'error' | 'info' = 'success'): void => {
      setSnack({ msg, severity })
    },
    []
  )

  const hideSnack = useCallback((): void => {
    setSnack(null)
  }, [])

  return {
    message: snack?.msg ?? null,
    severity: snack?.severity ?? 'success',
    showSnack,
    hideSnack,
    autoHideMs: defaultAutoHideMs
  } as UseSnackbarReturn & { autoHideMs: number }
}
