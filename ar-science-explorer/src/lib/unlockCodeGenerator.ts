/**
 * Utility for generating randomized unlock codes for quiz retakes
 */

export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateUnlockCode(quizId: string, studentId: string, expiresAtDate?: Date): {
  code: string
  id: string
  expiresAt: string
} {
  const code = generateRandomCode(6)
  const id = `unlock-${quizId}-${studentId}-${Date.now()}`
  const expiresAt = (expiresAtDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString()
  return { code, id, expiresAt }
}
