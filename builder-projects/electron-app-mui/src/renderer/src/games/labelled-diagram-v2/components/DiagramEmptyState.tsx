import { Box, Typography } from '@mui/material'
import ImagePicker from '@renderer/components/ImagePicker'
import { LabelledDiagramAppDataV2 } from '@shared/types'
import React from 'react'

interface DiagramEmptyStateProps {
  appData: LabelledDiagramAppDataV2
  projectDir: string
  onChange: (data: LabelledDiagramAppDataV2) => void
}

/**
 * Component to display when no background image has been selected yet.
 */
export const DiagramEmptyState: React.FC<DiagramEmptyStateProps> = ({
  appData,
  projectDir,
  onChange
}) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: 400, p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Add Background Image
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Upload an image to start labelling your diagram. Use high-quality diagrams for better
          results.
        </Typography>
        <ImagePicker
          label="Select Diagram Image"
          value={appData.imagePath}
          projectDir={projectDir}
          desiredNamePrefix="diagram"
          onChange={(path) => onChange({ ...appData, imagePath: path })}
        />
      </Box>
    </Box>
  )
}
