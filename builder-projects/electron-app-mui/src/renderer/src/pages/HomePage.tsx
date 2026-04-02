import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Box, Divider, Typography } from '@mui/material'
import { JSX, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HasProjectDialog,
  NonEmptyFolderDialog,
  RecentProjectsSection,
  TemplateGrid
} from '../components/home/HomeComponents'
import { useTemplateManager } from '../hooks/useTemplates'
import { GameTemplate, GlobalSettings, RecentProject } from '../types'

async function readRecentProjects(): Promise<RecentProject[]> {
  const s = await window.electronAPI.settingsReadGlobal()
  return (
    ((s as unknown as Record<string, unknown>).recentProjects as RecentProject[] | undefined) ?? []
  )
}

async function writeRecentProjects(list: RecentProject[]): Promise<void> {
  const s = await window.electronAPI.settingsReadGlobal()
  await window.electronAPI.settingsWriteGlobal({ ...s, recentProjects: list } as GlobalSettings)
}

async function addRecentProject(entry: RecentProject): Promise<void> {
  const existing = await readRecentProjects()
  const filtered = existing.filter((r) => r.filePath !== entry.filePath)
  await writeRecentProjects([entry, ...filtered].slice(0, 10))
}

type FolderDialogState =
  | { type: 'non-empty'; folder: string; template: GameTemplate }
  | { type: 'has-project'; folder: string; template: GameTemplate }
  | null

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage(): JSX.Element {
  const navigate = useNavigate()
  const manager = useTemplateManager()
  const [folderDlg, setFolderDlg] = useState<FolderDialogState>(null)
  const [recent, setRecent] = useState<RecentProject[]>([])
  const [showRecent, setShowRecent] = useState(false)

  // Load recent projects on mount
  useEffect(() => {
    readRecentProjects().then(setRecent)
  }, [])

  const openProject = useCallback(
    async (filePath: string, data: ReturnType<typeof JSON.parse>) => {
      const projectDir = filePath.replace(/[/\\][^/\\]+$/, '')
      const template = manager.getTemplate(data.templateId)
      await addRecentProject({
        filePath,
        projectDir,
        templateId: data.templateId,
        templateName: template?.name ?? data.templateId,
        projectName: data.name,
        lastOpened: new Date().toISOString()
      })
      navigate(`/project/${data.templateId}`, { state: { filePath, projectDir, data } })
    },
    [manager, navigate]
  )

  const handleOpenExisting = async (): Promise<void> => {
    const result = await window.electronAPI.openProjectFile()
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const handleNewProject = async (template: GameTemplate): Promise<void> => {
    const folder = await window.electronAPI.chooseProjectFolder()
    if (!folder) return
    const status = await window.electronAPI.checkFolderStatus(folder)
    if (status === 'has-project') {
      setFolderDlg({ type: 'has-project', folder, template })
      return
    }
    if (status === 'non-empty') {
      setFolderDlg({ type: 'non-empty', folder, template })
      return
    }
    await createNewProject(folder, template)
  }

  const createNewProject = async (folder: string, template: GameTemplate): Promise<void> => {
    const projectPath = `${folder}/project.mgproj`
    const now = new Date().toISOString()
    const initialAppData = manager.createInitialData(template.id)
    const newProject = {
      version: '1.0.0',
      templateId: template.id,
      name: `New ${template.name} Project`,
      createdAt: now,
      updatedAt: now,
      settings: null,
      appData: initialAppData
    }
    await window.electronAPI.saveProject(newProject, projectPath)
    await openProject(projectPath, newProject)
  }

  const handleOpenFromFolder = async (folder: string): Promise<void> => {
    const filePath = `${folder}/project.mgproj`
    const result = await window.electronAPI.openProjectFile(filePath)
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const removeRecent = async (filePath: string): Promise<void> => {
    const updated = recent.filter((r) => r.filePath !== filePath)
    setRecent(updated)
    await writeRecentProjects(updated)
  }

  const openRecent = async (entry: RecentProject): Promise<void> => {
    const result = await window.electronAPI.openProjectFile(entry.filePath)
    if (!result) {
      alert(`Could not open "${entry.projectName}". The file may have been moved or deleted.`)
      return
    }
    await openProject(result.filePath, result.data)
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
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

      {/* ── Recent projects (collapsible) ── */}
      <RecentProjectsSection
        recent={recent}
        showRecent={showRecent}
        onToggleShow={() => setShowRecent((v) => !v)}
        onBrowse={handleOpenExisting}
        onOpenRecent={openRecent}
        onRemoveRecent={removeRecent}
      />

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* ── Templates ── */}
      <TemplateGrid templates={manager.getAllTemplates()} onSelect={handleNewProject} />

      {/* ── Folder conflict dialogs ── */}
      <HasProjectDialog
        open={folderDlg?.type === 'has-project'}
        folder={folderDlg?.folder ?? ''}
        onClose={() => setFolderDlg(null)}
        onOpen={async () => {
          const d = folderDlg
          setFolderDlg(null)
          if (d) await handleOpenFromFolder(d.folder)
        }}
      />

      <NonEmptyFolderDialog
        open={folderDlg?.type === 'non-empty'}
        folder={folderDlg?.folder ?? ''}
        onClose={() => setFolderDlg(null)}
        onChooseAnother={async () => {
          const d = folderDlg
          setFolderDlg(null)
          if (d) await handleNewProject(d.template)
        }}
      />
    </Box>
  )
}
