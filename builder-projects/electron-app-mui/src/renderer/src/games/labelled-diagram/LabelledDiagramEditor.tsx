import { Box, Typography } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
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

  // ── HUD/UX Logic ──────────────────────────────────────────────────────────
  const updateViewablePoints = useCallback(() => {
    if (!contentRef.current) return
    const container = contentRef.current
    const wrapper = container.parentElement?.parentElement // TransformComponent wrapper
    if (!wrapper) return

    const wRect = wrapper.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()

    const viewable = points
      .filter((p) => {
        if (p.isHidden) return false
        const pxX = cRect.left + (p.x / 100) * cRect.width
        const pxY = cRect.top + (p.y / 100) * cRect.height
        return (
          pxX >= wRect.left && pxX <= wRect.right && pxY >= wRect.top && pxY <= wRect.bottom
        )
      })
      .map((p) => p.id)

    setViewablePointIds(viewable)
  }, [points])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (showCollisionOverlay) return

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
  }, [points, showCollisionOverlay])

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

  const handleFocusPoint = useCallback((point: LabelledDiagramPoint) => {
    setFocusedPointId(point.id)
    setShowCollisionOverlay(false)
    if (!transformRef.current || !imageRef.current) return
    
    const { setTransform } = transformRef.current
    const img = imageRef.current
    
    // Calculate pixel coordinates
    const pxX = (point.x / 100) * img.width
    const pxY = (point.y / 100) * img.height
    
    // Get wrapper dimensions
    const wrapper = img.parentElement?.parentElement // TransformComponent wrapper
    if (!wrapper) return
    
    const wWidth = wrapper.clientWidth
    const wHeight = wrapper.clientHeight
    
    const scale = 2 // Zoom level for focusing
    
    // Center point: (wWidth / 2) - pxX * scale
    const targetX = (wWidth / 2) - pxX * scale
    const targetY = (wHeight / 2) - pxY * scale
    
    setTransform(targetX, targetY, scale, 400, 'easeOut')
  }, [])

  return (
    <Box 
      sx={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}
      onPointerMove={handlePointerMove}
    >
      {/* ── Floating Left Sidebar ── */}
      {imagePath && (
        <PointsSidebar
          points={points}
          projectDir={projectDir}
          imagePath={imagePath}
          onAddPoint={addPoint}
          onUpdatePoint={updatePoint}
          onDeletePoint={deletePoint}
          onFocusPoint={handleFocusPoint}
          onImageChange={(val) => onChange({ ...data, imagePath: val })}
          focusedPointId={focusedPointId}
          viewablePointIds={viewablePointIds}
          imgSize={imgSize}
        />
      )}

      {/* ── Main Canvas ── */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.15)',
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
          <TransformWrapper 
            ref={transformRef}
            centerOnInit 
            minScale={0.1} 
            maxScale={5}
            doubleClick={{ disabled: true }}
            onTransformed={updateViewablePoints}
            onInit={updateViewablePoints}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <Box ref={contentRef} sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={imageUrl || ''}
                  alt="Diagram"
                  style={{ display: 'block', maxWidth: 'none' }}
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setImgSize({ width: img.naturalWidth, height: img.naturalHeight })
                    updateViewablePoints()
                  }}
                />
                
                {/* Render Point Badges */}
                {points.map((p, idx) => (
                  <DiagramPointBadge 
                    key={p.id}
                    point={p}
                    index={idx}
                    isFocused={p.id === focusedPointId}
                    isNearby={p.id === nearbyPointId}
                    containerRef={contentRef}
                    onMove={(id, x, y) => updatePoint(id, { x, y })}
                    onFocus={(id) => setFocusedPointId(id)}
                    onUpdateText={(text) => updatePoint(p.id, { text })}
                    onDelete={() => deletePoint(p.id)}
                    onFocusInSidebar={() => handleFocusPoint(p)}
                  />
                ))}
              </Box>
            </TransformComponent>
          </TransformWrapper>
        )}
      </Box>

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
    </Box>
  )
}
