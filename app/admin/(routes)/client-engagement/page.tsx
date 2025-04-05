'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createColumns } from "./columns";
import { MessageModal } from "./message-modal";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from '@/app/admin/components/loading-spinner';
import { toast } from 'react-hot-toast';
import type { Message } from './columns';

export default function ClientEngagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          customer:customers(id, full_name),
          appointment:appointments(id, date, time)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMessage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setIsModalOpen(true);
  };

  const handleDelete = async (message: Message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      await fetchMessages();
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMessage(null);
  };

  const handleModalSubmit = async () => {
    await fetchMessages();
    handleModalClose();
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Client Engagement"
            description="Manage customer communications and notifications"
          />
          <Button 
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
        <Separator />
        <Card className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={createColumns({
                  onEdit: handleEdit,
                  onDelete: handleDelete
                })}
                data={messages}
                searchKey="message"
              />
            </div>
          )}
        </Card>
      </div>
      <MessageModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        message={editingMessage}
      />
    </div>
  );
}
