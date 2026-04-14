/**
 * Shared Framer Motion variants and design-token maps used across
 * multiple screens and tabs. Import from here instead of re-defining locally.
 */
import type { SubjectKey } from '../types'

// ── Page transition ──────────────────────────────────────────────────────────

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
} as const

// ── Subject colour tokens ────────────────────────────────────────────────────

export const SUBJECT_STYLES: Record<SubjectKey, {
  /** Tinted icon/avatar background */
  bg:     string
  /** Subtle border tint */
  border: string
  /** Text colour */
  text:   string
  /** Pill / badge classes (bg + text + border) */
  badge:  string
  /** Solid dot / progress-bar colour */
  dot:    string
  /** Solid bar colour (same as dot, explicit alias) */
  bar:    string
  /** Human-readable label */
  label:  string
}> = {
  biology: {
    bg:     'bg-subject-biology/10',
    border: 'border-subject-biology/25',
    text:   'text-subject-biology',
    badge:  'bg-subject-biology/15 text-subject-biology border-subject-biology/30',
    dot:    'bg-subject-biology',
    bar:    'bg-subject-biology',
    label:  'Biology',
  },
  chemistry: {
    bg:     'bg-subject-chemistry/10',
    border: 'border-subject-chemistry/25',
    text:   'text-subject-chemistry',
    badge:  'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30',
    dot:    'bg-subject-chemistry',
    bar:    'bg-subject-chemistry',
    label:  'Chemistry',
  },
  physics: {
    bg:     'bg-subject-physics/10',
    border: 'border-subject-physics/25',
    text:   'text-subject-physics',
    badge:  'bg-subject-physics/15 text-subject-physics border-subject-physics/30',
    dot:    'bg-subject-physics',
    bar:    'bg-subject-physics',
    label:  'Physics',
  },
}
