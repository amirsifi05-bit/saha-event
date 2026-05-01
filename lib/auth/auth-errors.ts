/** Maps Supabase auth errors to user-facing signup messages. */
export function formatSignupError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('already registered') ||
    lower.includes('user already') ||
    lower.includes('already been registered')
  ) {
    return 'An account with this email already exists.'
  }
  return message
}

/** Maps Supabase sign-in errors to friendly English. */
export function formatSignInError(message: string): string {
  const trimmed = message.trim()
  if (trimmed === 'Invalid login credentials') {
    return 'Incorrect email or password.'
  }
  if (trimmed === 'Email not confirmed') {
    return 'Please verify your email before signing in.'
  }
  return trimmed
}
