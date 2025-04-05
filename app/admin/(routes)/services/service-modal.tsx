'use client';

import { useState } from 'react';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Modal } from "@/app/admin/components/ui/modal";
import { toast } from 'react-hot-toast';
import type { ServiceItem } from '@/app/admin/(routes)/services/columns';
import { createClient } from "@/lib/supabase/client";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceItem;
  onSuccess: () => void;
}

const defaultService: Partial<ServiceItem> = {
  name: '',
  category: '',
  duration: 30,
  price: 0,
  description: '',
  is_active: true,
};

export function ServiceModal({
  isOpen,
  onClose,
  service,
  onSuccess
}: ServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceItem>>(
    service || defaultService
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      if (service?.id) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', service.id);
          
        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([formData]);
          
        if (error) throw error;
      }
      
      toast.success(service ? 'Service updated successfully' : 'Service created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={service ? 'Edit Service' : 'Add New Service'}
      isOpen={isOpen}
      onClose={onClose}
      isLoading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter service name"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Enter category"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                min={0}
                step="0.01"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter service description"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active Service</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : service ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
  );
}
