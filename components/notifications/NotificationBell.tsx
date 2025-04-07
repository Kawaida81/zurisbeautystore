'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getNotifications,
  getUnreadCount as getUnreadNotificationsCount,
  markAsRead as markNotificationAsRead,
  subscribeToNotifications
} from '@/lib/queries/notifications'
import type { Notification } from '@/lib/queries/notifications'
import { useSupabase } from '@/components/providers/supabase-provider'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useSupabase()
  const supabase = createClient()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Load initial notifications
        await loadNotifications()
        // Load unread count
        await loadUnreadCount()
        
        // Subscribe to new notifications
        unsubscribe = await subscribeToNotifications((newNotification) => {
          // Only add notification if it's for the current user
          if (newNotification.user_id === user?.id) {
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        })

        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error)
      }
    };

    if (user) {
      initializeNotifications();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user])

  const loadNotifications = async () => {
    const { data } = await getNotifications()
    // Filter notifications for the current user
    const userNotifications = data.filter(notification => notification.user_id === user?.id)
    setNotifications(userNotifications)
  }

  const loadUnreadCount = async () => {
    const count = await getUnreadNotificationsCount()
    setUnreadCount(count)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {notification.status === 'unread' && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 