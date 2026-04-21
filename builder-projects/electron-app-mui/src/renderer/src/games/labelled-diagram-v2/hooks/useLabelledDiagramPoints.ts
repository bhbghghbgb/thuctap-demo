import { LabelledDiagramAppDataV2, LabelledDiagramPointV2 } from '@renderer/types'
import { useCallback, useState } from 'react'

interface UseLabelledDiagramPointsProps {
  appData: LabelledDiagramAppDataV2
  draggingPointId: string | null
  setDraggingPointId: (id: string | null) => void
  onChange: (data: LabelledDiagramAppDataV2) => void
}

export interface UseLabelledDiagramPointsReturn {
  localPoints: LabelledDiagramPointV2[]
  setLocalPoints: (points: LabelledDiagramPointV2[]) => void
  addPoint: (xPercent: number, yPercent: number, setSelectedPointId: (id: string) => void) => void
  updatePoint: (id: string, patch: Partial<LabelledDiagramPointV2>, commit?: boolean) => void
  deletePoint: (
    id: string,
    selectedPointId: string | null,
    setSelectedPointId: (id: string | null) => void
  ) => void
}

/**
 * Hook to manage point CRUD operations for the Labelled Diagram editor.
 * Handles local state for smooth dragging and synchronization with project data.
 */
export function useLabelledDiagramPoints({
  appData,
  draggingPointId,
  setDraggingPointId,
  onChange
}: UseLabelledDiagramPointsProps): UseLabelledDiagramPointsReturn {
  const { points } = appData
  const [localPoints, setLocalPoints] = useState<LabelledDiagramPointV2[]>(points)
  const [prevPoints, setPrevPoints] = useState(points)

  // Sync localPoints with prop points when external changes occur (e.g. Undo/Redo)
  if (points !== prevPoints) {
    setPrevPoints(points)
    setLocalPoints(points)
    // If we were dragging, the external change (Undo/Redo) should cancel the current drag operation
    if (draggingPointId) {
      setDraggingPointId(null)
    }
  }

  /**
   * Adds a new point at the specified percentage coordinates.
   */
  const addPoint = useCallback(
    (xPercent: number, yPercent: number, setSelectedPointId: (id: string) => void) => {
      const id = `point-${Date.now()}`
      const newPoint: LabelledDiagramPointV2 = {
        id,
        text: `Point ${appData._pointCounter + 1}`,
        xPercent,
        yPercent
      }

      const nextPoints = [...localPoints, newPoint]
      setLocalPoints(nextPoints)

      onChange({
        ...appData,
        points: nextPoints,
        _pointCounter: appData._pointCounter + 1
      })
      setSelectedPointId(id)
    },
    [appData, localPoints, onChange]
  )

  /**
   * Updates an existing point.
   * @param commit If true, saves the change to project history.
   */
  const updatePoint = useCallback(
    (id: string, patch: Partial<LabelledDiagramPointV2>, commit = true) => {
      setLocalPoints((prev) => {
        const nextPoints = prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        if (commit) {
          onChange({
            ...appData,
            points: nextPoints
          })
        }
        return nextPoints
      })
    },
    [appData, onChange]
  )

  /**
   * Deletes a point by ID.
   */
  const deletePoint = useCallback(
    (
      id: string,
      selectedPointId: string | null,
      setSelectedPointId: (id: string | null) => void
    ) => {
      const nextPoints = localPoints.filter((p) => p.id !== id)
      setLocalPoints(nextPoints)
      onChange({
        ...appData,
        points: nextPoints
      })
      if (selectedPointId === id) setSelectedPointId(null)
    },
    [appData, localPoints, onChange]
  )

  return {
    localPoints,
    setLocalPoints,
    addPoint,
    updatePoint,
    deletePoint
  }
}
