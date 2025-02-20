import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Please fill in all fields' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return { error: error.message }
    }

    window.location.href = '/sign-in?message=Password updated successfully'
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'An error occurred while resetting your password' }
  }
} 