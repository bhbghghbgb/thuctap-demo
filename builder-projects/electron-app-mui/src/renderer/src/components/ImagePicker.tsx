import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ClearIcon from '@mui/icons-material/Clear'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Box, CircularProgress, IconButton, SxProps, Tooltip, Typography } from '@mui/material'
import { useAssetUrl } from '@renderer/hooks/useAssetUrl'
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  projectDir: string
  desiredNamePrefix: string
  value: string | null
  onChange: (relativePath: string | null) => void
  label?: string
  size?: number
  sx?: SxProps
  /** When true, shows a warning UI if no image is set */
  required?: boolean
}

export default function ImagePicker({
  projectDir,
  desiredNamePrefix,
  value,
  onChange,
  label,
  size = 100,
  sx,
  required = false
}: Props): React.ReactElement {
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [prevValue, setPrevValue] = useState(value)
  const { data: url } = useAssetUrl(projectDir, value)

  // Reset error state when value changes
  if (value !== prevValue) {
    setPrevValue(value)
    setImageError(false)
  }

  const importFile = async (filePath: string): Promise<void> => {
    setLoading(true)
    try {
      const relativePath = await window.electronAPI.importImage(
        filePath,
        projectDir,
        desiredNamePrefix
      )
      onChange(relativePath)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = async (): Promise<void> => {
    const picked = await window.electronAPI.pickImage()
    if (picked) await importFile(picked)
  }

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onChange(null)
  }

  // ── Drag & drop support ──────────────────────────────────────────────────
  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: any[], _rejections, event: any) => {
      event?.stopPropagation()
      const file = acceptedFiles.find((f) => f.type?.startsWith('image/'))
      if (file) {
        importFile(window.electronAPI.getPathForFile(file))
      }
    },
    onDragEnter: (e) => e.stopPropagation(),
    onDragOver: (e) => e.stopPropagation(),

    getFilesFromEvent: (event: any): any => {
      const files = event.dataTransfer?.files
      return files ? Array.from(files) : []
    },
    disabled: loading,
    accept: { 'image/*': [] }
  })

  const isActive = isDragActive && !loading

  return (
    <Tooltip
      title={
        required && !value
          ? 'This field requires an image. Click to add or drop an image.'
          : value
            ? 'Click to change image · Drop image here'
            : 'Click to add image · Drop image here'
      }
    >
      <Box
        {...getRootProps()}
        onClick={(e) => {
          // react-dropzone handles click by default, but we have a custom handleClick
          // that uses electronAPI.pickImage. We should probably keep our custom one
          // but call it from here or let dropzone handle it.
          // Let's use dropzone's built-in click if possible, or keep our handleClick.
          // Since we use electronAPI.pickImage, our handleClick is better.
          e.stopPropagation()
          handleClick()
        }}
        sx={[
          {
            width: size,
            height: size,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: isActive
              ? 'primary.main'
              : value
                ? 'primary.dark'
                : required
                  ? 'warning.main'
                  : 'rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            background: isActive
              ? 'rgba(110,231,183,0.08)'
              : value
                ? 'transparent'
                : required
                  ? 'rgba(255,183,77,0.04)'
                  : 'rgba(255,255,255,0.02)',
            transition: 'border-color 0.15s, background 0.15s',
            flexShrink: 0,
            '&:hover': { borderColor: 'primary.main', background: 'rgba(110,231,183,0.04)' }
          },
          ...(Array.isArray(sx) ? sx : [sx])
        ]}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : url && !imageError ? (
          <>
            <Box
              component="img"
              src={url}
              alt={label ?? 'asset'}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImageError(true)}
            />
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '2px',
                '&:hover': { background: 'rgba(248,113,113,0.8)' }
              }}
            >
              <ClearIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </>
        ) : value && imageError ? (
          <>
            <ErrorOutlinedIcon
              sx={{
                fontSize: size * 0.4,
                color: 'error.main'
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'error.main',
                fontSize: '0.65rem',
                mt: 0.5,
                textAlign: 'center',
                px: 0.5,
                lineHeight: 1.2
              }}
            >
              Image not found
            </Typography>
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '2px',
                '&:hover': { background: 'rgba(248,113,113,0.8)' }
              }}
            >
              <ClearIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </>
        ) : required && !value ? (
          <>
            <WarningAmberIcon
              sx={{
                fontSize: size * 0.4,
                color: 'warning.main'
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'warning.main',
                fontSize: '0.65rem',
                mt: 0.5,
                textAlign: 'center',
                px: 0.5,
                lineHeight: 1.2
              }}
            >
              Required
            </Typography>
          </>
        ) : (
          <>
            <AddPhotoAlternateIcon
              sx={{
                fontSize: size * 0.32,
                color: isActive ? 'primary.main' : 'rgba(255,255,255,0.25)'
              }}
            />
            {label && (
              <Typography
                variant="caption"
                sx={{
                  color: isActive ? 'primary.main' : 'rgba(255,255,255,0.35)',
                  fontSize: '0.65rem',
                  mt: 0.5,
                  textAlign: 'center',
                  px: 0.5,
                  lineHeight: 1.2
                }}
              >
                {isActive ? 'Drop!' : label}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Tooltip>
  )
}
