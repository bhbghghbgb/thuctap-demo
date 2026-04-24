import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material'
import { LabelledDiagramPoint } from '@shared/types'
import React from 'react'
import { getBadgeColor } from '../styles'

interface SidebarPointItemProps {
  point: LabelledDiagramPoint
  index: number
  isSelected: boolean
  onSelect: (point: LabelledDiagramPoint) => void
  onUpdateText: (id: string, text: string) => void
  onDelete: (id: string) => void
}

/**
 * Individual point entry in the sidebar list.
 * Allows editing label and deleting the point.
 */
export const SidebarPointItem: React.FC<SidebarPointItemProps> = ({
  point,
  index,
  isSelected,
  onSelect,
  onUpdateText,
  onDelete
}) => {
  return (
    <Paper
      elevation={0}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).tagName !== 'INPUT' &&
          !(e.target as HTMLElement).closest('button')
        ) {
          onSelect(point)
        }
      }}
      sx={{
        p: 1.5,
        backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.05)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: getBadgeColor(index),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          {index + 1}
        </Box>
        <TextField
          size="small"
          variant="standard"
          value={point.text}
          onChange={(e) => onUpdateText(point.id, e.target.value)}
          fullWidth
          placeholder="Enter point label..."
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { fontSize: '0.875rem' }
            }
          }}
        />
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(point.id)}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
        >
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Typography variant="caption" color="text.disabled">
          X: {point.xPercent.toFixed(1)}%
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Y: {point.yPercent.toFixed(1)}%
        </Typography>
      </Box>
    </Paper>
  )
}
