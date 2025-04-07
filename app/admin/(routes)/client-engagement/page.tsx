'use client';

import { useState, useEffect } from "react";
import { MessageModal } from "./message-modal";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import type { Message, MessageType, MessageStatus } from "./columns";
import { LoadingSpinner } from "@/app/admin/components/loading-spinner";

interface DatabaseUser {
  id: string;
  full_name: string | null;
}

interface DatabaseAppointment {
  id: string;
  appointment_date: string;
  time: string;
}

interface MessageDetails {
  client_id: string;
  appointment_id: string | null;
  type: MessageType;
  subject: string;
  message: string;
  status: MessageStatus;
  scheduled_for: string;
}

interface DatabaseActivity {
  id: string;
  details: MessageDetails;
  client: DatabaseUser | null;
  appointment: DatabaseAppointment | null;
}

export default function ClientEngagementPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const supabase = createClient();

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          id,
          details,
          client:users!client_id (
            id,
            full_name
          ),
          appointment:appointments!appointment_id (
            id,
            appointment_date,
            time
          )
        `)
        .eq('action', 'message')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activities = (data || []) as unknown as DatabaseActivity[];
      const formattedMessages: Message[] = activities.map((activity) => {
        if (!activity.client) {
          throw new Error(`No client found for activity ${activity.id}`);
        }

        return {
          id: activity.id,
          client_id: activity.details.client_id,
          appointment_id: activity.details.appointment_id,
          type: activity.details.type,
          subject: activity.details.subject,
          message: activity.details.message,
          status: activity.details.status,
          scheduled_for: activity.details.scheduled_for,
          client: {
            id: activity.client.id,
            full_name: activity.client.full_name
          },
          appointment: activity.appointment ? {
            id: activity.appointment.id,
            appointment_date: activity.appointment.appointment_date,
            time: activity.appointment.time
          } : undefined
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setIsModalOpen(true);
  };

  const handleDelete = async (message: Message) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('id', message.id);

      if (error) throw error;

      toast.success('Message deleted successfully');
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  const onModalClose = () => {
    setIsModalOpen(false);
    setEditingMessage(null);
  };

  const onModalSubmit = () => {
    fetchMessages();
    onModalClose();
  };

  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Client Engagement"
            description="Manage client communications and messages"
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
        <Separator />
        {isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={messages}
            searchKey="subject"
          />
        )}
        <MessageModal 
          isOpen={isModalOpen}
          onClose={onModalClose}
          onSubmit={onModalSubmit}
          message={editingMessage}
        />
      </div>
    </div>
  );
}
