import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FirebaseAuthProvider } from './lib/firebaseAuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppStore } from './store/useAppStore'

// Pages
import LoginPage from './pages/LoginPage'
import AppPage from './pages/AppPage'
import { TeacherPage } from './pages/TeacherPage'

// Student Screens
import { GetStartedScreen } from './components/student/screens/GetStartedScreen'
import { HomeScreen } from './components/student/screens/HomeScreen'
import { UnlockScreen } from './components/student/screens/UnlockScreen'
import { LearnScreen } from './components/student/screens/LearnScreen'
import { ARLabScreen } from './components/student/screens/ARLabScreen'
import { QuizScreen } from './components/student/screens/QuizScreen'
import { ProgressScreen } from './components/student/screens/ProgressScreen'

// Teacher Tabs
import { AnalyticsDashboard } from './components/teacher/tabs/AnalyticsDashboard'
import { QuizzesTab } from './components/teacher/tabs/QuizzesTab'
import { LessonsTab } from './components/teacher/tabs/LessonsTab'
import { StudentsTab } from './components/teacher/tabs/StudentsTab'
import { UnlockCodesTab } from './components/teacher/tabs/UnlockCodesTab'

export default function App() {
  const { theme } = useAppStore()

  // Apply persisted theme to DOM on mount
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <ErrorBoundary>
      <FirebaseAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Student Routes */}
            <Route path="/app" element={<AppPage />}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<HomeScreen />} />
              <Route path="unlock" element={<UnlockScreen />} />
              <Route path="learn" element={<LearnScreen />} />
              <Route path="arlab" element={<ARLabScreen />} />
              <Route path="quiz" element={<QuizScreen />} />
              <Route path="progress" element={<ProgressScreen />} />
              <Route path="getstarted" element={<GetStartedScreen />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherPage />}>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<AnalyticsDashboard />} />
              <Route path="quizzes" element={<QuizzesTab />} />
              <Route path="lessons" element={<LessonsTab />} />
              <Route path="students" element={<StudentsTab />} />
              <Route path="codes" element={<UnlockCodesTab />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </FirebaseAuthProvider>
    </ErrorBoundary>
  )
}
