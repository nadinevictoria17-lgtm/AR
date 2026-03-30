import type { AuthIdentity } from '../types'

export const STUDENT_CREDENTIALS: AuthIdentity[] = [
  { role: 'student', identifier: '000000', passwordHint: 'any password for debug' },
]

export const TEACHER_ACCOUNTS: AuthIdentity[] = [
  { role: 'teacher', identifier: 'teacher.debug@school.edu', passwordHint: 'any password for debug' },
]
