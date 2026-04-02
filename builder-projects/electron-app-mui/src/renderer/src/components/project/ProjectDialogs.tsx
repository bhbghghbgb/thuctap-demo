import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  TextField
} from '@mui/material'
import React from 'react'

// ── Rename Dialog ─────────────────────────────────────────────────────────────
export interface RenameDialogProps {
  open: boolean
  onClose: () => void
  currentValue: string
  onChange: (value: string) => void
  onConfirm: () => void
}

export function RenameDialog({
  open,
  onClose,
  currentValue,
  onChange,
  onConfirm
}: RenameDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rename Project</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Project name"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!currentValue.trim()}>
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Export Menu ───────────────────────────────────────────────────────────────
export interface ExportMenuProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  onExport: (mode: 'folder' | 'zip') => void
}

export function ExportMenu({ anchorEl, onClose, onExport }: ExportMenuProps): React.ReactElement {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={() => onExport('folder')}>
        <ListItemIcon>
          <DriveFileMoveIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Export to folder"
          secondary={
            <>
              Copies game + assets
              <Box
                component="span"
                sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}
              >
                Ctrl+Shift+P
              </Box>
            </>
          }
        />
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => onExport('zip')}>
        <ListItemIcon>
          <FolderZipIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Export as ZIP"
          secondary={
            <>
              Single archive
              <Box
                component="span"
                sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}
              >
                Ctrl+Alt+P
              </Box>
            </>
          }
        />
      </MenuItem>
    </Menu>
  )
}

// ── Save As Confirm Dialog ────────────────────────────────────────────────────
export interface SaveAsConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SaveAsConfirmDialog({
  open,
  onClose,
  onConfirm
}: SaveAsConfirmDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Overwrite existing project?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          That folder already contains a project. This will overwrite it.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={onConfirm}>
          Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Back Confirm Dialog ───────────────────────────────────────────────────────
export interface BackConfirmDialogProps {
  open: boolean
  onClose: () => void
  onDiscard: () => void
  onSaveAndLeave: () => Promise<void>
}

export function BackConfirmDialog({
  open,
  onClose,
  onDiscard,
  onSaveAndLeave
}: BackConfirmDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent>
        <DialogContentText>Save before leaving?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDiscard} color="error">
          Discard &amp; leave
        </Button>
        <Button onClick={onSaveAndLeave} variant="contained">
          Save &amp; leave
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Snackbar ──────────────────────────────────────────────────────────────────
export interface ProjectSnackbarProps {
  message: string | null
  severity: 'success' | 'error' | 'info'
  onClose: () => void
}

export function ProjectSnackbar({
  message,
  severity,
  onClose
}: ProjectSnackbarProps): React.ReactElement {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={3500}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={severity} onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  )
}
