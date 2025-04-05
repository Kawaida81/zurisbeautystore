'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import type { Worker } from './columns';
import { createClient } from "@/lib/supabase/client";

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  worker?: Worker | null;
}

export function WorkerModal({
  isOpen,
  onClose,
  onSubmit,
  worker
}: WorkerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Worker, 'id'>>({
    name: '',
    role: 'stylist',
    email: '',
    phone: '',
    status: 'active',
    certifications: [],
    start_date: new Date().toISOString().split('T')[0]
  });

  const supabase = createClient();

  useEffect(() => {
    if (worker) {
      setFormData({
        ...worker,
        start_date: new Date(worker.start_date).toISOString().split('T')[0]
      });
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (worker?.id) {
        const { error } = await supabase
          .from('workers')
          .update(formData)
          .eq('id', worker.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workers')
          .insert([formData]);
        if (error) throw error;
      }
      toast.success(worker ? 'Worker updated successfully' : 'Worker created successfully');
      onSubmit();
    } catch (error) {
      console.error('Error saving worker:', error);
      toast.error('Failed to save worker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={worker ? 'Edit Worker' : 'Add Worker'}
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: Worker['role']) => setFormData({ ...formData, role: value })}
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
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Worker['status']) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {worker ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
