import type { QuizPhase } from '../types'

/**
 * Built-in quiz id scheme:
 *   builtin-${lessonId}-pre    → the lesson's pre-test
 *   builtin-${lessonId}-post   → the lesson's post-test
 *   builtin-${lessonId}        → LEGACY (unsuffixed) — treated as the post-test
 *
 * Parsing this is duplicated across QuizScreen, ARLabScreen and storage, so it
 * lives here to prevent drift. Non-builtin (teacher) quiz ids return null lessonId.
 */
export interface ParsedBuiltinId {
  isBuiltin: boolean
  lessonId: string | null
  phase: QuizPhase
}

export function parseBuiltinId(quizId: string): ParsedBuiltinId {
  if (!quizId.startsWith('builtin-')) {
    return { isBuiltin: false, lessonId: null, phase: 'post' }
  }
  const rest = quizId.slice('builtin-'.length)
  if (rest.endsWith('-pre')) {
    return { isBuiltin: true, lessonId: rest.slice(0, -'-pre'.length), phase: 'pre' }
  }
  if (rest.endsWith('-post')) {
    return { isBuiltin: true, lessonId: rest.slice(0, -'-post'.length), phase: 'post' }
  }
  // Legacy unsuffixed id — the whole remainder is the lessonId, phase defaults to post.
  return { isBuiltin: true, lessonId: rest, phase: 'post' }
}

/** Build a phase-scoped built-in quiz id for a lesson. */
export function builtinQuizId(lessonId: string, phase: QuizPhase): string {
  return `builtin-${lessonId}-${phase}`
}
