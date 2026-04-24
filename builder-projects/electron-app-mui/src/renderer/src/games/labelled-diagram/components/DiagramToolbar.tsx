import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Divider, IconButton, Typography } from '@mui/material'
import { LabelledDiagramAppData } from '@shared/types'
import React from 'react'

interface DiagramToolbarProps {
  appData: LabelledDiagramAppData
  pointsCount: number
  onChange: (data: LabelledDiagramAppData) => void
}

/**
 * Overlay toolbar with point stats and diagram management actions.
 */
export const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  appData,
  pointsCount,
  onChange
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 24,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        px: 2,
        py: 1,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 30
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {pointsCount} Points Added
      </Typography>
      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Typography variant="caption" color="text.secondary">
        Double click to add points. Click to select. Drag selected point to move.
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange({ ...appData, imagePath: null })}
        color="inherit"
        sx={{ ml: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
      >
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
