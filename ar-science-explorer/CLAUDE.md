# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
# Install dependencies (required after cloning or updating packages)
npm install

# Development server (http://localhost:5173)
npm run dev

# Build for production (runs tsc check + vite build)
npm run build

# Lint with ESLint (zero warnings policy)
npm run lint
```

**Important:** The `.env.local` file is required and must not be committed. It contains Firebase configuration. Each developer needs their own copy with proper Firebase credentials.

## Project Overview

**AR Science Explorer** is a React + TypeScript web application for an augmented reality science learning platform. It serves two user types:
- **Students**: Access lessons, AR labs, quizzes, and track progress
- **Teachers**: Create quizzes, manage lessons, view student analytics, generate unlock codes

## Architecture

### Routing & Authentication
- **Router**: React Router with role-based route guards
- **Auth**: Firebase Auth with `FirebaseAuthProvider` context (src/lib/firebaseAuthContext.tsx)
- **Route Guards** (src/components/auth/RouteGuards.tsx):
  - `PublicOnlyRoute` - login page (redirect if authenticated)
  - `StudentRoute` - requires Firebase student session (@arscience.school email)
  - `TeacherRoute` - requires teacher role
  - All unmatched routes redirect to `/login`

### State Management
- **Zustand stores** with localStorage persistence:
  - `useAppStore` - app-wide state (current student, active subject, theme, unlock status, AR model index)
  - `useQuizStore` - quiz attempt state
  - `useNotificationStore` - toast notifications
- **Persisted state** in `useAppStore`: unlocked subjects, voice language, theme
- **Session state** (not persisted): current screens, active content selections

### Data Layer
- **Firestore collections**:
  - `/students/{studentId}` - student metadata
  - `/students/{studentId}/quizAttempts/{attemptId}` - quiz attempt records
  - `/quizzes/{quizId}` - teacher-created quizzes
  - `/lessons/{lessonId}` - teacher-created lessons
  - `/quizUnlockCodes/{codeId}` - unlock codes for content
- **Local Storage**: Theme, language, unlocked subjects (via Zustand persistence)
- **Static Data** (src/data/): curriculum, lessons, quiz templates, AR models, voice scripts

### Component Organization
- **src/pages** - Top-level page components (LoginPage, AppPage, TeacherPage)
- **src/components/student/screens** - Student-facing screens (HomeScreen, QuizScreen, ARLabScreen, ProgressScreen, etc.)
- **src/components/teacher/tabs** - Teacher dashboard tabs (AnalyticsDashboard, StudentsTab, LessonsTab, etc.)
- **src/components/ui** - Reusable UI components (button, card, input, badge, skeleton, etc.)
- **src/components/auth** - Auth-related components (RouteGuards, CredentialField)
- **src/components/form** - Form utilities (FormInput, FormTextarea)
- **src/components/layout** - Sidebar and layout components (StudentSidebar, TeacherSidebar)

## Key Patterns & Conventions

### Firebase Integration
- Firebase config loaded from `.env.local` via Vite's `import.meta.env`
- Two auth instances: primary for current session, secondary for teacher creating student accounts (prevents signing out teacher)
- Auth state managed via `firebaseOnAuthStateChanged` listener in context provider

### Content Unlock System
- Access codes unlock subjects or individual lessons
- Unlock codes stored in Firestore, managed by UnlockCodeManager
- Can be subject-wide or lesson-specific (targetId)
- Quiz retakes unlocked separately via `markQuizAsRetakeable`

### Theme Management
- Zustand store persists light/dark preference
- Applied synchronously in `main.tsx` before React render (prevents flash)
- Updates document className, observed by Tailwind dark: selector

### Lazy Loading & Performance
- Routes and screens lazy-loaded with React.lazy()
- `PageSkeleton` component used as Suspense fallback
- Quiz attempt data deferred-loaded via `useDeferredLoading` hook
- AR model images lazy-loaded

### Type Safety
- Centralized types in `src/types/index.ts`
- Key types: `SubjectKey` (union of subjects), `ARPayload`, `StudentRecord`, `TeacherQuiz`, `QuizAttempt`
- TypeScript strict mode enabled

## Common Development Tasks

### Adding a New Student Screen
1. Create component in `src/components/student/screens/YourScreen.tsx`
2. Lazy-load it in `App.tsx`
3. Add route under the `<StudentRoute>` in AppPage
4. Use `useAppStore` to manage screen state if needed

### Creating a Teacher Feature
1. Create tab component in `src/components/teacher/tabs/YourTab.tsx`
2. Lazy-load and add route under `<TeacherRoute>` in App.tsx
3. Fetch/mutate Firestore data via `storage` object in `src/lib/storage.ts`

### Accessing Student Data in Firestore
Use the `storage` object (src/lib/storage.ts):
```typescript
const { students, quizzes, lessons } = await storage.getAll()
const attempts = await storage.getStudentQuizAttempts(studentId)
await storage.recordQuizAttempt(studentId, attempt)
```

### Persisting User Preferences
Add to `useAppStore` and include in the `persist` middleware's `partialize` function. Automatically synced to localStorage and available across sessions.

### Email-Based Student ID Extraction
Student ID is extracted from email prefix (e.g., `student123@arscience.school` → `student123`). Handled in `firebaseAuthContext.tsx`. Teachers use different email domains.

## Build & Deploy

- **TypeScript compilation**: `tsc --noEmit` runs before Vite build
- **Port**: Dev server runs on `5173` (configurable in vite.config.ts)
- **Output**: Build output in `dist/` folder
- **Environment**: `.env.local` must be present for both dev and build

## Dependencies Notes

- **React 18.2** with React Router 6.20
- **Firebase 12.11** (Auth + Firestore)
- **Zustand 4.4** for state (with persist middleware)
- **Tailwind CSS 3.3** for styling
- **TypeScript 5.2** with strict mode
- **Vite 5.0** with React plugin
- **ESLint 8.x** with TypeScript plugin (zero warnings policy)

Avoid upgrading major versions without testing thoroughly, especially Firebase and React Router.

## Debugging Tips

- **Theme not applying**: Check Zustand persistence is loading, verify `app-store` key in localStorage
- **Firebase auth errors**: Check `.env.local` has valid API key and matches Firebase project settings
- **Quiz attempts not saving**: Verify Firestore rules allow writes to `/students/{studentId}/quizAttempts/**`
- **Lazy route not loading**: Check component export name matches the destructured name in lazy() call
- **Unlock code not working**: Check code format and Firestore `/quizUnlockCodes` collection for matching entry
