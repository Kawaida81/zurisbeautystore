import { createClient } from '@/lib/supabase/client'
import { NotificationTable } from '@/lib/types/database'

export type Notification = NotificationTable['Row']

// Get notifications for the current user
export async function getNotifications(status?: 'unread' | 'read' | 'archived'): Promise<{ data: Notification[] }> {
  const supabase = createClient()

  try {
    // First check if we have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('No active session:', sessionError)
      return { data: [] }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return { data: [] }
    }

    return { data: data || [] }
  } catch (e) {
    console.error('Error in getNotifications:', e)
    return { data: [] }
  }
}

// Get unread notifications count
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()

  try {
    // First check if we have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('No active session:', sessionError)
      return 0
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('status', 'unread')

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (e) {
    console.error('Error in getUnreadCount:', e)
    return 0
  }
}

// Mark a notification as read
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // First check if we have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('No active session:', sessionError)
      return false
    }

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('Error in markAsRead:', e)
    return false
  }
}

// Subscribe to new notifications
export async function subscribeToNotifications(
  callback: (notification: Notification) => void
): Promise<() => void> {
  const supabase = createClient()

  try {
    // First check if we have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('No active session:', sessionError)
      return () => {}
    }

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  } catch (e) {
    console.error('Error in subscribeToNotifications:', e)
    return () => {}
  }
}