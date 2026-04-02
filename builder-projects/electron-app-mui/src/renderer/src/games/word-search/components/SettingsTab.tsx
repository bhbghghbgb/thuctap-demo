import { Box, Paper, Typography } from '@mui/material'
import React from 'react'
import { StickyHeader } from '../../../components'
import ImagePicker from '../../../components/ImagePicker'
import { WordSearchAppData } from '../../../types'

export interface SettingsTabProps {
  data: WordSearchAppData
  projectDir: string
  onChange: (data: WordSearchAppData) => void
}

/**
 * Settings tab component for WordSearchEditor.
 * Handles global game configuration.
 */
export function SettingsTab({ data, projectDir, onChange }: SettingsTabProps): React.ReactElement {
  return (
    <Box>
      <StickyHeader
        title="Settings"
        description="Global configurations for the word search game."
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Background Appearance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Game Background Image
              </Typography>
              <ImagePicker
                projectDir={projectDir}
                desiredNamePrefix="global-background"
                value={data.backgroundImagePath ?? null}
                onChange={(p) => onChange({ ...data, backgroundImagePath: p })}
                label="Select Background"
                size={160}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
