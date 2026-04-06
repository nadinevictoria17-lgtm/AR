import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FirebaseAuthProvider } from './lib/firebaseAuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppStore } from './store/useAppStore'
import { PageSkeleton } from './components/ui/skeleton'
import { TeacherRoute, StudentRoute, PublicOnlyRoute } from './components/auth/RouteGuards'

// ── Lazy-loaded pages & screens ──────────────────────────────────────────────
const LoginPage   = lazy(() => import('./pages/LoginPage'))
const AppPage     = lazy(() => import('./pages/AppPage'))
const TeacherPage = lazy(() =>
  import('./pages/TeacherPage').then(m => ({ default: m.TeacherPage }))
)

// Student Screens
const GetStartedScreen = lazy(() =>
  import('./components/student/screens/GetStartedScreen').then(m => ({ default: m.GetStartedScreen }))
)
const HomeScreen = lazy(() =>
  import('./components/student/screens/HomeScreen').then(m => ({ default: m.HomeScreen }))
)
const UnlockScreen = lazy(() =>
  import('./components/student/screens/UnlockScreen').then(m => ({ default: m.UnlockScreen }))
)
const LearnScreen = lazy(() =>
  import('./components/student/screens/LearnScreen').then(m => ({ default: m.LearnScreen }))
)
const ARLabScreen = lazy(() =>
  import('./components/student/screens/ARLabScreen').then(m => ({ default: m.ARLabScreen }))
)
const QuizScreen = lazy(() =>
  import('./components/student/screens/QuizScreen').then(m => ({ default: m.QuizScreen }))
)
const ProgressScreen = lazy(() =>
  import('./components/student/screens/ProgressScreen').then(m => ({ default: m.ProgressScreen }))
)

// Teacher Tabs
const AnalyticsDashboard = lazy(() =>
  import('./components/teacher/tabs/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard }))
)
const QuizzesTab = lazy(() =>
  import('./components/teacher/tabs/QuizzesTab').then(m => ({ default: m.QuizzesTab }))
)
const LessonsTab = lazy(() =>
  import('./components/teacher/tabs/LessonsTab').then(m => ({ default: m.LessonsTab }))
)
const StudentsTab = lazy(() =>
  import('./components/teacher/tabs/StudentsTab').then(m => ({ default: m.StudentsTab }))
)
const UnlockCodesTab = lazy(() =>
  import('./components/teacher/tabs/UnlockCodesTab').then(m => ({ default: m.UnlockCodesTab }))
)

export default function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <ErrorBoundary>
      <FirebaseAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public — redirect away if already authenticated */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Student Routes — require Firebase student session */}
              <Route element={<StudentRoute />}>
                <Route path="/app" element={<AppPage />}>
                  <Route index element={<Navigate to="/app/home" replace />} />
                  <Route path="home"       element={<HomeScreen />} />
                  <Route path="unlock"     element={<UnlockScreen />} />
                  <Route path="learn"      element={<LearnScreen />} />
                  <Route path="arlab"      element={<ARLabScreen />} />
                  <Route path="quiz"       element={<QuizScreen />} />
                  <Route path="progress"   element={<ProgressScreen />} />
                  <Route path="getstarted" element={<GetStartedScreen />} />
                </Route>
              </Route>

              {/* Teacher Routes — require Firebase teacher session */}
              <Route element={<TeacherRoute />}>
                <Route path="/teacher" element={<TeacherPage />}>
                  <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                  <Route path="dashboard" element={<AnalyticsDashboard />} />
                  <Route path="quizzes"   element={<QuizzesTab />} />
                  <Route path="lessons"   element={<LessonsTab />} />
                  <Route path="students"  element={<StudentsTab />} />
                  <Route path="codes"     element={<UnlockCodesTab />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FirebaseAuthProvider>
    </ErrorBoundary>
  )
}
