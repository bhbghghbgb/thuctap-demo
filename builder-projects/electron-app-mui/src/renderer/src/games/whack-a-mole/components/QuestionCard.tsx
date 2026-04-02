import DeleteIcon from '@mui/icons-material/Delete'
import { Box, IconButton, Paper, Typography } from '@mui/material'
import React from 'react'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '../../../components'
import { WhackAMoleQuestion } from '../../../types'

export interface QuestionCardProps {
  question: WhackAMoleQuestion
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, patch: Partial<WhackAMoleQuestion>) => void
  onDelete: (id: string) => void
}

/**
 * Card component for editing a single question in WhackAMoleEditor.
 * Uses a master grid layout with question and answer sections.
 */
export function QuestionCard({
  question,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete
}: QuestionCardProps): React.ReactElement {
  const subgridStyle = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'start',
    gap: 2,
    p: 2
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        background: '#1a1d27',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'min-content min-content 1fr min-content',
        alignItems: 'start'
      }}
    >
      {/* ROW 1: QUESTION */}
      <FileDropTarget
        onFileDrop={async (fp) => {
          const rel = await window.electronAPI.importImage(fp, projectDir, question.id)
          onUpdate(question.id, { questionImage: rel })
        }}
        sx={[
          subgridStyle,
          {
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit'
          }
        ]}
      >
        <Box sx={{ mt: 0.5 }}>
          <IndexBadge index={index} color="primary" />
        </Box>

        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={`${question.id}-question`}
          value={question.questionImage}
          onChange={(p) => onUpdate(question.id, { questionImage: p })}
          label="Question"
          size={80}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <NameField
            label="Question text"
            value={question.question}
            onChange={(v) => onUpdate(question.id, { question: v })}
            placeholder="e.g. Con chuột đang ở vị trí nào?"
            autoFocus={autoFocus}
            multiline
          />
          <Typography variant="caption" color="text.secondary">
            This question will be displayed to students.
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={() => onDelete(question.id)}
          sx={{
            color: 'error.main',
            opacity: 0.6,
            '&:hover': { opacity: 1 },
            mt: 1,
            justifySelf: 'center'
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </FileDropTarget>

      {/* ROW 2: ANSWER */}
      <FileDropTarget
        onFileDrop={async (fp) => {
          const rel = await window.electronAPI.importImage(fp, projectDir, `${question.id}-answer`)
          onUpdate(question.id, { answerImage: rel })
        }}
        sx={[
          subgridStyle,
          {
            borderBottomLeftRadius: 'inherit',
            borderBottomRightRadius: 'inherit'
          }
        ]}
      >
        <Typography
          variant="overline"
          sx={{
            gridColumn: '1 / 4',
            color: '#6ee7b7',
            fontWeight: 700,
            letterSpacing: 1.2,
            fontSize: '0.65rem',
            lineHeight: 1,
            mb: 0.5,
            pl: 1
          }}
        >
          Correct Answer (The mole students should whack)
        </Typography>

        <Box />
        <Box />

        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={`${question.id}-answer`}
          value={question.answerImage}
          onChange={(p) => onUpdate(question.id, { answerImage: p })}
          label="Answer"
          size={80}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <NameField
            label="Answer text"
            value={question.answerText}
            onChange={(v) => onUpdate(question.id, { answerText: v })}
            placeholder="e.g. Dưới đất"
            multiline={false}
          />
          <Typography variant="caption" color="text.secondary">
            In the game, this mole will appear among other decoy moles.
          </Typography>
        </Box>

        <Box />
      </FileDropTarget>
    </Paper>
  )
}
