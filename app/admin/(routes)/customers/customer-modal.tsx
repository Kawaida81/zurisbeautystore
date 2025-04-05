'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Modal } from "@/app/admin/components/ui/modal";
import type { Customer } from './columns';
import { createClient } from "@/lib/supabase/client";
import { toast } from 'react-hot-toast';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  customer?: Customer | null;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer
}: CustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'created_at' | 'appointments' | 'total_spent'>>({
    full_name: '',
    email: '',
    phone_number: '',
    loyalty_points: 0
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name,
        email: customer.email,
        phone_number: customer.phone_number,
        loyalty_points: customer.loyalty_points
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (customer?.id) {
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone_number: formData.phone_number,
            loyalty_points: formData.loyalty_points
          })
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            full_name: formData.full_name,
            email: formData.email,
            phone_number: formData.phone_number,
            loyalty_points: formData.loyalty_points
          }]);
        if (error) throw error;
      }
      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
      onSubmit();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={customer ? 'Edit Customer' : 'Add Customer'}
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label htmlFor="loyalty_points">Loyalty Points</Label>
            <Input
              id="loyalty_points"
              type="number"
              value={formData.loyalty_points}
              onChange={(e) => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {customer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
