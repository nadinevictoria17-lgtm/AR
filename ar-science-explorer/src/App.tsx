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
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <ErrorBoundary>
      <FirebaseAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — redirect away if already authenticated. Top-level pages
                (not yet inside a persistent layout) still suspend individually. */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Suspense fallback={<PageSkeleton />}><LoginPage /></Suspense>} />
            </Route>

            {/* Student Routes — require Firebase student session.
                The bare "/app" index redirect is now a SIBLING of the AppPage
                layout route, not a child of it. Previously it lived inside
                AppPage's Outlet, which meant every login/landing on "/app"
                mounted AppPage (and its AnimatePresence) for the index route,
                then immediately re-keyed to "/app/home" — an invisible
                mount-then-transition cycle stacked in front of the real
                page-swap animation. This was the actual "double load" bug;
                it never showed up in per-screen fixes because it lives in
                the route tree, not in any single screen's motion code.
                AppPage itself loads once behind this outer Suspense; the inner
                per-screen Suspense (around <Outlet/> inside AppPage.tsx) is what
                actually catches each lazy screen chunk, so switching between
                student screens never unmounts the sidebar/layout or interrupts
                the page-transition animation with a fallback flash. */}
            <Route element={<StudentRoute />}>
              <Route path="/app">
                <Route index element={<Navigate to="/app/home" replace />} />
                <Route element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AppPage />
                  </Suspense>
                }>
                  <Route path="home"       element={<HomeScreen />} />
                  <Route path="unlock"     element={<UnlockScreen />} />
                  <Route path="learn"      element={<LearnScreen />} />
                  <Route path="arlab"      element={<ARLabScreen />} />
                  <Route path="quiz"       element={<QuizScreen />} />
                  <Route path="progress"   element={<ProgressScreen />} />
                  <Route path="getstarted" element={<GetStartedScreen />} />
                </Route>
              </Route>
            </Route>

            {/* Teacher Routes — require Firebase teacher session.
                Same fix applied here for consistency, even though TeacherPage
                has no page-transition animation to double: it still avoided
                a pointless mount-then-redirect of TeacherPage/Suspense. */}
            <Route element={<TeacherRoute />}>
              <Route path="/teacher">
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route element={
                  <Suspense fallback={<PageSkeleton />}>
                    <TeacherPage />
                  </Suspense>
                }>
                  <Route path="dashboard" element={<AnalyticsDashboard />} />
                  <Route path="quizzes"   element={<QuizzesTab />} />
                  <Route path="lessons"   element={<LessonsTab />} />
                  <Route path="students"  element={<StudentsTab />} />
                  <Route path="codes"     element={<UnlockCodesTab />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </FirebaseAuthProvider>
    </ErrorBoundary>
  )
}
