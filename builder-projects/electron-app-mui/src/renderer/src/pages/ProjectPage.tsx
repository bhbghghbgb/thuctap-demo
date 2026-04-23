import { Box, Button, Typography } from '@mui/material'
import { EditorWrapperHandle } from '@renderer/components/EditorWrapper'
import { MoreActionsMenu } from '@renderer/components/project/MoreActionsMenu'
import {
  BackConfirmDialog,
  ExportMenu,
  ProjectSnackbar,
  RenameDialog,
  SaveAsConfirmDialog
} from '@renderer/components/project/ProjectDialogs'
import { ProjectToolbar } from '@renderer/components/project/ProjectToolbar'
import SettingsPanel from '@renderer/components/SettingsPanel'
import { ProjectHistoryProvider } from '@renderer/context/ProjectHistoryProvider'
import { useProjectHistory } from '@renderer/context/useProjectHistory'
import { useSnackbar } from '@renderer/hooks'
import { useAppDocumentTitle } from '@renderer/hooks/useAppDocumentTitle'
import { useProjectFile, useInvalidateProjectFile } from '@renderer/hooks/useProjectFile'
import { useProjectShortcuts } from '@renderer/hooks/useProjectShortcuts'
import { useSettings } from '@renderer/hooks/useSettings'
import { useTemplateManager } from '@renderer/hooks/useTemplates'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { getHistoryArray } from '@renderer/utils/historyUtils'
import { buildProjectFile, buildProjectTitle } from '@renderer/utils/projectFileUtils'
import type { AnyAppData, ProjectFile, ProjectMeta } from '@shared/types'
import isDeepEqual from 'react-fast-compare'
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBoolean, useInterval, useUnmount } from 'usehooks-ts'

// ── Constants ────────────────────────────────────────────────────────────────
const AUTO_SAVE_DEBOUNCE_MS = 1000

interface ProjectPageInnerProps {
  templateId: string
  initialData: AnyAppData
  filePath: string
  projectDir: string
  isTemporary: boolean
  projectData: ProjectFile
  invalidateProject: (filePath: string) => void
}

