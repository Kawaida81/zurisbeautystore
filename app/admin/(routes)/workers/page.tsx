'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/app/admin/components/ui/card";
import { Heading } from "@/app/admin/components/ui/heading";
import { Separator } from "@/app/admin/components/ui/separator";
import { DataTable } from "@/app/admin/components/ui/data-table";
import { Button } from "@/app/admin/components/ui/button";
import { Plus } from "lucide-react";
import { createColumns } from "./columns";
import { createClient } from "@/lib/supabase/client";
import { WorkerModal } from "./worker-modal";
import { LoadingSpinner } from '@/app/admin/components/loading-spinner';
import { toast } from 'react-hot-toast';
import type { Worker } from "./columns";

export default function WorkersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select('*');

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleDelete = async (worker: Worker) => {
    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', worker.id);

      if (error) throw error;
      await fetchWorkers();
      toast.success('Worker deleted successfully');
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast.error('Failed to delete worker. Please try again.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingWorker(null);
  };

  const handleModalSubmit = async () => {
    await fetchWorkers();
    handleModalClose();
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Workers"
            description="Manage your beauty salon workers"
          />
          <Button 
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
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
                data={workers}
                searchKey="name"
              />
            </div>
          )}
        </Card>
      </div>
      <WorkerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        worker={editingWorker}
      />
    </div>
  );
}
