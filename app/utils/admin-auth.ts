import { createClient } from '@/lib/supabase/client'

/**
 * Check if a user has admin privileges
 * @param userId The ID of the user to check
 * @returns A promise that resolves to a boolean indicating if the user is an admin
 */
export async function checkAdminPrivileges(userId: string): Promise<boolean> {
  if (!userId) return false
  
  try {
    const supabase = createClient()
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .single()
    
    if (error || !userData) {
      console.error('Error checking admin privileges:', error)
      return false
    }
    
    return userData.role === 'admin' && userData.is_active
  } catch (error) {
    console.error('Error checking admin privileges:', error)
    return false
  }
} 