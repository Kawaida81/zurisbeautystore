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
import { toast } from 'react-hot-toast';
import type { ServiceItem } from '@/app/admin/(routes)/services/columns';
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  category: z.string().min(1, 'Category is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price cannot be negative'),
  description: z.string().min(1, 'Description is required'),
  is_active: z.boolean().default(true)
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceItem;
  onSuccess: () => void;
}

export function ServiceModal({
  isOpen,
  onClose,
  service,
  onSuccess
}: ServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: service || {
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      is_active: true,
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      if (service?.id) {
        // Update existing service
        const { error } = await supabase.rpc('update_service', {
          p_service_id: service.id,
          p_name: data.name,
          p_description: data.description,
          p_category: data.category,
          p_duration: data.duration,
          p_price: data.price,
          p_is_active: data.is_active
        });
        
        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase.rpc('create_service', {
          p_name: data.name,
          p_description: data.description,
          p_category: data.category,
          p_duration: data.duration,
          p_price: data.price,
          p_is_active: data.is_active
        });
        
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter service name"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter category"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (mins)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (KES)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step="0.01"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter service description"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <FormLabel className="font-normal">Active Service</FormLabel>
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
              {loading ? 'Saving...' : service ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
