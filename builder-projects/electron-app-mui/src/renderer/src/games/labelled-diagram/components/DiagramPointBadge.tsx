import { Delete, MyLocation } from '@mui/icons-material'
import { Box, IconButton, InputBase, Paper, Stack, Tooltip } from '@mui/material'
import { motion, useMotionValue } from 'framer-motion'
import React, { useEffect } from 'react'
import { LabelledDiagramPoint } from '../../../types'
import { POINT_COLORS } from './PointsSidebar'

interface Props {
  point: LabelledDiagramPoint
  index: number
  isFocused?: boolean
  isNearby?: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onMove: (id: string, x: number, y: number) => void
  onFocus: (id: string) => void
  onUpdateText: (text: string) => void
  onDelete: () => void
  onFocusInSidebar: () => void
}

export default function DiagramPointBadge({ 
  point,
  index, 
  isFocused, 
  isNearby,
  containerRef, 
  onMove, 
  onFocus,
  onUpdateText,
  onDelete,
  onFocusInSidebar
}: Props) {
  if (point.isHidden) return null

  const color = POINT_COLORS[index % POINT_COLORS.length]

  const mX = useMotionValue(0)
  const mY = useMotionValue(0)

  useEffect(() => {
    mX.set(0)
    mY.set(0)
  }, [point.x, point.y, mX, mY])

  const handleDragEnd = (_event: any, info: any) => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // info.point is absolute screen coords
    const finalPxX = info.point.x - rect.left
    const finalPxY = info.point.y - rect.top
    
    const nextX = (finalPxX / rect.width) * 100
    const nextY = (finalPxY / rect.height) * 100
    
    onMove(point.id, Math.max(0, Math.min(100, nextX)), Math.max(0, Math.min(100, nextY)))
    
    mX.set(0)
    mY.set(0)
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${point.x}%`,
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFocused ? 10 : 5,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => onFocus(point.id)}
        onDragEnd={handleDragEnd}
        style={{ x: mX, y: mY }}
        whileHover={{ scale: 1.15 }}
        whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onFocus(point.id)
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.8)',
            cursor: 'grab',
            userSelect: 'none',
            zIndex: 2,
            position: 'relative'
          }}
        >
          {index + 1}
        </Box>
        
        {/* Iteration 5: Proximity / Focus UI */}
        {(isFocused || isNearby) && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 1.5s infinite',
              pointerEvents: 'none',
              '@keyframes pulse': {
                '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 1 },
                '100%': { transform: 'translate(-50%, -50%) scale(1.6)', opacity: 0 }
              }
            }}
          />
        )}

        {/* Focused controls Popover-style */}
        {isFocused && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              bottom: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              p: '4px 8px',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              whiteSpace: 'nowrap',
              zIndex: 20
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <InputBase
              autoFocus
              size="small"
              value={point.text}
              onChange={(e) => onUpdateText(e.target.value)}
              sx={{ color: '#fff', fontSize: '0.875rem', width: 120 }}
            />
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Focus in sidebar">
                <IconButton size="small" onClick={onFocusInSidebar}>
                  <MyLocation sx={{ fontSize: 16, color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={onDelete}>
                  <Delete sx={{ fontSize: 16, color: 'error.main' }} />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Arrow */}
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(30,30,30,0.95)'
              }}
            />
          </Paper>
        )}
      </motion.div>
    </Box>
  )
}
