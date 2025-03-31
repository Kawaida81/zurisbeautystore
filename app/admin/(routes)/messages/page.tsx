'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Button } from '@/app/admin/components/ui/button'
import { Badge } from '@/app/admin/components/ui/badge'

interface Message {
  id: string
  subject: string
  content: string
  created_at: string
  status: 'unread' | 'read' | 'replied'
  sender: {
    full_name: string
    email: string
  }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(full_name, email)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-500/10 text-blue-500'
      case 'read':
        return 'bg-gray-500/10 text-gray-500'
      case 'replied':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
      </div>
      <div className="grid gap-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{message.subject}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>From: {message.sender.full_name}</span>
                    <span>•</span>
                    <span>{message.sender.email}</span>
                    <span>•</span>
                    <span>{new Date(message.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(message.status)}>
                  {message.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{message.content}</p>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Mark as Read
                </Button>
                <Button size="sm">
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 