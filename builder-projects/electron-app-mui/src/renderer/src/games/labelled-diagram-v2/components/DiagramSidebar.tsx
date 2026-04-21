import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { LabelledDiagramPointV2 } from '@shared/types'
import React, { useState } from 'react'
import { SidebarPointItem } from './SidebarPointItem'

interface DiagramSidebarProps {
  points: LabelledDiagramPointV2[]
  selectedPointId: string | null
  onSelectPoint: (point: LabelledDiagramPointV2) => void
  onUpdatePointText: (id: string, text: string) => void
  onDeletePoint: (id: string) => void
  onAddPointAtCenter: () => void
}

/**
 * Sidebar component containing the list of all points in the diagram.
 * Supports collapsing/expanding and CRUD actions on individual points.
 */
export const DiagramSidebar: React.FC<DiagramSidebarProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  onUpdatePointText,
  onDeletePoint,
  onAddPointAtCenter
}) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Box
      sx={{
        width: collapsed ? 60 : 300,
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        background: '#13161f',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Points
          </Typography>
        )}
        <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ ml: 'auto' }}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {!collapsed && (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {points.map((p, index) => (
            <SidebarPointItem
              key={p.id}
              point={p}
              index={index}
              isSelected={selectedPointId === p.id}
              onSelect={onSelectPoint}
              onUpdateText={onUpdatePointText}
              onDelete={onDeletePoint}
            />
          ))}

          {points.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
              <Typography variant="body2">No points added yet.</Typography>
              <Typography variant="caption">Double click to add a point.</Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            fullWidth
            startIcon={<AddIcon />}
            onClick={onAddPointAtCenter}
            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', mt: 1 }}
          >
            Add Point at View Center
          </Button>
        </Box>
      )}
    </Box>
  )
}
