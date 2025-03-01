import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

export type Notification = Database['public']['Tables']['notifications']['Row']

// Get notifications for the current user
export async function getNotifications(status?: 'unread' | 'read' | 'archived'): Promise<{ data: Notification[] }> {
  try {
    const supabase = createClient()
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return { data: [] }
    }

    return { data: (data || []) as Notification[] }
  } catch (error) {
    console.error('Error in getNotifications:', error)
    return { data: [] }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error)
    return { success: false }
  }
}

// Get unread notifications count
export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  try {
    const supabase = createClient()
    
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return { count: 0 }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error getting unread notifications count:', error)
      return { count: 0 }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadNotificationsCount:', error)
    return { count: 0 }
  }
}

// Subscribe to new notifications
export function subscribeToNotifications(callback: (notification: Notification) => void) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        callback(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
} 