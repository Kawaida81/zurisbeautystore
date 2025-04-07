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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'worker');

      if (error) {
        toast.error('Failed to fetch workers');
        return;
      }

      if (data) {
        setWorkers(data.map(worker => ({
          id: worker.id,
          name: worker.full_name,
          email: worker.email,
          phone: worker.phone || '',
          role: worker.role,
          created_at: worker.created_at,
          updated_at: worker.updated_at
        })));
      }
    } catch (error) {
      toast.error('An error occurred while fetching workers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleCreate = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete worker');
        return;
      }

      setWorkers(workers.filter(worker => worker.id !== id));
      toast.success('Worker deleted successfully');
    } catch (error) {
      toast.error('An error occurred while deleting worker');
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
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Workers</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Worker
        </Button>
      </div>
      <div className="rounded-md border">
        <DataTable
          columns={createColumns({
            onEdit: handleEdit,
            onDelete: handleDelete
          })}
          data={workers}
          searchKey="name"
        />
      </div>
      <WorkerModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        worker={editingWorker}
        onSuccess={fetchWorkers}
      />
    </div>
  );
}
