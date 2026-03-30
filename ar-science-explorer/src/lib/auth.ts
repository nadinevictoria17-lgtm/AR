import { STUDENT_CREDENTIALS, TEACHER_ACCOUNTS } from '../data/auth'

type LoginRole = 'student' | 'teacher'

export function getAllowedIdentifiers(role: LoginRole): string[] {
  if (role === 'student') return STUDENT_CREDENTIALS.map((item) => item.identifier)
  return TEACHER_ACCOUNTS.map((item) => item.identifier)
}

export function validateIdentifier(
  role: LoginRole,
  value: string
): string {
  if (role === 'student') {
    if (!/^\d{6}$/.test(value)) return 'Student ID must be 6 digits'
    if (!getAllowedIdentifiers(role).includes(value)) return 'Student ID not found'
    return ''
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email'
  if (!getAllowedIdentifiers(role).includes(value)) return 'Teacher account not found'
  return ''
}

export function validatePassword(_role: LoginRole, value: string): string {
  if (!value.trim()) return 'Password is required'
  return ''
}
