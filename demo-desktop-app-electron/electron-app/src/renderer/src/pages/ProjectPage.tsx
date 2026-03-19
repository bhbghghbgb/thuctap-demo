import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import { ProjectFile, ProjectState } from '../types'
import GroupSortEditor from '../components/GroupSortEditor'
import SettingsPanel from '../components/SettingsPanel'
import { useSettings } from '../context/SettingsContext'

export default function ProjectPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { resolved, setProjectSettings } = useSettings()

  const locationState = location.state as {
    filePath: string
    projectDir: string
    data: ProjectFile
  } | null

  const [project, setProject] = useState<ProjectState | null>(() => {
    if (!locationState) return null
    return {
      filePath: locationState.filePath,
      projectDir: locationState.projectDir,
      isDirty: false,
      data: locationState.data
    }
  })

  // Wire per-project settings into context on mount/unmount
  useEffect(() => {
    if (locationState?.data?.settings) {
      setProjectSettings(locationState.data.settings)
    }
    return () => setProjectSettings(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep project settings in context when they change
  useEffect(() => {
    if (project?.data.settings !== undefined) {
      setProjectSettings(project.data.settings ?? null)
    }
  }, [project?.data.settings, setProjectSettings])

  const [snack, setSnack] = useState<{
    msg: string
    severity: 'success' | 'error' | 'info'
  } | null>(null)
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [backConfirmOpen, setBackConfirmOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const showSnack = (msg: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnack({ msg, severity })
  }

  // ── Core save ──────────────────────────────────────────────────────────────
  const doSave = useCallback(async (state: ProjectState) => {
    await window.electronAPI.saveProject(state.data, state.filePath)
    setProject((prev) => (prev ? { ...prev, isDirty: false } : prev))
  }, [])

  // ── Auto-save logic ────────────────────────────────────────────────────────
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const projectRef = useRef<ProjectState | null>(project)
  projectRef.current = project

  // Interval-based auto-save
  useEffect(() => {
    if (intervalTimerRef.current) clearInterval(intervalTimerRef.current)
    if (resolved.autoSave.mode === 'interval') {
      intervalTimerRef.current = setInterval(() => {
        const p = projectRef.current
        if (p?.isDirty) doSave(p).catch(() => {})
      }, resolved.autoSave.intervalSeconds * 1000)
    }
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current)
    }
  }, [resolved.autoSave.mode, resolved.autoSave.intervalSeconds, doSave])

  const triggerOnEditSave = useCallback(
    (state: ProjectState) => {
      if (resolved.autoSave.mode !== 'on-edit') return
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        doSave(state).catch(() => {})
      }, 1000)
    },
    [resolved.autoSave.mode, doSave]
  )

  // ── App data update ────────────────────────────────────────────────────────
  const updateAppData = useCallback(
    (appData: ProjectFile['appData']) => {
      setProject((prev) => {
        if (!prev) return prev
        const next: ProjectState = {
          ...prev,
          isDirty: true,
          data: {
            ...prev.data,
            appData,
            updatedAt: new Date().toISOString()
          }
        }
        triggerOnEditSave(next)
        return next
      })
    },
    [triggerOnEditSave]
  )

  const handleSave = async () => {
    if (!project) return
    try {
      await doSave(project)
      showSnack('Project saved!')
    } catch (e) {
      showSnack(`Save failed: ${e}`, 'error')
    }
  }

  const handleExport = async (mode: 'folder' | 'zip') => {
    setExportMenuAnchor(null)
    if (!project) return
    try {
      const result = await window.electronAPI.exportProject({
        templateId: project.data.templateId,
        appData: project.data.appData,
        projectDir: project.projectDir,
        mode
      })
      if (result.canceled) return
      showSnack(`Exported successfully to: ${result.path}`)
    } catch (e) {
      showSnack(`Export failed: ${e}`, 'error')
    }
  }

  const handleRename = async () => {
    if (!project || !renameValue.trim()) return
    const updated: ProjectState = {
      ...project,
      isDirty: true,
      data: { ...project.data, name: renameValue.trim() }
    }
    setProject(updated)
    setRenameOpen(false)
    try {
      await doSave(updated)
    } catch {
      // will be saved next time
    }
  }

  const handleBack = () => {
    if (project?.isDirty) {
      setBackConfirmOpen(true)
    } else {
      navigate('/')
    }
  }

  if (!project || !templateId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data found. Please go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  const autoSaveLabel =
    resolved.autoSave.mode === 'off'
      ? null
      : resolved.autoSave.mode === 'on-edit'
        ? 'auto-save: on edit'
        : `auto-save: ${resolved.autoSave.intervalSeconds}s`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: '#13161f'
        }}
      >
        <Tooltip title="Back to home">
          <IconButton size="small" onClick={handleBack}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {project.data.name}
          </Typography>
          <Tooltip title="Rename project">
            <IconButton
              size="small"
              sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
              onClick={() => {
                setRenameValue(project.data.name)
                setRenameOpen(true)
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          {project.isDirty && (
            <Chip
              label="unsaved"
              size="small"
              color="warning"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
          {autoSaveLabel && !project.isDirty && (
            <Chip
              label={autoSaveLabel}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', opacity: 0.5 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            startIcon={<SaveIcon />}
            variant={project.isDirty ? 'contained' : 'outlined'}
            color={project.isDirty ? 'primary' : 'inherit'}
            onClick={handleSave}
          >
            Save
          </Button>

          <Button
            size="small"
            startIcon={<FileDownloadIcon />}
            variant="outlined"
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ── Editor area ── */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {templateId === 'group-sort' && (
          <GroupSortEditor
            appData={project.data.appData as any}
            projectDir={project.projectDir}
            onChange={updateAppData}
          />
        )}
      </Box>

      {/* ── Settings panel ── */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} hasProject={true} />

      {/* ── Export menu ── */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('folder')}>
          <ListItemIcon>
            <DriveFileMoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export to folder" secondary="Copies index.html + assets" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleExport('zip')}>
          <ListItemIcon>
            <FolderZipIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export as ZIP" secondary="Single archive file" />
        </MenuItem>
      </Menu>

      {/* ── Rename dialog ── */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Back confirm dialog ── */}
      <Dialog open={backConfirmOpen} onClose={() => setBackConfirmOpen(false)}>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>You have unsaved changes. Save before leaving?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBackConfirmOpen(false)
              navigate('/')
            }}
            color="error"
          >
            Discard &amp; leave
          </Button>
          <Button
            onClick={async () => {
              setBackConfirmOpen(false)
              await handleSave()
              navigate('/')
            }}
            variant="contained"
          >
            Save &amp; leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
