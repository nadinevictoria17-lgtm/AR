import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'

// Pages
import LoginPage from './pages/LoginPage'
import AppPage from './pages/AppPage'
import { TeacherPage } from './pages/TeacherPage'

export default function App() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
