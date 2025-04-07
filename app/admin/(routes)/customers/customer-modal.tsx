'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from "@/app/admin/components/ui/input";
import { Button } from "@/app/admin/components/ui/button";
import { Label } from "@/app/admin/components/ui/label";
import { Modal } from "@/app/admin/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Customer } from './columns';
import { createClient } from "@/lib/supabase/client";
import { toast } from 'react-hot-toast';

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required')
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  customer
}: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: customer || {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      if (customer?.id) {
        const { error } = await supabase
          .from('users')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert([{
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            role: 'client',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
      }
      
      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      if (error.message.includes('email already exists')) {
        toast.error('A customer with this email already exists');
      } else {
        toast.error('Failed to save customer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={customer ? 'Edit Customer' : 'Add Customer'}
      isOpen={isOpen}
      onClose={onClose}
      isLoading={loading}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Doe"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="john@example.com"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="+254712345678"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter customer's address"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
