'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createColumns } from "./columns";
import { createClient } from "@/lib/supabase/client";
import { AppointmentModal } from "./appointment-modal";
import { LoadingSpinner } from '@/app/admin/components/loading-spinner';
import { toast } from 'react-hot-toast';
import type { Appointment } from "./columns";

export default function AppointmentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          worker:workers(name),
          service:services(name),
          customer:customers(name)
        `);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleModalSubmit = async () => {
    await fetchAppointments();
    handleModalClose();
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Appointments"
            description="Manage your salon appointments"
          />
          <Button 
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
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
                data={appointments}
                searchKey="customer.name"
              />
            </div>
          )}
        </Card>
      </div>
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        appointment={editingAppointment}
      />
    </div>
  );
}
