'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'sonner';
import type { Appointment } from './columns';
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AppointmentStatusEnum } from '@/lib/types/database';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment | null;
}

interface FormData {
  customerId: string;
  serviceId: string;
  workerId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string;
}

interface SelectOption {
  id: string;
  name: string;
}

export function AppointmentModal({
  open,
  onClose,
  onSuccess,
  appointment
}: AppointmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customerId: appointment?.customer?.id || '',
    serviceId: appointment?.service_id || '',
    workerId: appointment?.worker_id || '',
    date: appointment?.date || new Date().toISOString().split('T')[0],
    time: appointment?.time || '09:00',
    duration: appointment?.duration || 30,
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || ''
  });

  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [workers, setWorkers] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (appointment) {
      setFormData({
        customerId: appointment.customer?.id || '',
        serviceId: appointment.service_id || '',
        workerId: appointment.worker_id || '',
        date: new Date(appointment.date).toISOString().split('T')[0],
        time: new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes || ''
      });
    }
    fetchOptions();
  }, [appointment]);

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      const [clientsData, servicesData, workersData] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'client')
          .then(({ data }) => data?.map(d => ({ id: d.id, name: d.full_name })) || []),
        supabase
          .from('services')
          .select('id, name')
          .then(({ data }) => data || []),
        supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'worker')
          .then(({ data }) => data?.map(d => ({ id: d.id, name: d.full_name })) || [])
      ]);

      setCustomers(clientsData);
      setServices(servicesData);
      setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Combine date and time
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);

    const appointmentData = {
      client_id: formData.customerId,
      service_id: formData.serviceId,
      worker_id: formData.workerId || null,
      appointment_date: appointmentDate.toISOString(),
      time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: formData.status as AppointmentStatusEnum,
      notes: formData.notes || null,
      service: '', // Will be populated by trigger
      total_amount: 0 // Will be calculated by trigger
    };

    try {
      if (appointment?.id) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);

        if (error) throw error;
      }

      toast.success(appointment ? 'Appointment updated successfully' : 'Appointment created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !customers.length) {
    return (
      <Modal
        title="Loading"
        isOpen={open}
        onClose={onClose}
      >
        <div className="flex items-center justify-center h-24">
          <LoadingSpinner size={40} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={appointment ? "Edit Appointment" : "Create Appointment"}
      description={appointment ? "Make changes to the appointment." : "Add a new appointment."}
      isOpen={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={formData.customerId}
            onValueChange={(value: string) => setFormData({ ...formData, customerId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="service">Service</Label>
          <Select
            value={formData.serviceId}
            onValueChange={(value: string) => setFormData({ ...formData, serviceId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="worker">Worker</Label>
          <Select
            value={formData.workerId}
            onValueChange={(value: string) => setFormData({ ...formData, workerId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: string) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional notes"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {appointment ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
