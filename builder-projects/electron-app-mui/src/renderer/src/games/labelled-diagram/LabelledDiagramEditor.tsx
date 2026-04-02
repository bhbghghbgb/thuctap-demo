import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, SpeedDial, SpeedDialAction, SpeedDialIcon, Typography } from '@mui/material'
import { Add, DeleteForever, PhotoSizeSelectActual, Reorder } from '@mui/icons-material'
import { useCallback, useRef, useState } from 'react'
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import ImagePicker from '../../components/ImagePicker'
import { useAssetUrl } from '../../hooks/useAssetUrl'
import { LabelledDiagramAppData, LabelledDiagramPoint } from '../../types'
import { DiagramPointBadge, POINT_COLORS, PointsSidebar } from './components'

interface Props {
  appData: LabelledDiagramAppData
  projectDir: string
  onChange: (data: LabelledDiagramAppData) => void
}

function normalize(d: LabelledDiagramAppData): LabelledDiagramAppData {
  return {
    ...d,
    _pointCounter: d._pointCounter ?? 0,
    points: d.points ?? []
  }
}

export default function LabelledDiagramEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const { imagePath, points } = data
  const { data: imageUrl } = useAssetUrl(projectDir, imagePath)
  
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [focusedPointId, setFocusedPointId] = useState<string | undefined>(undefined)
  const [nearbyPointId, setNearbyPointId] = useState<string | undefined>(undefined)
  const [collisionPoints, setCollisionPoints] = useState<LabelledDiagramPoint[]>([])
  const [showCollisionOverlay, setShowCollisionOverlay] = useState(false)
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 })
  const [viewablePointIds, setViewablePointIds] = useState<string[]>([])
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDraggingPoint, setIsDraggingPoint] = useState(false)
  
  // Dialog States
  const [imageAction, setImageAction] = useState<{ type: 'change' | 'delete', path?: string | null } | null>(null)
  const [showReorderToast, setShowReorderToast] = useState(false)

  // ── HUD/UX Logic ──────────────────────────────────────────────────────────
  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    setTransform({
      x: ref.instance.transformState.positionX,
      y: ref.instance.transformState.positionY,
      scale: ref.instance.transformState.scale
    })
    updateViewablePoints()
  }, [points])

  const updateViewablePoints = useCallback(() => {
    if (!contentRef.current) return
    const container = contentRef.current
    const rect = container.getBoundingClientRect()
    
    // The viewport is the parent of the TransformComponent's wrapper
    const viewport = container.closest('.labelled-diagram-editor-canvas')
    if (!viewport) return
    const vRect = viewport.getBoundingClientRect()

    const viewable = points
      .filter((p) => {
        if (p.isHidden) return false
        // Calculate screen position of point
        const pxX = rect.left + (p.x / 100) * rect.width
        const pxY = rect.top + (p.y / 100) * rect.height
        
        return (
          pxX >= vRect.left && 
          pxX <= vRect.right && 
          pxY >= vRect.top && 
          pxY <= vRect.bottom
        )
      })
      .map((p) => p.id)

    setViewablePointIds(viewable)
  }, [points])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (showCollisionOverlay || isDraggingPoint) return

    const rect = contentRef.current?.getBoundingClientRect()
    if (!rect) return

    const threshold = 40 // pixels distance from cursor
    
    // Calculate distance to all points
    const pointsWithDist = points.filter(p => !p.isHidden).map(p => {
      const pxX = rect.left + (p.x / 100) * rect.width
      const pxY = rect.top + (p.y / 100) * rect.height
      const dist = Math.sqrt((e.clientX - pxX) ** 2 + (e.clientY - pxY) ** 2)
      return { ...p, _dist: dist }
    })

    const nearby = pointsWithDist.filter(p => p._dist < threshold)
    
    if (nearby.length > 0) {
      // Find closest
      nearby.sort((a, b) => a._dist - b._dist)
      setNearbyPointId(nearby[0].id)
      setCollisionPoints(nearby.map(({ _dist, ...p }) => p))
    } else {
      setNearbyPointId(undefined)
      setCollisionPoints([])
    }
  }, [points, showCollisionOverlay, isDraggingPoint])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If we have collisions, show the overlay
    if (collisionPoints.length > 1) {
      setShowCollisionOverlay(true)
      setOverlayPos({ x: e.clientX, y: e.clientY })
    } else if (nearbyPointId) {
      setFocusedPointId(nearbyPointId)
    } else {
      setFocusedPointId(undefined)
      setShowCollisionOverlay(false)
    }
  }, [collisionPoints, nearbyPointId])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addPoint = useCallback(() => {
    const nextCount = data._pointCounter + 1
    const newPoint: LabelledDiagramPoint = {
      id: `pt-${nextCount}`,
      text: `Point ${nextCount}`,
      x: 50,
      y: 50,
      isHidden: false
    }
    onChange({
      ...data,
      _pointCounter: nextCount,
      points: [...points, newPoint]
    })
    setFocusedPointId(newPoint.id)
  }, [data, points, onChange])

  const updatePoint = useCallback((id: string, patch: Partial<LabelledDiagramPoint>) => {
    onChange({
      ...data,
      points: points.map(p => p.id === id ? { ...p, ...patch } : p)
    })
  }, [data, points, onChange])

  const deletePoint = useCallback((id: string) => {
    onChange({
      ...data,
      points: points.filter(p => p.id !== id)
    })
    if (focusedPointId === id) setFocusedPointId(undefined)
    if (nearbyPointId === id) setNearbyPointId(undefined)
  }, [data, points, focusedPointId, nearbyPointId, onChange])

  const handleConfirmImageAction = () => {
    if (!imageAction) return
    if (imageAction.type === 'delete') {
      onChange({ ...data, imagePath: null })
    } else if (imageAction.type === 'change') {
      onChange({ ...data, imagePath: imageAction.path || null })
    }
    setImageAction(null)
  }

  const handleFocusPoint = useCallback((point: LabelledDiagramPoint) => {
    setFocusedPointId(point.id)
    setShowCollisionOverlay(false)
    if (!transformRef.current || !contentRef.current) return
    
    const scale = transformRef.current.instance.transformState.scale
    const container = contentRef.current.parentElement?.parentElement
    if (!container) return
    
    const wWidth = container.clientWidth
    const wHeight = container.clientHeight
    
    const pxX = (point.x / 100) * imgSize.width
    const pxY = (point.y / 100) * imgSize.height
    
    const targetX = (wWidth / 2) - (pxX * scale)
    const targetY = (wHeight / 2) - (pxY * scale)
    
    transformRef.current.setTransform(targetX, targetY, scale, 400, 'easeOut')
  }, [imgSize])

  return (
    <Box 
      sx={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}
      className="labelled-diagram-editor"
      onPointerMove={handlePointerMove}
    >
      {/* ── Floating Left Sidebar ── */}
      <PointsSidebar
        points={points}
        onAddPoint={addPoint}
        onUpdatePoint={updatePoint}
        onDeletePoint={deletePoint}
        onFocusPoint={handleFocusPoint}
        focusedPointId={focusedPointId}
        viewablePointIds={viewablePointIds}
        imgSize={imgSize}
      />

      {/* ── Main Canvas ── */}
      <Box
        className="labelled-diagram-editor-canvas"
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#1a1a1a',
          // Checkerboard pattern for background awareness
          backgroundImage: `
            linear-gradient(45deg, #222 25%, transparent 25%),
            linear-gradient(-45deg, #222 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #222 75%),
            linear-gradient(-45deg, transparent 75%, #222 75%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
          overflow: 'hidden'
        }}
        onClick={handleCanvasClick}
      >
        {!imagePath ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Upload Diagram Image
            </Typography>
            <ImagePicker
              projectDir={projectDir}
              desiredNamePrefix="main-image"
              value={imagePath}
              onChange={(val) => onChange({ ...data, imagePath: val })}
              label="Click or Drop main image here"
              size={300}
              sx={{ borderStyle: 'solid', borderWidth: 2, background: 'rgba(255,255,255,0.05)' }}
            />
          </Box>
        ) : (
          <>
            <TransformWrapper 
              ref={transformRef}
              centerOnInit 
              minScale={0.1} 
              maxScale={5}
              doubleClick={{ disabled: true }}
              panning={{ 
                disabled: isDraggingPoint,
                velocityDisabled: true
              }}
              limitToBounds={true} // Constraint applied to keep image in view
              onTransformed={handleTransform}
              onInit={handleTransform}
            >
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <Box 
                  ref={contentRef}
                  sx={{ position: 'relative', display: 'inline-block' }}
                >
                  {imageUrl && (
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt="Diagram"
                      style={{ display: 'block', maxWidth: 'none' }}
                      onLoad={(e) => {
                        const img = e.currentTarget
                        setImgSize({ width: img.naturalWidth, height: img.naturalHeight })
                        updateViewablePoints()
                      }}
                    />
                  )}
                </Box>
              </TransformComponent>
            </TransformWrapper>

            {/* Points Overlay (Outside TransformComponent for full control) */}
            <Box 
              sx={{ 
                position: 'absolute', 
                inset: 0, 
                pointerEvents: 'none' 
              }}
            >
              {points.map((p, idx) => (
                <DiagramPointBadge 
                  key={p.id}
                  point={p}
                  index={idx}
                  isFocused={p.id === focusedPointId}
                  isNearby={p.id === nearbyPointId}
                  imgSize={imgSize}
                  transform={transform}
                  onMove={(id, x, y) => updatePoint(id, { x, y })}
                  onFocus={(id) => setFocusedPointId(id)}
                  onUpdateText={(text) => updatePoint(p.id, { text })}
                  onDelete={() => deletePoint(p.id)}
                  onFocusInSidebar={() => handleFocusPoint(p)}
                  onDragStart={() => setIsDraggingPoint(true)}
                  onDragEnd={() => setIsDraggingPoint(false)}
                />
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Speed Dial Actions */}
      <SpeedDial
        ariaLabel="Labelled Diagram Actions"
        sx={{ position: 'absolute', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Add New Point"
          onClick={addPoint}
        />
        <SpeedDialAction
          icon={<PhotoSizeSelectActual />}
          tooltipTitle="Change Diagram Image"
          onClick={() => setImageAction({ type: 'change', path: imagePath })}
        />
        <SpeedDialAction
          icon={<DeleteForever color="error" />}
          tooltipTitle="Delete Diagram Image"
          onClick={() => setImageAction({ type: 'delete' })}
        />
        <SpeedDialAction
          icon={<Reorder />}
          tooltipTitle="Reorder Points (Coming Soon)"
          onClick={() => setShowReorderToast(true)}
        />
      </SpeedDial>

      {/* Confirmation Dialog */}
      <Dialog
        open={Boolean(imageAction)}
        onClose={() => setImageAction(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {imageAction?.type === 'delete' ? 'Delete Diagram Image?' : 'Change Diagram Image?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {imageAction?.type === 'delete' 
              ? 'This will remove the current image. Point positions (%) will be preserved but you won\'t see them until a new image is added.'
              : 'Changing the image will apply the current point percentages to the new image dimensions. You may need to readjust them.'}
          </DialogContentText>
          {imageAction?.type === 'change' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <ImagePicker
                projectDir={projectDir}
                desiredNamePrefix="diag-img"
                value={imageAction.path || null}
                onChange={(path) => setImageAction(prev => prev ? { ...prev, path } : null)}
                label="Select New Image"
                size={120}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setImageAction(null)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleConfirmImageAction} 
            variant="contained" 
            color={imageAction?.type === 'delete' ? 'error' : 'primary'}
            disabled={imageAction?.type === 'change' && imageAction.path === imagePath}
          >
            Confirm {imageAction?.type === 'delete' ? 'Deletion' : 'Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Collision Overlay (Iteration 5) ── */}
      {showCollisionOverlay && (
        <Box
          sx={{
            position: 'fixed',
            left: overlayPos.x,
            top: overlayPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            p: 1,
            background: 'rgba(20, 20, 20, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, auto)',
            gap: 1
          }}
          onMouseLeave={() => setShowCollisionOverlay(false)}
        >
          {collisionPoints.map(p => {
             const idx = points.findIndex(pt => pt.id === p.id)
             const color = POINT_COLORS[idx % POINT_COLORS.length]
             return (
               <Box
                 key={p.id}
                 onClick={(e) => {
                   e.stopPropagation()
                   handleFocusPoint(p)
                   setShowCollisionOverlay(false)
                 }}
                 sx={{
                   width: 36,
                   height: 36,
                   borderRadius: '50%',
                   background: color,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   color: '#fff',
                   fontWeight: 700,
                   cursor: 'pointer',
                   border: '2px solid transparent',
                   transition: 'all 0.2s',
                   '&:hover': { transform: 'scale(1.1)', borderColor: '#fff' }
                 }}
               >
                 {idx + 1}
               </Box>
             )
          })}
        </Box>
      )}
      {/* Snackbar for Reorder */}
      <Snackbar
        open={showReorderToast}
        autoHideDuration={3000}
        onClose={() => setShowReorderToast(false)}
        message="Reordering points will be available in a future update."
      />
    </Box>
  )
}
