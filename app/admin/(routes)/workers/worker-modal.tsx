'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Worker } from './columns';
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

interface WorkerModalProps {
  open: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSuccess: () => void;
}

type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Partial<Omit<UserInsert, 'id'>>;

export function WorkerModal({
  open,
  onClose,
  worker,
  onSuccess
}: WorkerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<Worker>({
    defaultValues: {
      name: worker?.name || '',
      email: worker?.email || '',
      phone: worker?.phone || '',
      role: worker?.role || 'worker'
    }
  });

  useEffect(() => {
    if (worker) {
      form.reset({
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        role: 'worker'
      });
    }
  }, [worker, form]);

  const onSubmit = async (data: Worker) => {
    try {
      setIsLoading(true);

      if (worker) {
        // Update existing worker
        const updateData: UserUpdate = {
          full_name: data.name,
          email: data.email,
          phone: data.phone || null,
          role: 'worker'
        };

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', worker.id);

        if (error) throw error;
      } else {
        // Create new worker
        const insertData: UserInsert = {
          email: data.email,
          full_name: data.name,
          phone: data.phone || null,
          role: 'worker',
          is_active: true
        };

        const { error } = await supabase
          .from('users')
          .insert([insertData]);

        if (error) throw error;
      }

      toast.success(`Worker ${worker ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Failed to ${worker ? 'update' : 'create'} worker`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={worker ? 'Edit Worker' : 'Create Worker'}
      isOpen={open}
      onClose={onClose}
      isLoading={isLoading}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...form.register('name', { required: true })}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email', { required: true })}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={form.watch('role')}
            onValueChange={(value: Worker['role']) => form.setValue('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stylist">Stylist</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                {worker ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              worker ? 'Update' : 'Create'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
