import AppShell from '@renderer/components/AppShell'
import { SettingsProvider } from '@renderer/context/SettingsContext'
import { usePrefetchTemplates } from '@renderer/hooks/useTemplates'
import HomePage from '@renderer/pages/HomePage'
import ProjectPage from '@renderer/pages/ProjectPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHead, UnheadProvider } from '@unhead/react/client'
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 // Keep in memory for 1 hour
    }
  }
})

// Create Unhead instance with global title template
const head = createHead({
  init: [
    {
      titleTemplate: '%s | Minigame Builder'
    }
  ]
})

function AppContent(): React.ReactElement {
  // Prefetch templates on boot - loads before first render
  usePrefetchTemplates()

  return (
    <HashRouter>
      <Suspense fallback={null}>
        <SplashKiller />
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:templateId" element={<ProjectPage />} />
          </Routes>
        </AppShell>
      </Suspense>
    </HashRouter>
  )
}

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <UnheadProvider head={head}>
          <AppContent />
        </UnheadProvider>
      </SettingsProvider>
    </QueryClientProvider>
  )
}

// This component only "exists" once Suspense is finished
function SplashKiller(): null {
  // Remove splash screen after first React paint
  useEffect(() => {
    const splash = document.getElementById('splash')

    // Cast to a generic object structure to check for the property
    const splashObj = splash as unknown as Record<string, unknown>

    if (splashObj && typeof splashObj.hide === 'function') {
      // We still need to cast to Function to call it
      ;(splashObj.hide as () => void)()
    }

    const t = setTimeout(() => splash?.remove(), 400)
    return () => clearTimeout(t)
  }, [])

  return null
}
