import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import PublicIcon from '@mui/icons-material/Public'
import {
  Box,
  Chip,
  FormControlLabel,
  Slider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import React from 'react'
import { AutoSaveMode, ProjectSettings } from '../../types'

// ── Section Header ─────────────────────────────────────────────────────────────
export interface SectionHeaderProps {
  icon: React.ReactNode
  label: string
  subtitle?: string
}

export function SectionHeader({ icon, label, subtitle }: SectionHeaderProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2.5,
        pt: 2.5,
        pb: 0.5
      }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, fontSize: '0.65rem', color: 'primary.main', lineHeight: 1.2 }}
        >
          {label}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', fontSize: '0.7rem' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ── Override Row ───────────────────────────────────────────────────────────────
export interface OverrideRowProps {
  label: string
  active: boolean
  effectiveLabel: string
  onEnable: () => void
  onDisable: () => void
  children?: React.ReactNode
}

export function OverrideRow({
  label,
  active,
  effectiveLabel,
  onEnable,
  onDisable,
  children
}: OverrideRowProps): React.ReactElement {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: active ? 1.5 : 0 }}>
        <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
          {label}
        </Typography>
        {!active && (
          <Tooltip title="Using global value">
            <Chip
              label={`Global · ${effectiveLabel}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', cursor: 'default' }}
            />
          </Tooltip>
        )}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={active}
              onChange={(_, checked) => (checked ? onEnable() : onDisable())}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Override
            </Typography>
          }
          labelPlacement="start"
          sx={{ m: 0, gap: 0.5 }}
        />
      </Box>
      {children}
    </Box>
  )
}

// ── Auto Save Setting ──────────────────────────────────────────────────────────
export interface AutoSaveSettingProps {
  mode: AutoSaveMode
  intervalSec: number
  onModeChange: (m: AutoSaveMode) => void
  onIntervalChange: (s: number) => void
}

export function AutoSaveSetting({
  mode,
  intervalSec,
  onModeChange,
  onIntervalChange
}: AutoSaveSettingProps): React.ReactElement {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        Auto-save
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && onModeChange(v as AutoSaveMode)}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            py: 0.5,
            px: 1.5,
            fontSize: '0.75rem',
            textTransform: 'none'
          }
        }}
      >
        <ToggleButton value="off">Off</ToggleButton>
        <ToggleButton value="on-edit">On edit</ToggleButton>
        <ToggleButton value="interval">Every N seconds</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'interval' && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Interval: {intervalSec}s
          </Typography>
          <Slider
            min={5}
            max={300}
            step={5}
            value={intervalSec}
            onChange={(_, v) => onIntervalChange(v as number)}
            marks={[
              { value: 5, label: '5s' },
              { value: 60, label: '60s' },
              { value: 300, label: '5m' }
            ]}
            sx={{ mt: 1 }}
          />
        </Box>
      )}
    </Box>
  )
}

// ── Prefill Setting ────────────────────────────────────────────────────────────
export interface PrefillSettingProps {
  value: boolean
  onChange: (v: boolean) => void
}

export function PrefillSetting({ value, onChange }: PrefillSettingProps): React.ReactElement {
  return (
    <FormControlLabel
      control={<Switch size="small" checked={value} onChange={(_, checked) => onChange(checked)} />}
      label={
        <Box>
          <Typography variant="body2">Prefill names</Typography>
          <Typography variant="caption" color="text.secondary">
            New groups/items get a default name like &quot;Group 1&quot;
          </Typography>
        </Box>
      }
      sx={{ alignItems: 'flex-start', mx: 0, gap: 1 }}
    />
  )
}

// ── Global Settings Section ────────────────────────────────────────────────────
export interface GlobalSettingsSectionProps {
  mode: AutoSaveMode
  intervalSec: number
  prefillNames: boolean
  onModeChange: (m: AutoSaveMode) => void
  onIntervalChange: (s: number) => void
  onPrefillChange: (v: boolean) => void
}

export function GlobalSettingsSection({
  mode,
  intervalSec,
  prefillNames,
  onModeChange,
  onIntervalChange,
  onPrefillChange
}: GlobalSettingsSectionProps): React.ReactElement {
  return (
    <>
      <SectionHeader icon={<PublicIcon fontSize="small" />} label="Global" />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AutoSaveSetting
          mode={mode}
          intervalSec={intervalSec}
          onModeChange={onModeChange}
          onIntervalChange={onIntervalChange}
        />
        <PrefillSetting value={prefillNames} onChange={onPrefillChange} />
      </Box>
    </>
  )
}

// ── Project Override Section ───────────────────────────────────────────────────
export interface ProjectOverrideSectionProps {
  projectSettings: ProjectSettings | null
  globalMode: AutoSaveMode
  globalIntervalSec: number
  globalPrefillNames: boolean
  resolvedMode: AutoSaveMode
  resolvedPrefillNames: boolean
  onModeChange: (m: AutoSaveMode) => void
  onIntervalChange: (s: number) => void
  onPrefillChange: (v: boolean) => void
  onEnableAutoSaveOverride: () => void
  onDisableAutoSaveOverride: () => void
  onEnablePrefillOverride: () => void
  onDisablePrefillOverride: () => void
}

export function ProjectOverrideSection({
  projectSettings,
  globalMode,
  globalIntervalSec,
  globalPrefillNames,
  resolvedMode,
  resolvedPrefillNames,
  onModeChange,
  onIntervalChange,
  onPrefillChange,
  onEnableAutoSaveOverride,
  onDisableAutoSaveOverride,
  onEnablePrefillOverride,
  onDisablePrefillOverride
}: ProjectOverrideSectionProps): React.ReactElement {
  const projOverride = (key: keyof ProjectSettings): boolean => {
    if (!projectSettings) return false
    if (key === 'autoSave') return projectSettings.autoSave != null
    if (key === 'prefillNames') return projectSettings.prefillNames != null
    return false
  }

  const autoSaveModeLabel = (mode: AutoSaveMode): string => {
    if (mode === 'off') return 'Off'
    if (mode === 'on-edit') return 'On edit'
    return 'Interval'
  }

  return (
    <>
      <SectionHeader
        icon={<FolderSpecialIcon fontSize="small" />}
        label="This project"
        subtitle="Overrides global settings for this project only"
      />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <OverrideRow
          label="Auto-save"
          active={projOverride('autoSave')}
          effectiveLabel={autoSaveModeLabel(resolvedMode)}
          onEnable={onEnableAutoSaveOverride}
          onDisable={onDisableAutoSaveOverride}
        >
          {projOverride('autoSave') && (
            <AutoSaveSetting
              mode={projectSettings?.autoSave?.mode ?? globalMode}
              intervalSec={projectSettings?.autoSave?.intervalSeconds ?? globalIntervalSec}
              onModeChange={onModeChange}
              onIntervalChange={onIntervalChange}
            />
          )}
        </OverrideRow>

        <OverrideRow
          label="Prefill names"
          active={projOverride('prefillNames')}
          effectiveLabel={resolvedPrefillNames ? 'On' : 'Off'}
          onEnable={onEnablePrefillOverride}
          onDisable={onDisablePrefillOverride}
        >
          {projOverride('prefillNames') && (
            <PrefillSetting
              value={projectSettings?.prefillNames ?? globalPrefillNames}
              onChange={onPrefillChange}
            />
          )}
        </OverrideRow>
      </Box>
    </>
  )
}
