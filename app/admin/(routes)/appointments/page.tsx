'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AppointmentModal } from './appointment-modal';
import { Appointment, createColumns } from './columns';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const supabase = createClient();

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*, customer:client_id(*), service:service_id(*), worker:worker_id(*)');

      if (error) {
        toast.error('Failed to fetch appointments');
        return;
      }

      if (data) {
        const mappedAppointments: Appointment[] = data.map(appointment => ({
          id: appointment.id,
          date: appointment.appointment_date,
          appointment_date: appointment.appointment_date,
          duration: 60, // Default duration in minutes
          client_id: appointment.client_id,
          created_at: appointment.created_at,
          notes: appointment.notes,
          service_id: appointment.service_id,
          service_name: appointment.service?.name,
          service: appointment.service?.name || 'N/A',
          status: appointment.status,
          worker_id: appointment.worker_id,
          customer: appointment.customer,
          worker: appointment.worker,
          time: new Date(appointment.appointment_date).toLocaleTimeString()
        }));
        setAppointments(mappedAppointments);
      }
    } catch (error) {
      toast.error('An error occurred while fetching appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreate = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDelete = async (appointment: Appointment) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (error) throw error;
      await fetchAppointments();
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Appointments</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Appointment
        </Button>
      </div>
      <div className="rounded-md border">
        <DataTable
          columns={createColumns({
            onEdit: handleEdit,
            onDelete: handleDelete
          })}
          data={appointments}
          searchKey="customer.name"
        />
      </div>
      <AppointmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={editingAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