function ProjectPageInner({
  templateId,
  initialData: staticInitialData,
  filePath,
  projectDir,
  isTemporary: initialIsTemporary,
  projectData,
  invalidateProject
}: ProjectPageInnerProps): JSX.Element {
  const navigate = useNavigate()
  const { resolved, projectSettings, setProjectSettings } = useSettings()
  const manager = useTemplateManager()
  const addRecentProject = useSettingsStore((s) => s.addRecentProject)

  // Split project state: meta (file location, name) is separate from app data (game content)
  const [meta, setMeta] = useState<ProjectMeta | null>({
    filePath,
    projectDir,
    templateId: projectData.templateId,
    name: projectData.name,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,
    settings: projectData.settings,
    isTemporary: initialIsTemporary
  })
  const [isDirty, setIsDirty] = useState(false)

  const {
    present: appData,
    setPresent,
    undo: historyUndo,
    redo: historyRedo,
    getHistory,
    canUndo,
    canRedo
  } = useProjectHistory()
  // Reference to wrapped editor instance for imperative getValue/setValue

  // Snackbar hook
  const { message: snackMsg, severity: snackSeverity, showSnack, hideSnack } = useSnackbar()

  // Update window title whenever meta or appData changes
  const documentTitle = useMemo(() => {
    if (!meta || !templateId) return 'Loading project'
    const template = manager.getTemplate(templateId)
    const tName = template?.name ?? templateId
    const title = buildProjectTitle(tName, meta.name, meta.filePath)
    return title
    // document.title = title
    // window.electronAPI.setTitle(title)
  }, [meta, templateId, manager])
  useAppDocumentTitle(documentTitle)

  // Wrapped undo/redo that marks document as dirty
  const editorWrapperRef = useRef<EditorWrapperHandle>(null)
  // Expose a typed handle for Get/Set value on the wrapped editor
  // The Editor component (wrapped) will forward its ref here when mounted
  const handleUndo = useCallback(() => {
    const current = editorWrapperRef.current?.getValue?.()
    if (current) {
      setPresent(current as AnyAppData)
    }
    historyUndo()
    setIsDirty(true)
  }, [historyUndo, setPresent])

  const handleRedo = useCallback(() => {
    historyRedo()
    setIsDirty(true)
  }, [historyRedo])

  // Sync project settings to context
  useEffect(() => {
    setProjectSettings(projectData.settings ?? null)
    return () => setProjectSettings(null)
  }, [projectData.settings, setProjectSettings])

  // Track previous projectSettings to detect changes
  const [prevProjectSettings, setPrevProjectSettings] = useState(projectSettings)

  // Sync project settings from context to meta (for saving)
  // Only update meta when projectSettings change, not vice versa
  if (prevProjectSettings !== projectSettings) {
    setPrevProjectSettings(projectSettings)
    setMeta((prev) => {
      if (!prev) return prev
      if (prev.settings === projectSettings) return prev
      setIsDirty(true)
      return { ...prev, settings: projectSettings }
    })
  }

  // UI state
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const renameOpen = useBoolean(false)
  const [renameValue, setRenameValue] = useState('')
  const backConfirm = useBoolean(false)
  const settingsOpen = useBoolean(false)
  const [saveAsConfirmFolder, setSaveAsConfirmFolder] = useState<string | null>(null)

  // ── Refs for auto-save ─────────────────────────────────────────────────────
  const onEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metaRef = useRef(meta)
  const appDataRef = useRef(appData)
  const isDirtyRef = useRef(isDirty)

  // Keep refs in sync - update synchronously to avoid stale closures
  useEffect(() => {
    metaRef.current = meta
    appDataRef.current = appData
    isDirtyRef.current = isDirty
  }, [meta, appData, isDirty])

  // Keep Editor in sync with current appData present (initial data is static)
  useEffect(() => {
    if (editorWrapperRef.current) {
      const current = editorWrapperRef.current.getValue()
      if (!isDeepEqual(current, appData)) {
        editorWrapperRef.current.setValue(appData as AnyAppData)
      }
    }
  }, [appData])

  // ── Save ─────────────────────────────────────────────────────────────────
  const doSave = useCallback(
    async (currentMeta: ProjectMeta, appDataToSave?: AnyAppData) => {
      const dataToSave = appDataToSave ?? appDataRef.current
      if (!dataToSave) return
      const file = buildProjectFile(currentMeta, dataToSave)
      const history = getHistoryArray(getHistory())
      await window.electronAPI.saveProject(file, currentMeta.filePath, history)
      setIsDirty(false)
      // Invalidate query cache after save
      invalidateProject(currentMeta.filePath)
    },
    [getHistory, invalidateProject]
  )

  const performSaveAs = useCallback(
    async (folder: string): Promise<void> => {
      const currentMeta = metaRef.current
      const currentAppData = appDataRef.current
      if (!currentMeta || !currentAppData) return
      try {
        const history = getHistoryArray(getHistory())
        const newLoc = await window.electronAPI.doSaveAs({
          projectData: buildProjectFile(currentMeta, currentAppData),
          oldProjectDir: currentMeta.projectDir,
          newFolder: folder,
          history
        })

        // Invalidate old query
        invalidateProject(currentMeta.filePath)

        // Update meta and clear isTemporary flag
        setMeta((prev) =>
          prev
            ? {
                ...prev,
                filePath: newLoc.filePath,
                projectDir: newLoc.projectDir,
                isTemporary: false
              }
            : prev
        )

        // Navigate to new URL with updated projectDir
        navigate(
          `/project/${currentMeta.templateId}?filePath=${encodeURIComponent(newLoc.filePath)}&projectDir=${encodeURIComponent(newLoc.projectDir)}`,
          { replace: true }
        )

        // Add new project to recent projects list (treat like a new save)
        const template = manager.getTemplate(currentMeta.templateId)
        await addRecentProject({
          filePath: newLoc.filePath,
          projectDir: newLoc.projectDir,
          templateId: currentMeta.templateId,
          templateName: template?.name ?? currentMeta.templateId,
          projectName: currentMeta.name,
          lastOpened: new Date().toISOString()
        })

        setIsDirty(false)
        setSaveAsConfirmFolder(null)
        showSnack(`Saved to: ${newLoc.projectDir}`)
      } catch (e) {
        showSnack(`Save As failed: ${e}`, 'error')
      }
    },
    [getHistory, showSnack, addRecentProject, manager, invalidateProject, navigate]
  )

  // ── Auto-save: interval mode ───────────────────────────────────────────────
  // Use useInterval hook for cleaner interval management with automatic cleanup
  useInterval(
    () => {
      if (isDirtyRef.current && metaRef.current) {
        doSave(metaRef.current, appDataRef.current).catch(() => {
          // Silently fail - user will see dirty indicator
        })
      }
    },
    resolved.autoSave.mode === 'interval' ? resolved.autoSave.intervalSeconds * 1000 : null
  )

  // ── Auto-save: on-edit mode cleanup ────────────────────────────────────────
  // Use useUnmount for cleanup-only effect (clearer intent than useEffect with empty deps)
  useUnmount(() => {
    if (onEditTimerRef.current) {
      clearTimeout(onEditTimerRef.current)
      onEditTimerRef.current = null
    }
  })

  // ── App data commit (from editor) ─────────────────────────────────────────
  const handleEditorCommit = useCallback(
    (newData: AnyAppData) => {
      // Update history state (for undo/redo)
      setPresent(newData)

      // Update dirty state
      setIsDirty(true)

      // Update refs for auto-save
      appDataRef.current = newData
      isDirtyRef.current = true

      // Auto-save on edit with debounce
      if (resolved.autoSave.mode === 'on-edit') {
        if (onEditTimerRef.current) clearTimeout(onEditTimerRef.current)
        onEditTimerRef.current = setTimeout(() => {
          if (metaRef.current) {
            doSave(metaRef.current, newData).catch(() => {
              // Silently fail - user will see dirty indicator
            })
          }
        }, AUTO_SAVE_DEBOUNCE_MS)
      }
    },
    [setPresent, resolved.autoSave.mode, doSave]
  )

  // ── Save As ───────────────────────────────────────────────────────────────
  const handleSaveAs = useCallback(async (): Promise<void> => {
    if (!metaRef.current) return
    const result = await window.electronAPI.saveProjectAs({
      projectData: buildProjectFile(metaRef.current, appDataRef.current!),
      oldProjectDir: metaRef.current.projectDir
    })
    if (!result) return
    if (result.status === 'has-project' || result.status === 'non-empty') {
      setSaveAsConfirmFolder(result.status === 'has-project' ? result.folder : null)
      if (result.status === 'non-empty') {
        showSnack('That folder already has files — choose an empty one.', 'info')
        return
      }
    }
    await performSaveAs(result.folder)
  }, [showSnack, performSaveAs])

  const handleSave = useCallback(async (): Promise<void> => {
    const currentMeta = metaRef.current
    if (!currentMeta) return

    // If temporary, trigger save-as instead
    if (currentMeta.isTemporary) {
      await handleSaveAs()
      return
    }

    try {
      const current = editorWrapperRef.current?.getValue?.() ?? appDataRef.current
      await doSave(currentMeta, current!)
      showSnack('Project saved!')
    } catch (e) {
      showSnack(`Save failed: ${e}`, 'error')
    }
  }, [doSave, showSnack, handleSaveAs])

  // ── Export / Preview ───────────────────────────────────────────────────────
  const handleExport = async (mode: 'folder' | 'zip'): Promise<void> => {
    setExportAnchor(null)
    const currentMeta = metaRef.current
    if (!currentMeta) return
    try {
      const current = editorWrapperRef.current?.getValue?.() ?? appDataRef.current
      const result = await window.electronAPI.exportProject({
        templateId: currentMeta.templateId,
        appData: current!,
        projectDir: currentMeta.projectDir,
        mode
      })
      if (result.canceled) return
      showSnack(`Exported to: ${result.path}`)
    } catch (e) {
      showSnack(`Export failed: ${e}`, 'error')
    }
  }

  const handlePreview = async (): Promise<void> => {
    const currentMeta = metaRef.current
    if (!currentMeta) return
    try {
      const current = editorWrapperRef.current?.getValue?.() ?? appDataRef.current
      await window.electronAPI.previewProject({
        templateId: currentMeta.templateId,
        appData: current!,
        projectDir: currentMeta.projectDir
      })
      showSnack('Preview opened')
    } catch (e) {
      showSnack(`Preview failed: ${e}`, 'error')
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  const handleRename = async (): Promise<void> => {
    const currentMeta = metaRef.current
    if (!currentMeta || !renameValue.trim()) return
    const updated = { ...currentMeta, name: renameValue.trim() }
    setMeta(updated)
    setIsDirty(true)
    renameOpen.setFalse()
    try {
      const current = editorWrapperRef.current?.getValue?.() ?? appDataRef.current
      await doSave(updated, current!)
    } catch (e) {
      setMeta(currentMeta)
      showSnack(`Rename failed: ${e}`, 'error')
      throw e
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useProjectShortcuts({
    onUndo: canUndo ? handleUndo : undefined,
    onRedo: canRedo ? handleRedo : undefined,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPreview: handlePreview,
    onExportFolder: () => handleExport('folder'),
    onExportZip: () => handleExport('zip')
  })

  if (!meta || !templateId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data. Go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  const template = manager.getTemplate(templateId)
  const templateName = template?.name ?? templateId
  const autoSaveLabel =
    resolved.autoSave.mode === 'off'
      ? null
      : resolved.autoSave.mode === 'on-edit'
        ? 'auto-save: on edit'
        : `auto-save: ${resolved.autoSave.intervalSeconds}s`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <ProjectToolbar
        templateName={templateName}
        projectName={meta.name}
        isDirty={isDirty}
        autoSaveLabel={autoSaveLabel}
        canUndo={canUndo}
        canRedo={canRedo}
        onBack={() => (isDirty ? backConfirm.setTrue() : navigate('/'))}
        onRename={() => {
          setRenameValue(meta.name)
          renameOpen.setTrue()
        }}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPreview={handlePreview}
        onExport={(e) => setExportAnchor(e.currentTarget)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        renderMoreActions={() => (
          <MoreActionsMenu
            pathToOpen={meta.projectDir}
            onOpenSettings={() => settingsOpen.setTrue()}
          />
        )}
      />

      {/* ── Editor ── */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {(() => {
          const entry = manager.getRegistryEntry(templateId)
          if (!entry)
            return (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error">
                  No editor registered for game type: {templateId}
                </Typography>
              </Box>
            )

          return (
            <EditorWithMemo
              entry={entry}
              initialData={staticInitialData}
              projectDir={meta.projectDir}
              handleEditorCommit={handleEditorCommit}
              editorWrapperRef={editorWrapperRef}
            />
          )
        })()}
      </Box>

      {/* ── Settings panel ── */}
      <SettingsPanel open={settingsOpen.value} onClose={settingsOpen.setFalse} hasProject />

      {/* ── Export menu ── */}
      <ExportMenu
        anchorEl={exportAnchor}
        onClose={() => setExportAnchor(null)}
        onExport={handleExport}
      />

      {/* ── Save As overwrite confirm ── */}
      <SaveAsConfirmDialog
        open={!!saveAsConfirmFolder}
        onClose={() => setSaveAsConfirmFolder(null)}
        onConfirm={() => {
          const f = saveAsConfirmFolder!
          setSaveAsConfirmFolder(null)
          performSaveAs(f)
        }}
      />

      {/* ── Rename dialog ── */}
      <RenameDialog
        open={renameOpen.value}
        onClose={renameOpen.setFalse}
        currentValue={renameValue}
        onChange={setRenameValue}
        onConfirm={handleRename}
      />

      {/* ── Back confirm ── */}
      <BackConfirmDialog
        open={backConfirm.value}
        onClose={backConfirm.setFalse}
        onDiscard={() => {
          backConfirm.setFalse()
          navigate('/')
        }}
        onSaveAndLeave={async () => {
          backConfirm.setFalse()
          await handleSave()
          navigate('/')
        }}
      />

      {/* ── Snackbar ── */}
      <ProjectSnackbar message={snackMsg} severity={snackSeverity} onClose={hideSnack} />
    </Box>
  )
}

// ── Main Component (wraps with Provider) ─────────────────────────────────────
export default function ProjectPage(): JSX.Element {
  const { templateId } = useParams<{ templateId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const filePath = searchParams.get('filePath')
  const projectDir = searchParams.get('projectDir')
  const isTemporary = searchParams.get('isTemporary') === 'true'

  if (!templateId || !filePath || !projectDir) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data. Go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  return (
    <ProjectPageContent
      templateId={templateId}
      filePath={filePath}
      projectDir={projectDir}
      isTemporary={isTemporary}
    />
  )
}

function ProjectPageContent({
  templateId,
  filePath,
  projectDir,
  isTemporary
}: {
  templateId: string
  filePath: string
  projectDir: string
  isTemporary: boolean
}): JSX.Element {
  const invalidateProject = useInvalidateProjectFile()

  // Use suspense query to load project data
  const { data: projectData } = useProjectFile(filePath)

  const manager = useTemplateManager()

  const initialData = useMemo(() => {
    const rawData = projectData?.appData ?? ({} as AnyAppData)
    return manager.normalize(templateId, rawData)
  }, [projectData, templateId, manager])

  // Invalidate query on unmount (project closed)
  useUnmount(() => {
    invalidateProject(filePath)
  })

  return (
    <ProjectHistoryProvider initialState={initialData}>
      <ProjectPageInner
        templateId={templateId}
        initialData={initialData}
        filePath={filePath}
        projectDir={projectDir}
        isTemporary={isTemporary}
        projectData={projectData}
        invalidateProject={invalidateProject}
      />
    </ProjectHistoryProvider>
  )
}

// ── Memoized Editor Dispatch ────────────────────────────────────────────────
/**
 * Helper to render the memoized editor.
 * This is separate to allow React.memo to work on the dynamic registry entry.
 */
// Using ComponentType<any> here is a controlled 'loose' cast for the dynamic dispatch.
// Since TemplateManager.normalize ensures the data is correct for this specific Editor,
// it is safe at runtime and satisfies the heterogeneous registry lookup.
const EditorWithMemo = React.memo(
  ({ entry, initialData, projectDir, handleEditorCommit, editorWrapperRef }: any) => {
    const Editor = entry.Editor as React.ComponentType<any>
    return (
      <Editor
        ref={editorWrapperRef}
        initialData={initialData}
        projectDir={projectDir}
        onCommit={handleEditorCommit}
      />
    )
  }
)
EditorWithMemo.displayName = 'EditorWithMemo'
