import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import AddIcon from '@mui/icons-material/Add'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { GameTemplate } from '../types'

type FolderDialogState =
  | { type: 'non-empty'; folder: string; template: GameTemplate }
  | { type: 'has-project'; folder: string; template: GameTemplate }
  | null

export default function HomePage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<GameTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null)

  useEffect(() => {
    window.electronAPI
      .getTemplates()
      .then(setTemplates)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const handleOpenExisting = async () => {
    const result = await window.electronAPI.openProjectFile()
    if (!result) return
    const { filePath, data } = result
    const projectDir = filePath.replace(/[/\\][^/\\]+$/, '')
    navigate(`/project/${data.templateId}`, {
      state: { filePath, projectDir, data }
    })
  }

  const handleNewProject = async (template: GameTemplate) => {
    const folder = await window.electronAPI.chooseProjectFolder()
    if (!folder) return

    const status = await window.electronAPI.checkFolderStatus(folder)

    if (status === 'has-project') {
      setFolderDialog({ type: 'has-project', folder, template })
      return
    }

    if (status === 'non-empty') {
      setFolderDialog({ type: 'non-empty', folder, template })
      return
    }

    // empty — proceed
    await createNewProject(folder, template)
  }

  const createNewProject = async (folder: string, template: GameTemplate) => {
    const projectPath = `${folder}/project.mgproj`
    const now = new Date().toISOString()

    const newProject = {
      version: '1.0.0',
      templateId: template.id,
      name: `New ${template.name} Project`,
      createdAt: now,
      updatedAt: now,
      settings: null,
      appData:
        template.gameType === 'group-sort'
          ? { groups: [], items: [], _groupCounter: 0, _itemCounter: 0 }
          : {}
    }

    await window.electronAPI.saveProject(newProject, projectPath)
    navigate(`/project/${template.id}`, {
      state: { filePath: projectPath, projectDir: folder, data: newProject }
    })
  }

  const loadExistingFromFolder = async (folder: string) => {
    const filePath = `${folder}/project.mgproj`
    const result = await window.electronAPI.openProjectFile(filePath)
    if (!result) return
    navigate(`/project/${result.data.templateId}`, {
      state: { filePath: result.filePath, projectDir: folder, data: result.data }
    })
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        maxWidth: 1000,
        mx: 'auto',
        width: '100%'
      }}
    >
      {/* Hero */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SportsEsportsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography
            variant="h3"
            sx={{
              background: 'linear-gradient(135deg, #6ee7b7 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}
          >
            Minigame Builder
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: '52px' }}>
          Create engaging English teaching games for kids — no coding required.
        </Typography>
      </Box>

      {/* Open existing */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Continue working
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenExisting}
            size="large"
            sx={{ borderStyle: 'dashed' }}
          >
            Open existing project…
          </Button>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Templates */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Start a new project
        </Typography>

        {loading && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading game templates…</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Could not load templates: {error}
          </Alert>
        )}

        {!loading && !error && templates.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No templates found. Make sure the <code>templates/</code> directory contains at least
            one game folder with <code>meta.json</code> and <code>index.html</code>.
          </Alert>
        )}

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2
          }}
        >
          {templates.map((t) => (
            <GameTemplateCard key={t.id} template={t} onSelect={handleNewProject} />
          ))}
        </Box>
      </Box>

      {/* ── Folder conflict: has existing project ── */}
      <Dialog
        open={folderDialog?.type === 'has-project'}
        onClose={() => setFolderDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Project already exists</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This folder already contains a project file. Would you like to open it instead?
          </DialogContentText>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}
          >
            {folderDialog?.folder}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<FolderOpenIcon />}
            onClick={async () => {
              const d = folderDialog
              setFolderDialog(null)
              if (d) await loadExistingFromFolder(d.folder)
            }}
          >
            Open existing project
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Folder conflict: folder not empty, no project ── */}
      <Dialog
        open={folderDialog?.type === 'non-empty'}
        onClose={() => setFolderDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderOffIcon color="warning" />
          Folder is not empty
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The selected folder already contains files. Please choose an empty folder to avoid
            mixing project files with other content.
          </DialogContentText>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}
          >
            {folderDialog?.folder}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const d = folderDialog
              setFolderDialog(null)
              if (d) await handleNewProject(d.template)
            }}
          >
            Choose another folder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function GameTemplateCard({
  template,
  onSelect
}: {
  template: GameTemplate
  onSelect: (t: GameTemplate) => void
}) {
  return (
    <Card
      sx={{
        background:
          'linear-gradient(135deg, rgba(110,231,183,0.05) 0%, rgba(167,139,250,0.05) 100%)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(110,231,183,0.12)'
        }
      }}
    >
      <CardActionArea onClick={() => onSelect(template)} sx={{ p: 1 }}>
        <Box
          sx={{
            height: 140,
            borderRadius: 1.5,
            mb: 1,
            background:
              'linear-gradient(135deg, rgba(110,231,183,0.12) 0%, rgba(167,139,250,0.12) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SportsEsportsIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.6 }} />
        </Box>

        <CardContent sx={{ pt: 0.5, pb: '12px !important' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
              {template.name}
            </Typography>
            <Chip
              label={`v${template.version}`}
              size="small"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
            {template.description}
          </Typography>

          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AddIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
              Create new project
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
