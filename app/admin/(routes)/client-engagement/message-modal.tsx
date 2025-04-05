'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import type { Message } from './columns';
import { createClient } from "@/lib/supabase/client";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  message?: Message | null;
}

interface Customer {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  customer: {
    id: string;
    full_name: string;
  };
}

export function MessageModal({
  isOpen,
  onClose,
  onSubmit,
  message
}: MessageModalProps) {
  const [formData, setFormData] = useState({
    customer_id: '',
    appointment_id: '',
    type: 'appointment_reminder' as Message['type'],
    subject: '',
    message: '',
    status: 'scheduled' as Message['status'],
    scheduled_for: new Date().toISOString().slice(0, 16)
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (message) {
      setFormData({
        customer_id: message.customer.id,
        appointment_id: message.appointment?.id || '',
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
      const [customersData, appointmentsData] = await Promise.all([
        supabase.from('customers').select('id, full_name'),
        supabase.from('appointments').select('id, date, time, customer:customers!inner(id, full_name)')
          .gte('date', new Date().toISOString().split('T')[0])
      ]);

      if (customersData.error) throw customersData.error;
      if (appointmentsData.error) throw appointmentsData.error;

      setCustomers(customersData.data || []);
      setAppointments(appointmentsData.data?.map(apt => ({
        ...apt,
        customer: Array.isArray(apt.customer) ? apt.customer[0] : apt.customer
      })) || []);
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
      if (message?.id) {
        const { error } = await supabase
          .from('messages')
          .update({
            customer_id: formData.customer_id,
            appointment_id: formData.appointment_id || null,
            type: formData.type,
            subject: formData.subject,
            message: formData.message,
            status: formData.status,
            scheduled_for: formData.scheduled_for
          })
          .eq('id', message.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .insert([{
            customer_id: formData.customer_id,
            appointment_id: formData.appointment_id || null,
            type: formData.type,
            subject: formData.subject,
            message: formData.message,
            status: formData.status,
            scheduled_for: formData.scheduled_for
          }]);
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
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value: string) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name}
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
                value={formData.appointment_id}
                onValueChange={(value: string) => setFormData({ ...formData, appointment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments
                    .filter(apt => apt.customer.id === formData.customer_id)
                    .map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {new Date(appointment.date).toLocaleDateString()} {appointment.time}
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
        </form>
    </Modal>
  );
}
