/**
 * Hook for Labelled Diagram point CRUD operations.
 * Manages point creation, updates, and deletion with local state buffering for drag operations.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useCallback, useState } from 'react'
import { LabelledDiagramAppData, LabelledDiagramPoint } from '../../types'

interface UseLabelledDiagramCrudReturn {
  localPoints: LabelledDiagramPoint[]
  selectedPointId: string | null
  setSelectedPointId: (id: string | null) => void
  addPoint: (xPercent: number, yPercent: number) => void
  updatePoint: (id: string, patch: Partial<LabelledDiagramPoint>, commit?: boolean) => void
  deletePoint: (id: string) => void
}

interface UseLabelledDiagramCrudOptions {
  appData: LabelledDiagramAppData
  onChange: (data: LabelledDiagramAppData) => void
  isDragging: boolean
}

interface UseLabelledDiagramCrudReturn {
  localPoints: LabelledDiagramPoint[]
  selectedPointId: string | null
  setSelectedPointId: (id: string | null) => void
  addPoint: (xPercent: number, yPercent: number) => void
  updatePoint: (id: string, patch: Partial<LabelledDiagramPoint>, commit?: boolean) => void
  deletePoint: (id: string) => void
}

/**
 * Provides CRUD operations for labelled diagram points.
 * Uses local state buffering to support drag operations without excessive onChange calls.
 *
 * @param options.appData - Current app data
 * @param options.onChange - State update callback
 * @param options.isDragging - Whether a drag operation is in progress (prevents sync during drag)
 */
export function useLabelledDiagramCrud({
  appData,
  onChange,
  isDragging
}: UseLabelledDiagramCrudOptions): UseLabelledDiagramCrudReturn {
  const { points } = appData
  const [localPoints, setLocalPoints] = useState<LabelledDiagramPoint[]>(points)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  // Sync localPoints when prop changes (unless dragging)
  const [prevPoints, setPrevPoints] = useState(points)

  if (points !== prevPoints) {
    setPrevPoints(points)
    // Don't sync during drag - localPoints has the in-progress drag position
    if (!isDragging) {
      setLocalPoints(points)
    }
  }

  // ── Point CRUD ──────────────────────────────────────────────────────────
  const addPoint = useCallback(
    (xPercent: number, yPercent: number) => {
      const id = `point-${Date.now()}`
      const newPoint: LabelledDiagramPoint = {
        id,
        text: `Point ${appData._pointCounter + 1}`,
        xPercent,
        yPercent
      }
      onChange({
        ...appData,
        points: [...localPoints, newPoint],
        _pointCounter: appData._pointCounter + 1
      })
      setSelectedPointId(id)
    },
    [appData, localPoints, onChange]
  )

  const updatePoint = useCallback(
    (id: string, patch: Partial<LabelledDiagramPoint>, commit = true) => {
      const nextPoints = localPoints.map((p) => (p.id === id ? { ...p, ...patch } : p))
      setLocalPoints(nextPoints)

      if (commit) {
        onChange({
          ...appData,
          points: nextPoints
        })
      }
    },
    [appData, localPoints, onChange]
  )

  const deletePoint = useCallback(
    (id: string) => {
      onChange({
        ...appData,
        points: localPoints.filter((p) => p.id !== id)
      })
      if (selectedPointId === id) setSelectedPointId(null)
    },
    [appData, localPoints, selectedPointId, onChange]
  )

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: () => {
      // Default: add point at center (will be overridden by component's addCenterPointView)
      addPoint(50, 50)
    }
  })

  return {
    localPoints,
    selectedPointId,
    setSelectedPointId,
    addPoint,
    updatePoint,
    deletePoint
  }
}
