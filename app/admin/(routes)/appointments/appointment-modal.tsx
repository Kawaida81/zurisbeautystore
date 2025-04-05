'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import type { Appointment } from './columns';
import { createClient } from "@/lib/supabase/client";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  appointment?: Appointment | null;
}

interface FormData extends Omit<Appointment, 'id' | 'customer' | 'service' | 'worker'> {
  customerId: string;
  serviceId: string;
  workerId: string;
}

interface SelectOption {
  id: string;
  name: string;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  appointment
}: AppointmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    serviceId: '',
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    status: 'scheduled',
    notes: ''
  });

  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [workers, setWorkers] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (appointment) {
      setFormData({
        customerId: appointment.customer.id,
        serviceId: appointment.service.id,
        workerId: appointment.worker.id,
        date: appointment.date,
        time: appointment.time,
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
      const [customersData, servicesData, workersData] = await Promise.all([
        supabase.from('customers').select('id, name'),
        supabase.from('services').select('id, name'),
        supabase.from('workers').select('id, name').eq('status', 'active')
      ]);

      if (customersData.error) throw customersData.error;
      if (servicesData.error) throw servicesData.error;
      if (workersData.error) throw workersData.error;

      setCustomers(customersData.data || []);
      setServices(servicesData.data || []);
      setWorkers(workersData.data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (appointment?.id) {
        const { error } = await supabase
          .from('appointments')
          .update({
            customer_id: formData.customerId,
            service_id: formData.serviceId,
            worker_id: formData.workerId,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status,
            notes: formData.notes
          })
          .eq('id', appointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([{
            customer_id: formData.customerId,
            service_id: formData.serviceId,
            worker_id: formData.workerId,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status,
            notes: formData.notes
          }]);
        if (error) throw error;
      }
      toast.success(appointment ? 'Appointment updated successfully' : 'Appointment created successfully');
      onSubmit();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Modal
        title="Loading"
        isOpen={isOpen}
        onClose={onClose}
      >
        <div className="flex items-center justify-center h-24">
          Loading...
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={appointment ? 'Edit Appointment' : 'Add Appointment'}
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}
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
              onValueChange={(value: Appointment['status']) => setFormData({ ...formData, status: value })}
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
            <Button type="submit">
              {appointment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
