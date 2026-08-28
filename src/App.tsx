import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { OfflineBanner } from './components/OfflineBanner'
import { LogPage } from './pages/LogPage'
import { HistoryPage } from './pages/HistoryPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { ExercisePage } from './pages/ExercisePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
})

const tabs = [
  { to: '/', label: 'Log' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/history', label: 'History' },
]

function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex-1 py-3.5 text-center text-sm font-medium ${
                isActive ? 'text-blue-400' : 'text-zinc-500'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <AuthGate>
        <BrowserRouter>
          <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
            <Routes>
              <Route path="/" element={<LogPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercise/:id" element={<ExercisePage />} />
            </Routes>
          </div>
          <TabBar />
        </BrowserRouter>
      </AuthGate>
    </QueryClientProvider>
  )
}
