type LoginRole = 'student' | 'teacher'

export function validateIdentifier(
  role: LoginRole,
  value: string
): string {
  if (role === 'student') {
    // Allow either 6-digit student ID (00-0000 format), plain 6 digits, or email address
    const isFormattedStudentId = /^\d{2}-\d{4}$/.test(value)
    const isPlainStudentId = /^\d{6}$/.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    if (!isFormattedStudentId && !isPlainStudentId && !isEmail) {
      return 'Enter 6-digit ID (00-0000) or email address'
    }
    return ''
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email'
  return ''
}

export function validatePassword(_role: LoginRole, value: string): string {
  if (!value.trim()) return 'Password is required'
  return ''
}
