type LoginRole = 'student' | 'teacher'

export function validateIdentifier(
  role: LoginRole,
  value: string
): string {
  if (role === 'student') {
    // Allow either 6-digit student ID or email address
    const isStudentId = /^\d{6}$/.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    if (!isStudentId && !isEmail) {
      return 'Enter 6-digit ID or email address'
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
