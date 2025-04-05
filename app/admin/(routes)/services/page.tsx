'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/app/admin/components/ui/card";
import { Heading } from "@/app/admin/components/ui/heading";
import { Separator } from "@/app/admin/components/ui/separator";
import { DataTable } from "@/app/admin/components/ui/data-table";
import { Button } from "@/app/admin/components/ui/button";
import { Plus } from "lucide-react";
import { createColumns, type ServiceItem } from "@/app/admin/(routes)/services/columns";
import { createClient } from "@/lib/supabase/client";
import { ServiceModal } from "./service-modal";
import { LoadingSpinner } from '@/app/admin/components/loading-spinner';
import { toast } from 'react-hot-toast';

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | undefined>();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          name,
          category,
          duration,
          price,
          description,
          is_active
        `);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (service: ServiceItem) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      await fetchServices();
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service. Please try again.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedService(undefined);
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Service Management"
            description="Manage your beauty services and pricing"
            className="text-2xl sm:text-3xl"
          />
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
        <Separator />
        <Card className="p-4">
          {loading ? (
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
                data={services}
                searchKey="name"
              />
            </div>
          )}
        </Card>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        service={selectedService}
        onSuccess={fetchServices}
      />
    </div>
  );
}
