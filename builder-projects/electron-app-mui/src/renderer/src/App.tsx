import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { SettingsProvider } from './context/SettingsContext'
import { usePrefetchTemplates } from './hooks/useTemplates'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 // Keep in memory for 1 hour
    }
  }
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
        <AppContent />
      </SettingsProvider>
    </QueryClientProvider>
  )
}

// This component only "exists" once Suspense is finished
function SplashKiller() {
  // Remove splash screen after first React paint
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('hiding')
    const t = setTimeout(() => splash.remove(), 400)
    return () => clearTimeout(t)
  }, [])

  return null
}
