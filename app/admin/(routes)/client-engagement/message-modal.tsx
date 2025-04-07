'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import { createClient } from "@/lib/supabase/client";
import type { Message } from './columns';

interface DatabaseUser {
  id: string;
  full_name: string | null;
}

interface RawAppointment {
  id: string;
  appointment_date: string;
  time: string;
  client_id: string | null;
  client: DatabaseUser | null;
}

interface DatabaseAppointment {
  id: string;
  appointment_date: string;
  time: string;
  client_id: string;
  client: {
    id: string;
    full_name: string;
  };
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  message?: Message | null;
}

export function MessageModal({
  isOpen,
  onClose,
  onSubmit,
  message
}: MessageModalProps) {
  const [formData, setFormData] = useState<Omit<Message, 'id' | 'client' | 'appointment'>>({
    client_id: '',
    appointment_id: null,
    type: 'appointment_reminder',
    subject: '',
    message: '',
    status: 'scheduled',
    scheduled_for: new Date().toISOString().slice(0, 16)
  });

  const [clients, setClients] = useState<Message['client'][]>([]);
  const [appointments, setAppointments] = useState<DatabaseAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (message) {
      setFormData({
        client_id: message.client_id,
        appointment_id: message.appointment_id,
        type: message.type,
        subject: message.subject,
        message: message.message,
        status: message.status,
        scheduled_for: new Date(message.scheduled_for).toISOString().slice(0, 16)
      });
    }
    fetchData();
  }, [message]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [clientsData, appointmentsData] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'client'),
        supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            time,
            client_id,
            client:users!client_id (
              id,
              full_name
            )
          `)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
      ]);

      if (clientsData.error) throw clientsData.error;
      if (appointmentsData.error) throw appointmentsData.error;

      setClients(clientsData.data || []);

      const rawAppointments = (appointmentsData.data || []) as unknown as RawAppointment[];
      const validAppointments = rawAppointments
        .filter((apt): apt is RawAppointment => 
          apt.client_id !== null && 
          apt.client !== null &&
          apt.client.full_name !== null
        )
        .map((apt): DatabaseAppointment => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          time: apt.time,
          client_id: apt.client_id!,
          client: {
            id: apt.client!.id,
            full_name: apt.client!.full_name!
          }
        }));

      setAppointments(validAppointments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const messageData = {
        action: 'message',
        details: {
          client_id: formData.client_id,
          appointment_id: formData.appointment_id,
          type: formData.type,
          subject: formData.subject,
          message: formData.message,
          status: formData.status,
          scheduled_for: formData.scheduled_for
        }
      };

      if (message?.id) {
        const { error } = await supabase
          .from('user_activities')
          .update(messageData)
          .eq('id', message.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_activities')
          .insert([messageData]);
        if (error) throw error;
      }
      toast.success(message ? 'Message updated successfully' : 'Message created successfully');
      onSubmit();
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('Failed to save message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={message ? 'Edit Message' : 'New Message'}
      description="Create or edit a message to send to a client"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.full_name || 'Unnamed Client'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Message['type']) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.type === 'appointment_reminder' && (
            <div>
              <Label htmlFor="appointment">Related Appointment</Label>
              <Select
                value={formData.appointment_id || ''}
                onValueChange={(value) => setFormData({ ...formData, appointment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments
                    .filter(apt => apt.client_id === formData.client_id)
                    .map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {new Date(appointment.appointment_date).toLocaleDateString()} {appointment.time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Message subject"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your message"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="scheduled_for">Schedule For</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Message['status']) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {message ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
