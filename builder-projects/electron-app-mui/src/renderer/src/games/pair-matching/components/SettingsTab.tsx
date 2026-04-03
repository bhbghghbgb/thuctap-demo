import { Box, Divider, Paper, TextField, Typography } from '@mui/material'
import React from 'react'
import { StickyHeader } from '../../../components'
import ImagePicker from '../../../components/ImagePicker'
import { PairMatchingAppData } from '../../../types'

export interface SettingsTabProps {
  data: PairMatchingAppData
  projectDir: string
  onCommit: (data: PairMatchingAppData) => void
}

/**
 * Settings tab component for PairMatchingEditor.
 * Handles global game configuration.
 */
export function SettingsTab({ data, projectDir, onCommit }: SettingsTabProps): React.ReactElement {
  return (
    <Box>
      <StickyHeader
        title="Settings"
        description="Global configurations for the pair-matching game."
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        {/* Game Rules */}
        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Game Rules
          </Typography>
          <TextField
            label="Minimum Total Pairs"
            type="number"
            size="small"
            value={data.minTotalPairs ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              onCommit({ ...data, minTotalPairs: val })
            }}
            fullWidth
            placeholder="No minimum (empty)"
            helperText="Globally ensure this many pairs appear in the game. Leave empty for default."
          />
        </Paper>

        {/* Card Appearance */}
        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Card Appearance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Card Back Color"
                size="small"
                value={data.cardBackColor ?? ''}
                onBlur={(e) => onCommit({ ...data, cardBackColor: e.target.value })}
                fullWidth
                placeholder="e.g. #FF0000 or red"
                helperText="Color used for the back of cards if no image is provided."
                sx={{ mb: 2 }}
              />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Card Back Image
              </Typography>
              <ImagePicker
                projectDir={projectDir}
                desiredNamePrefix="global-card-back"
                value={data.cardBackImage ?? null}
                onChange={(p) => onCommit({ ...data, cardBackImage: p })}
                label="Select Background"
                size={100}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
