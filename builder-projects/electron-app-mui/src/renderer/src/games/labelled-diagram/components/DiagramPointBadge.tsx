import { Box, IconButton, InputBase, Paper, Stack, Tooltip } from '@mui/material'
import { motion, useMotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Delete, MyLocation } from '@mui/icons-material'
import { LabelledDiagramPoint } from '../../../types'
import { POINT_COLORS } from './PointsSidebar'

interface Props {
  point: LabelledDiagramPoint
  index: number
  isFocused?: boolean
  isNearby?: boolean
  imgSize: { width: number; height: number }
  transform: { x: number; y: number; scale: number }
  onMove: (id: string, x: number, y: number) => void
  onFocus: (id: string) => void
  onUpdateText: (text: string) => void
  onDelete: () => void
  onFocusInSidebar: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

export default function DiagramPointBadge({ 
  point,
  index, 
  isFocused, 
  isNearby,
  imgSize,
  transform,
  onMove, 
  onFocus,
  onUpdateText,
  onDelete,
  onFocusInSidebar,
  onDragStart,
  onDragEnd
}: Props) {
  const [popoverPos, setPopoverPos] = useState<'top' | 'bottom'>('top')
  const [popoverAlign, setPopoverAlign] = useState<'center' | 'left' | 'right'>('center')
  const badgeRef = useRef<HTMLDivElement>(null)

  const color = POINT_COLORS[index % POINT_COLORS.length]

  // Calculate pixel position relative to editor container
  const posX = (point.x / 100) * imgSize.width * transform.scale + transform.x
  const posY = (point.y / 100) * imgSize.height * transform.scale + transform.y

  const mX = useMotionValue(0)
  const mY = useMotionValue(0)

  useEffect(() => {
    mX.set(0)
    mY.set(0)
  }, [point.x, point.y, transform.x, transform.y, transform.scale, mX, mY])

  // Flip logic
  useEffect(() => {
    if (isFocused && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect()
      const parent = badgeRef.current.closest('.labelled-diagram-editor')
      if (!parent) return
      
      const pRect = parent.getBoundingClientRect()
      
      // Vertical flip
      if (rect.top - 120 < pRect.top) { // Offset for Popover + Buffer
        setPopoverPos('bottom')
      } else {
        setPopoverPos('top')
      }

      // Horizontal align
      if (rect.left - 100 < pRect.left) {
        setPopoverAlign('left')
      } else if (rect.right + 100 > pRect.right) {
        setPopoverAlign('right')
      } else {
        setPopoverAlign('center')
      }
    }
  }, [isFocused, posX, posY])

  const handleDragEnd = (_event: any, info: any) => {
    const parent = badgeRef.current?.closest('.labelled-diagram-editor')
    if (!parent) return
    
    // Find the relative container that holds the image
    const rect = parent.querySelector('.MuiBox-root img')?.getBoundingClientRect()
    if (!rect) return
    
    // Calculate new % based on dropped position
    const dropX = info.point.x - rect.left
    const dropY = info.point.y - rect.top
    
    const nextX = (dropX / rect.width) * 100
    const nextY = (dropY / rect.height) * 100
    
    onMove(point.id, Math.max(0, Math.min(100, nextX)), Math.max(0, Math.min(100, nextY)))
    onDragEnd()
    mX.set(0)
    mY.set(0)
  }

  const TargetLock = useMemo(() => (
    <Box
      sx={{
        position: 'absolute',
        inset: -16,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'rotateLock 12s linear infinite',
        '@keyframes rotateLock': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        }
      }}
    >
      {[0, 90, 180, 270].map((deg) => (
        <Box
          key={deg}
          sx={{
            position: 'absolute',
            width: 10,
            height: 10,
            borderRight: `3px solid ${color}`,
            borderBottom: `3px solid ${color}`,
            borderRadius: '0 0 2px 0',
            transform: `rotate(${deg}deg) translate(-14px, -14px)`,
            animation: 'lockPulse 2.5s ease-in-out infinite',
            '@keyframes lockPulse': {
              '0%, 100%': { opacity: 0.6, transform: `rotate(${deg}deg) translate(-14px, -14px)` },
              '50%': { opacity: 1, transform: `rotate(${deg}deg) translate(-18px, -18px)` }
            }
          }}
        />
      ))}
    </Box>
  ), [color])

  if (point.isHidden) return null

  return (
    <Box
      ref={badgeRef}
      sx={{
        position: 'absolute',
        left: posX,
        top: posY,
        transform: 'translate(-50%, -50%)', // Center alignment fix
        zIndex: isFocused ? 10 : 5,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        drag={isFocused}
        dragMomentum={false}
        onDragStart={() => {
          onFocus(point.id)
          onDragStart()
        }}
        onDragEnd={handleDragEnd}
        style={{ x: mX, y: mY, position: 'relative' }}
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
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: isFocused ? `0 0 20px ${color}80, 0 4px 12px rgba(0,0,0,0.4)` : '0 4px 8px rgba(0,0,0,0.3)',
            border: '2.5px solid rgba(255,255,255,1)',
            cursor: isFocused ? 'grab' : 'pointer',
            userSelect: 'none',
            zIndex: 2,
            position: 'relative',
            transform: isFocused ? 'scale(1.15)' : 'none',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
        >
          {index + 1}
        </Box>
        
        {/* Focused State: Target Lock */}
        {isFocused && TargetLock}

        {/* Nearby State: Soft Pulse */}
        {isNearby && !isFocused && (
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
                '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.8 },
                '100%': { transform: 'translate(-50%, -50%) scale(1.6)', opacity: 0 }
              }
            }}
          />
        )}

        {/* Focused controls Popover-style */}
        {isFocused && (
          <Paper
            elevation={12}
            sx={{
              position: 'absolute',
              ...(popoverPos === 'top' ? { bottom: 'calc(100% + 18px)' } : { top: 'calc(100% + 18px)' }),
              ...(popoverAlign === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : 
                  popoverAlign === 'left' ? { left: 0 } : { right: 0 }),
              p: '6px 10px',
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'rgba(25, 25, 25, 0.98)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              whiteSpace: 'nowrap',
              zIndex: 20,
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
            }}
            onPointerDown={(e) => {
               e.stopPropagation()
               e.nativeEvent.stopImmediatePropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <InputBase
              autoFocus
              size="small"
              value={point.text}
              onChange={(e) => onUpdateText(e.target.value)}
              sx={{ color: '#fff', fontSize: '0.9rem', width: 140, fontWeight: 500 }}
              placeholder="Label name..."
            />
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Follow on image">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onFocusInSidebar(); }}>
                  <MyLocation sx={{ fontSize: 18, color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Delete sx={{ fontSize: 18, color: 'error.main' }} />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Arrow */}
            <Box
              sx={{
                position: 'absolute',
                ...(popoverPos === 'top' ? { top: '100%', borderTop: '8px solid rgba(25,25,25,0.98)' } : { bottom: '100%', borderBottom: '8px solid rgba(25,25,25,0.98)' }),
                ...(popoverAlign === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : 
                    popoverAlign === 'left' ? { left: 16 } : { right: 16 }),
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent'
              }}
            />
          </Paper>
        )}
      </motion.div>
    </Box>
  )
}
