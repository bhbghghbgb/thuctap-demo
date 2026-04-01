import { Box } from '@mui/material'
import React from 'react'

export default function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f1117'
      }}
    >
      {/* macOS hiddenInset drag region */}
      <Box
        sx={{ height: '28px', flexShrink: 0, WebkitAppRegion: 'drag', background: 'transparent' }}
      />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  )
}
