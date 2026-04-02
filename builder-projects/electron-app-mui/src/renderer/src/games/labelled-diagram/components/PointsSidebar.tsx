import { Add, Delete, GpsFixed, MyLocation, Visibility, VisibilityOff } from '@mui/icons-material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useState } from 'react'
import ImagePicker from '../../../components/ImagePicker'
import { LabelledDiagramPoint } from '../../../types'

interface Props {
  points: LabelledDiagramPoint[]
  projectDir: string
  imagePath: string | null
  onAddPoint: () => void
  onUpdatePoint: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDeletePoint: (id: string) => void
  onFocusPoint: (point: LabelledDiagramPoint) => void
  onImageChange: (path: string | null) => void
  focusedPointId?: string
  viewablePointIds: string[]
  imgSize: { width: number; height: number }
}

export const POINT_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316'  // orange
]

export default function PointsSidebar({
  points,
  projectDir,
  imagePath,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onFocusPoint,
  onImageChange,
  focusedPointId,
  viewablePointIds,
  imgSize
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [absPosAnchor, setAbsPosAnchor] = useState<{ el: HTMLButtonElement; point: LabelledDiagramPoint } | null>(null)

  const handleOpenAbsPos = (e: React.MouseEvent<HTMLButtonElement>, p: LabelledDiagramPoint) => {
    setAbsPosAnchor({ el: e.currentTarget, point: p })
  }

  if (isCollapsed) {
    return (
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          left: 16,
          top: 16,
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          background: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          '&:hover': { background: 'rgba(50, 50, 50, 0.9)' }
        }}
        onClick={() => setIsCollapsed(false)}
      >
        <Tooltip title="Open Points Panel">
          <ChevronRightIcon />
        </Tooltip>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        left: 16,
        top: 16,
        bottom: 16,
        width: 320,
        zIndex: 10,
        background: 'rgba(20, 20, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          DIAGRAM POINTS
        </Typography>
        <IconButton size="small" onClick={() => setIsCollapsed(true)}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        <Stack spacing={1}>
          {points.map((p, index) => {
            const color = POINT_COLORS[index % POINT_COLORS.length]
            const isFocused = p.id === focusedPointId
            const isViewable = viewablePointIds.includes(p.id)

            return (
              <Box
                key={p.id}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  background: isFocused 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : isViewable 
                      ? 'rgba(255, 255, 255, 0.06)' 
                      : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: isFocused ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  animation: isFocused ? 'flash 2s infinite' : 'none',
                  '@keyframes flash': {
                    '0%': { background: 'rgba(255, 255, 255, 0.1)' },
                    '50%': { background: 'rgba(255, 255, 255, 0.2)' },
                    '100%': { background: 'rgba(255, 255, 255, 0.1)' }
                  },
                  '&:hover': { background: 'rgba(255, 255, 255, 0.08)' }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Badge */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Input */}
                  <InputBase
                    size="small"
                    value={p.text}
                    onChange={(e) => onUpdatePoint(p.id, { text: e.target.value })}
                    placeholder="Point label..."
                    sx={{
                      flex: 1,
                      fontSize: '0.875rem',
                      color: p.isHidden ? 'text.disabled' : 'text.primary',
                      textDecoration: p.isHidden ? 'line-through' : 'none'
                    }}
                  />

                  {/* Actions */}
                  <Stack direction="row">
                    <Tooltip title={p.isHidden ? 'Show on image' : 'Hide on image'}>
                      <IconButton size="small" onClick={() => onUpdatePoint(p.id, { isHidden: !p.isHidden })}>
                        {p.isHidden ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Absolute Positioning">
                      <IconButton size="small" onClick={(e) => handleOpenAbsPos(e, p)}>
                        <GpsFixed sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Follow on image">
                      <IconButton size="small" onClick={() => onFocusPoint(p)}>
                        <MyLocation sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => onDeletePoint(p.id)}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            )
          })}
          
          {points.length === 0 && (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
              No points added yet.
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Popover for Absolute Position */}
      <Popover
        open={Boolean(absPosAnchor)}
        anchorEl={absPosAnchor?.el}
        onClose={() => setAbsPosAnchor(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        PaperProps={{
          sx: {
            ml: 1,
            p: 2,
            width: 240,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2
          }
        }}
      >
        {absPosAnchor && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Absolute Positioning</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1
              }}
            >
              <TextField
                label="X (%)"
                size="small"
                type="number"
                value={absPosAnchor.point.x.toFixed(2)}
                onChange={(e) => onUpdatePoint(absPosAnchor.point.id, { x: parseFloat(e.target.value) || 0 })}
              />
              <TextField
                label="Y (%)"
                size="small"
                type="number"
                value={absPosAnchor.point.y.toFixed(2)}
                onChange={(e) => onUpdatePoint(absPosAnchor.point.id, { y: parseFloat(e.target.value) || 0 })}
              />
              <TextField
                label="X (px)"
                size="small"
                type="number"
                disabled={!imgSize.width}
                value={Math.round((absPosAnchor.point.x / 100) * imgSize.width)}
                onChange={(e) => onUpdatePoint(absPosAnchor.point.id, { x: (parseFloat(e.target.value) / imgSize.width) * 100 || 0 })}
              />
              <TextField
                label="Y (px)"
                size="small"
                type="number"
                disabled={!imgSize.height}
                value={Math.round((absPosAnchor.point.y / 100) * imgSize.height)}
                onChange={(e) => onUpdatePoint(absPosAnchor.point.id, { y: (parseFloat(e.target.value) / imgSize.height) * 100 || 0 })}
              />
            </Box>
          </Stack>
        )}
      </Popover>

      {/* Footer / Image Controls */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={onAddPoint}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Add New Point
        </Button>

        <Box sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="caption" sx={{ color: 'warning.light', display: 'block', mb: 1, lineHeight: 1.4 }}>
            Tip: Point positions are relative (%). Changing the image will apply them to the new dimensions.
          </Typography>
          <ImagePicker
            projectDir={projectDir}
            desiredNamePrefix="diag-img"
            value={imagePath}
            onChange={onImageChange}
            label="Change Diagram"
            size={80}
            sx={{ width: '100%', height: 60, borderRadius: 1 }}
          />
        </Box>
      </Box>
    </Paper>
  )
}
