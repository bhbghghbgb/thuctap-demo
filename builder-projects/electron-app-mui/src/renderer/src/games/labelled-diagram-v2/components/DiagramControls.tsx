import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import { Box, IconButton, Tooltip } from '@mui/material'
import React from 'react'

interface DiagramControlsProps {
  zoomIn: () => void
  zoomOut: () => void
  resetTransform: () => void
}

/**
 * Overlay controls for zooming and resetting the viewport transform.
 */
export const DiagramControls: React.FC<DiagramControlsProps> = ({
  zoomIn,
  zoomOut,
  resetTransform
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        p: 0.5,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Tooltip title="Zoom In" placement="left">
        <IconButton size="small" onClick={() => zoomIn()}>
          <ZoomInIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom Out" placement="left">
        <IconButton size="small" onClick={() => zoomOut()}>
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset View" placement="left">
        <IconButton size="small" onClick={() => resetTransform()}>
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
